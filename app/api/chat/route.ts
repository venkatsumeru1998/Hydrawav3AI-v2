import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { connectToDatabase } from '@/lib/mongoose';
import Report from '@/models/Report';
import { ChatApiRequest } from '@/lib/types';

/* ------------------------------------------------------------------ */
/* OpenAI Client */
/* ------------------------------------------------------------------ */
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID!;

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function extractInput(body: { input?: string } | ChatApiRequest): string {
    if ('input' in body && body.input?.trim()) {
        return body.input.trim();
    }

    if ('formData' in body && body.formData) {
        return JSON.stringify(body.formData, null, 2);
    }

    throw new Error('Missing input to send to AI');
}

function tryParseJSON(text: string): { isJson: boolean; value: any } {
    try {
        let clean = text.trim();

        // Handle double-encoded JSON
        if (
            (clean.startsWith('"') && clean.endsWith('"')) ||
            (clean.startsWith("'") && clean.endsWith("'"))
        ) {
            clean = JSON.parse(clean);
        }

        const parsed = JSON.parse(clean);
        return { isJson: true, value: parsed };
    } catch {
        return { isJson: false, value: text };
    }
}

/* ------------------------------------------------------------------ */
/* POST */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
    try {
        /* ---------------- Parse Input ---------------- */
        const body = await request.json();
        const inputText = extractInput(body);

        /* ---------------- Create Thread ---------------- */
        const thread = await openai.beta.threads.create();
        const threadId = thread.id;

        if (!threadId?.startsWith('thread_')) {
            throw new Error('Invalid thread ID received from OpenAI');
        }

        /* ---------------- Add User Message ---------------- */
        await openai.beta.threads.messages.create(threadId, {
            role: 'user',
            content: inputText,
        });

        /* ---------------- Create Run ---------------- */
        const run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: ASSISTANT_ID,
        });

        const runId = run.id;

        if (!runId?.startsWith('run_')) {
            throw new Error('Invalid run ID received from OpenAI');
        }

        /* ---------------- Poll Run ---------------- */
        let status = run.status;
        let polls = 0;
        const MAX_POLLS = 120;

        while (status !== 'completed' && polls < MAX_POLLS) {
            await sleep(700);
            polls++;

            const updatedRun = await openai.beta.threads.runs.retrieve(
                runId,
                { thread_id: threadId }
            );

            status = updatedRun.status;

            if (status === 'failed' || status === 'cancelled') {
                const err = updatedRun.last_error?.message || 'Unknown error';
                throw new Error(`Assistant run ${status}: ${err}`);
            }
        }

        if (status !== 'completed') {
            throw new Error('Assistant run timed out');
        }

        /* ---------------- Fetch Messages ---------------- */
        const messages = await openai.beta.threads.messages.list(threadId);

        const assistantMessage = messages.data.find(
            (m) => m.role === 'assistant'
        );

        const responseText =
            assistantMessage?.content[0]?.type === 'text'
                ? assistantMessage.content[0].text.value
                : 'No response generated';

        /* ---------------- Parse Response ---------------- */
        const { isJson, value } = tryParseJSON(responseText);

        /* ---------------- Save to DB (if report-like) ---------------- */
        let savedReport: any = null;

        if (
            isJson &&
            value &&
            (value.schema_version || value.report_type)
        ) {
            try {
                await connectToDatabase();
                
                // Extract name, email, phoneNumber from formData if available
                const formData = 'formData' in body ? body.formData : null;
                if (formData) {
                    // Ensure personal_snapshot exists
                    if (!value.personal_snapshot) {
                        value.personal_snapshot = {};
                    }
                    // Add name, email, phoneNumber to personal_snapshot
                    if (formData.name) {
                        value.personal_snapshot.name = formData.name;
                    }
                    if (formData.email) {
                        value.personal_snapshot.email = formData.email;
                    }
                    if (formData.phoneNumber) {
                        value.personal_snapshot.phoneNumber = formData.phoneNumber;
                    }
                }
                
                const doc = new Report(value);
                const saved = await doc.save();
                savedReport = JSON.parse(JSON.stringify(saved));
            } catch (dbErr) {
                console.error('MongoDB save failed:', dbErr);
            }
        }

        /* ---------------- Response ---------------- */
        return NextResponse.json({
            success: true,
            message: 'Response generated successfully',
            data: {
                response: isJson
                    ? JSON.stringify(value, null, 2)
                    : responseText,
                response_id: savedReport?._id ?? null,
                is_json: isJson,
                parsed_response: isJson ? value : null,
            },
        });
    } catch (error: any) {
        console.error('Assistant API Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Unexpected error',
            },
            { status: 500 }
        );
    }
}

/* ------------------------------------------------------------------ */
/* GET (Health Check) */
/* ------------------------------------------------------------------ */
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Hydrawav3 Assistant API running',
        example: {
            input: 'Generate a general_mobility_kinetic_chain report',
        },
    });
}

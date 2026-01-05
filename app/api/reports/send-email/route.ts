import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import nodemailer from "nodemailer";

/* =========================================================
   POST: Generate PDF + Send Email
========================================================= */
export async function POST(req: NextRequest) {
    // Use 'any' instead of 'puppeteer.Browser' to avoid TS2503:
    let browser: any = null;

    try {
        const body = await req.json();
        const { to, subject, message, report } = body;

        /* -------------------- Validation -------------------- */
        if (!to || !to.includes("@")) {
            return NextResponse.json(
                { success: false, error: "Valid recipient email is required" },
                { status: 400 }
            );
        }

        if (!report) {
            return NextResponse.json(
                { success: false, error: "Report data is required" },
                { status: 400 }
            );
        }

        /* -------------------- SMTP Config -------------------- */
        const smtpHost = process.env.SMTP_HOST || process.env.SMTP_SERVER;
        const smtpPort = Number(process.env.SMTP_PORT || 587);
        const smtpUser = process.env.SMTP_LOGIN_EMAIL || process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_SERVER_KEY || process.env.SMTP_PASSWORD;
        const fromEmail =
            process.env.SMTP_FROM_EMAIL || smtpUser || "no-reply@hydrawav3.com";

        if (!smtpHost || !smtpUser || !smtpPass) {
            return NextResponse.json(
                { success: false, error: "SMTP configuration missing" },
                { status: 500 }
            );
        }

        /* -------------------- Generate PDF -------------------- */
        const pdfHTML = generatePDFHTML(report);

        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setContent(pdfHTML, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "2cm",
                bottom: "2cm",
                left: "2cm",
                right: "2cm",
            },
        });

        await browser.close();
        browser = null;

        /* -------------------- Email Setup -------------------- */
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: false },
        });

        const recipientName =
            report?.personal_snapshot?.name?.split(" ")[0] || "there";

        const htmlEmail = buildEmailHTML(recipientName, message);
        const textEmail = buildTextEmail(recipientName, message);

        /* -------------------- Send Email -------------------- */
        const info = await transporter.sendMail({
            from: `"Hydrawav3" <${fromEmail}>`,
            to,
            subject: subject || "Your Hydrawav3 Diagnostic Report",
            text: textEmail,
            html: htmlEmail,
            attachments: [
                {
                    filename: `Hydrawav3_Report_${new Date()
                        .toISOString()
                        .slice(0, 10)}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        });

        return NextResponse.json({
            success: true,
            message: "Email sent successfully",
            messageId: info.messageId,
        });
    } catch (err: any) {
        if (browser) await browser.close();
        console.error("EMAIL ERROR:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to send email" },
            { status: 500 }
        );
    }
}

/* =========================================================
   EMAIL HTML (GMAIL SAFE – NO CLIPPING)
========================================================= */
function buildEmailHTML(name: string, customMessage?: string) {
    return `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a2b33;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
  
          <!-- Card -->
          <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
  
            <!-- Header -->
            <tr>
              <td style="background:#1f343d;padding:28px 20px;text-align:center;">
                <img src="https://hydrawavai.sumerudigital.com/logo.png"
                     alt="Hydrawav3 Logo"
                     width="140"
                     style="display:block;margin:0 auto 14px;" />
                <div style="color:#ffffff;font-size:20px;font-weight:600;">
                  Diagnostic Protocol Report
                </div>
              </td>
            </tr>
  
            <!-- Body -->
            <tr>
              <td style="padding:32px 34px;font-size:15px;line-height:1.8;">
                <p style="margin:0 0 18px;font-size:17px;font-weight:600;">
                  Dear ${name},
                </p>
  
                <p style="margin:0 0 22px;">
                  ${customMessage ||
        "Please find attached your diagnostic protocol report."
        }
                </p>
  
                <!-- Highlight box -->
                <table width="100%" cellpadding="0" cellspacing="0"
                       style="background:#fbfaf8;border-left:4px solid #d6b59c;border-radius:8px;margin:26px 0;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <div style="font-weight:600;font-size:16px;margin-bottom:6px;">
                        📄 Your Report is Attached
                      </div>
                      <div style="color:#4b5563;font-size:14px;line-height:1.7;">
                        Please find your detailed diagnostic protocol report attached as a PDF.
                        This document contains your personalized insights, movement observations,
                        and recovery recommendations.
                      </div>
                    </td>
                  </tr>
                </table>
  
                <p style="margin:0 0 20px;">
                  This report has been carefully prepared to provide you with actionable insights
                  into your movement patterns and recovery needs. We recommend reviewing it with
                  your healthcare practitioner to develop a comprehensive recovery plan.
                </p>
  
                <p style="margin:0;">
                  If you have any questions or need further clarification, please don’t hesitate
                  to reach out to us.
                </p>
              </td>
            </tr>
  
            <!-- Divider -->
            <tr>
              <td style="padding:0 34px;">
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;">
              </td>
            </tr>
  
            <!-- Footer -->
            <tr>
              <td style="padding:22px 30px;text-align:center;background:#fbfbfb;">
                <p style="margin:0 0 6px;font-weight:600;">
                  Best regards,
                </p>
                <p style="margin:0 0 14px;font-weight:600;">
                  The Hydrawav3 Team
                </p>
                <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
                  This is an automated email. Please do not reply directly to this message.<br />
                  For inquiries, please contact us through our official channels.
                </p>
              </td>
            </tr>
  
          </table>
  
        </td>
      </tr>
    </table>
  </body>
  </html>
  `.trim();
}


/* =========================================================
   EMAIL TEXT
========================================================= */
function buildTextEmail(name: string, customMessage?: string) {
    return `
Dear ${name},

${customMessage ||
        "Your personalized diagnostic protocol report is attached as a PDF."}

Please review the report at your convenience.
If you have questions, our team is happy to help.

— Hydrawav3 Team
`.trim();
}

/* =========================================================
   PDF HTML (UNCHANGED LOGIC, SAFE STYLES)
========================================================= */
function generatePDFHTML(report: any): string {
    const formatSection = (title: string, content: any): string => {
        if (!content) return '';

        let html = `<div style="margin-bottom: 30px; page-break-inside: avoid;">
            <h2 style="color: #1a2b33; font-size: 24px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #d6b499; padding-bottom: 10px;">${title}</h2>`;

        if (typeof content === 'string') {
            html += `<p style="color: #3a4e58; line-height: 1.8; margin-bottom: 15px;">${content}</p>`;
        } else if (Array.isArray(content)) {
            html += '<ul style="list-style: none; padding-left: 0;">';
            content.forEach((item: any) => {
                html += `<li style="color: #3a4e58; line-height: 1.8; margin-bottom: 10px; padding-left: 20px; position: relative;">
                    <span style="position: absolute; left: 0; color: #d6b499;">•</span>
                    ${typeof item === 'string' ? item : JSON.stringify(item)}
                </li>`;
            });
            html += '</ul>';
        } else if (typeof content === 'object' && content !== null) {
            Object.entries(content).forEach(([key, value]: [string, any]) => {
                html += `<div style="margin-left: 20px; margin-bottom: 15px; border-left: 2px solid #d6b499; padding-left: 15px;">
                    <h3 style="color: #1a2b33; font-size: 18px; font-weight: 600; margin-bottom: 8px; text-transform: capitalize;">${key.replace(/_/g, ' ')}</h3>`;
                if (typeof value === 'string') {
                    html += `<p style="color: #3a4e58; line-height: 1.8;">${value}</p>`;
                } else if (Array.isArray(value)) {
                    html += '<ul style="list-style: none; padding-left: 0;">';
                    value.forEach((item: any) => {
                        html += `<li style="color: #3a4e58; line-height: 1.8; margin-bottom: 8px; padding-left: 20px; position: relative;">
                            <span style="position: absolute; left: 0; color: #d6b499;">-</span>
                            ${item}
                        </li>`;
                    });
                    html += '</ul>';
                }
                html += '</div>';
            });
        }

        html += '</div>';
        return html;
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            margin: 2cm;
        }
        body {
            font-family: 'Poppins', Arial, sans-serif;
            color: #1a2b33;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #d6b499;
        }
        .header h1 {
            font-size: 32px;
            font-weight: bold;
            color: #1a2b33;
            margin: 10px 0;
        }
        .personal-snapshot {
            background: linear-gradient(135deg, #1a2b33 0%, #2a3b43 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
        }
        .hypothesis {
            background: #fdfbf9;
            border: 2px solid #d6b499;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div style="display: inline-block; padding: 8px 20px; background: #d6b49920; border: 1px solid #d6b499; border-radius: 20px; margin-bottom: 15px;">
            <span style="font-size: 12px; font-weight: 600; color: #d6b499; text-transform: uppercase; letter-spacing: 2px;">
                ${report.report_type?.replace(/_/g, ' ').toUpperCase() || 'DIAGNOSTIC REPORT'}
            </span>
        </div>
        <h1>Diagnostic Protocol Report</h1>
        <p style="color: #8b8780; font-size: 16px;">Movement-based kinetic chain analysis for precision recovery</p>
    </div>

    ${report.personal_snapshot ? `
    <div class="personal-snapshot">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Personal Snapshot</h2>
        ${(report.personal_snapshot.name || report.personal_snapshot.email || report.personal_snapshot.phoneNumber) ? `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            ${report.personal_snapshot.name ? `
            <div>
                <div style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Name</div>
                <div style="font-size: 18px; font-weight: 500;">${report.personal_snapshot.name}</div>
            </div>
            ` : ''}
            ${report.personal_snapshot.email ? `
            <div>
                <div style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Email</div>
                <div style="font-size: 18px; font-weight: 500;">${report.personal_snapshot.email}</div>
            </div>
            ` : ''}
            ${report.personal_snapshot.phoneNumber ? `
            <div>
                <div style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Phone</div>
                <div style="font-size: 18px; font-weight: 500;">${report.personal_snapshot.phoneNumber}</div>
            </div>
            ` : ''}
        </div>
        ` : ''}
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
            ${report.personal_snapshot.age ? `
            <div>
                <div style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Age</div>
                <div style="font-size: 32px; font-weight: bold;">${report.personal_snapshot.age}</div>
            </div>
            ` : ''}
            ${report.personal_snapshot.primary_concern ? `
            <div style="grid-column: span 3;">
                <div style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Primary Concern</div>
                <div style="font-size: 18px; font-weight: 500;">${report.personal_snapshot.primary_concern}</div>
            </div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    ${report.clinical_insight_snapshot ? formatSection('Clinical Insight Snapshot', report.clinical_insight_snapshot) : ''}
    ${report.movement_observations ? formatSection('Movement Observations', report.movement_observations) : ''}
    
    ${report.kinetic_chain_hypothesis_a || report.kinetic_chain_hypothesis_b ? `
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1a2b33; font-size: 24px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #d6b499; padding-bottom: 10px;">Kinetic Chain Hypotheses</h2>
        ${report.kinetic_chain_hypothesis_a ? `
        <div class="hypothesis">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <div style="width: 48px; height: 48px; background: #d6b499; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold;">A</div>
                <h3 style="font-size: 20px; font-weight: bold; color: #1a2b33; margin: 0;">${report.kinetic_chain_hypothesis_a.hypothesis_label}</h3>
            </div>
            ${report.kinetic_chain_hypothesis_a.initiating_region ? `
            <div style="margin-bottom: 15px;">
                <h4 style="font-size: 11px; font-weight: 600; color: #8b8780; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Initiating Region</h4>
                <p style="color: #1a2b33; font-weight: 500;">${report.kinetic_chain_hypothesis_a.initiating_region}</p>
            </div>
            ` : ''}
            ${report.kinetic_chain_hypothesis_a.kinetic_chain_pathway ? `
            <div style="margin-bottom: 15px;">
                <h4 style="font-size: 11px; font-weight: 600; color: #8b8780; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Kinetic Chain Pathway</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                    ${report.kinetic_chain_hypothesis_a.kinetic_chain_pathway.map((region: string, idx: number) => `
                        <span style="padding: 8px 16px; background: #d6b49920; color: #1a2b33; border-radius: 10px; font-size: 14px; font-weight: 500; border: 1px solid #d6b49940;">${region}</span>
                        ${idx < report.kinetic_chain_hypothesis_a.kinetic_chain_pathway.length - 1 ? '<span style="color: #d6b499; font-size: 18px;">→</span>' : ''}
                    `).join('')}
                </div>
            </div>
            ` : ''}
            ${report.kinetic_chain_hypothesis_a.biomechanical_explanation ? `
            <div style="margin-bottom: 15px;">
                <h4 style="font-size: 11px; font-weight: 600; color: #8b8780; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Biomechanical Explanation</h4>
                <p style="color: #3a4e58; line-height: 1.8;">${report.kinetic_chain_hypothesis_a.biomechanical_explanation}</p>
            </div>
            ` : ''}
            ${report.kinetic_chain_hypothesis_a.supporting_findings ? `
            <div>
                <h4 style="font-size: 11px; font-weight: 600; color: #8b8780; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Supporting Findings</h4>
                <ul style="list-style: none; padding-left: 0;">
                    ${report.kinetic_chain_hypothesis_a.supporting_findings.map((finding: string) => `
                    <li style="color: #3a4e58; line-height: 1.8; margin-bottom: 8px; padding-left: 25px; position: relative;">
                        <span style="position: absolute; left: 0; color: #d6b499; font-size: 18px;">✓</span>
                        ${finding}
                    </li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
        ` : ''}
        ${report.kinetic_chain_hypothesis_b ? `
        <div class="hypothesis">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <div style="width: 48px; height: 48px; background: #d6b499; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold;">B</div>
                <h3 style="font-size: 20px; font-weight: bold; color: #1a2b33; margin: 0;">${report.kinetic_chain_hypothesis_b.hypothesis_label}</h3>
            </div>
            ${report.kinetic_chain_hypothesis_b.initiating_region ? `
            <div style="margin-bottom: 15px;">
                <h4 style="font-size: 11px; font-weight: 600; color: #8b8780; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Initiating Region</h4>
                <p style="color: #1a2b33; font-weight: 500;">${report.kinetic_chain_hypothesis_b.initiating_region}</p>
            </div>
            ` : ''}
            ${report.kinetic_chain_hypothesis_b.kinetic_chain_pathway ? `
            <div style="margin-bottom: 15px;">
                <h4 style="font-size: 11px; font-weight: 600; color: #8b8780; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Kinetic Chain Pathway</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                    ${report.kinetic_chain_hypothesis_b.kinetic_chain_pathway.map((region: string, idx: number) => `
                        <span style="padding: 8px 16px; background: #d6b49920; color: #1a2b33; border-radius: 10px; font-size: 14px; font-weight: 500; border: 1px solid #d6b49940;">${region}</span>
                        ${idx < report.kinetic_chain_hypothesis_b.kinetic_chain_pathway.length - 1 ? '<span style="color: #d6b499; font-size: 18px;">→</span>' : ''}
                    `).join('')}
                </div>
            </div>
            ` : ''}
            ${report.kinetic_chain_hypothesis_b.biomechanical_explanation ? `
            <div style="margin-bottom: 15px;">
                <h4 style="font-size: 11px; font-weight: 600; color: #8b8780; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Biomechanical Explanation</h4>
                <p style="color: #3a4e58; line-height: 1.8;">${report.kinetic_chain_hypothesis_b.biomechanical_explanation}</p>
            </div>
            ` : ''}
            ${report.kinetic_chain_hypothesis_b.supporting_findings ? `
            <div>
                <h4 style="font-size: 11px; font-weight: 600; color: #8b8780; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Supporting Findings</h4>
                <ul style="list-style: none; padding-left: 0;">
                    ${report.kinetic_chain_hypothesis_b.supporting_findings.map((finding: string) => `
                    <li style="color: #3a4e58; line-height: 1.8; margin-bottom: 8px; padding-left: 25px; position: relative;">
                        <span style="position: absolute; left: 0; color: #d6b499; font-size: 18px;">✓</span>
                        ${finding}
                    </li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
        ` : ''}
    </div>
    ` : ''}

    ${report.load_vs_recovery_overview ? formatSection('Load vs Recovery Overview', report.load_vs_recovery_overview) : ''}
    ${report.lifestyle_and_postural_contributors ? formatSection('Lifestyle & Postural Contributors', report.lifestyle_and_postural_contributors) : ''}
    
    ${report.at_home_mobility_focus ? `
    <div style="margin-bottom: 30px; background: #d6b49910; border: 2px solid #d6b49950; padding: 25px; border-radius: 15px;">
        <h2 style="color: #1a2b33; font-size: 24px; font-weight: bold; margin-bottom: 20px;">At-Home Mobility Focus</h2>
        ${report.at_home_mobility_focus.focus_regions ? `
        <div style="margin-bottom: 20px;">
            <h3 style="font-size: 11px; font-weight: 600; color: #8b8780; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Focus Regions</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${report.at_home_mobility_focus.focus_regions.map((region: string) => `
                <span style="padding: 10px 20px; background: #d6b499; color: white; border-radius: 12px; font-size: 14px; font-weight: 500;">${region}</span>
                `).join('')}
            </div>
        </div>
        ` : ''}
        ${report.at_home_mobility_focus.mobility_themes ? `
        <div>
            <h3 style="font-size: 11px; font-weight: 600; color: #8b8780; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Mobility Themes</h3>
            <ul style="list-style: none; padding-left: 0;">
                ${report.at_home_mobility_focus.mobility_themes.map((theme: string) => `
                <li style="color: #3a4e58; line-height: 1.8; margin-bottom: 10px; padding-left: 25px; position: relative;">
                    <span style="position: absolute; left: 0; color: #d6b499; font-size: 18px;">→</span>
                    ${theme}
                </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}
    </div>
    ` : ''}

    ${report.why_this_pattern_matters ? formatSection('Why This Pattern Matters', report.why_this_pattern_matters) : ''}
    
    ${report.questions_to_ask_your_practitioner ? `
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1a2b33; font-size: 24px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #d6b499; padding-bottom: 10px;">Questions to Ask Your Practitioner</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            ${report.questions_to_ask_your_practitioner.map((question: string, idx: number) => `
            <div style="padding: 20px; background: #fdfbf9; border: 1px solid #eeeae5; border-radius: 15px;">
                <div style="display: flex; align-items: start; gap: 12px;">
                    <span style="font-size: 24px; font-weight: bold; color: #d6b499;">${idx + 1}</span>
                    <p style="color: #3a4e58; line-height: 1.8; margin: 0; flex: 1;">${question}</p>
                </div>
            </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${report.practitioner_hand_off_summary ? formatSection('Practitioner Hand-Off Summary', report.practitioner_hand_off_summary) : ''}
    ${report.practitioner_notes ? formatSection('Practitioner Notes', report.practitioner_notes) : ''}
    ${report.next_steps_and_recovery_tools ? formatSection('Next Steps & Recovery Tools', report.next_steps_and_recovery_tools) : ''}
    
    ${report.disclaimer ? `
    <div style="background: #fff8f0; border: 2px solid #d6b49930; padding: 20px; border-radius: 15px; margin-top: 40px;">
        <div style="display: flex; align-items: start; gap: 15px;">
            <div style="color: #d6b499; font-size: 24px; margin-top: 5px;">ℹ</div>
            <p style="font-size: 12px; color: #8b8780; line-height: 1.8; margin: 0; font-style: italic;">${report.disclaimer}</p>
        </div>
    </div>
    ` : ''}
</body>
</html>
    `;
}

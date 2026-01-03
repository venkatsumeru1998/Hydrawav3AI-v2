"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Card from './Card';
import Sidebar from './sidebar';
import Section1 from './sections/Section1';
import Section2 from './sections/Section2';
import Section3 from './sections/Section3';
import Section4 from './sections/Section4';
import Section5 from './sections/Section5';
import Section6 from './sections/Section6';
import Section7 from './sections/Section7';
import ReportDisplay from './ReportDisplay';
import { FormData } from '@/types';
import { SECTIONS, SYSTEM_PROMPT } from '@/constants';

const INITIAL_DATA: FormData = {
    age: '', sexAtBirth: '', height: '', weight: '',
    primaryDiscomfortArea: '', primaryIntensity: 5, primaryDuration: '', primaryBehavior: '',
    hasOtherDiscomfort: '', secondaryDiscomfortArea: '', secondaryIntensity: 5, secondaryDuration: '', secondaryBehavior: '',
    selectedMovement: '', movementImpact: '',
    movementTightnessAreas: [], sensationDescription: [], sensationTravels: '', sensationTravelArea: '', frontHipTightness: '',
    recordedAssessments: [],
    activityRanks: {}, endOfDayFatigueArea: '',
    sleepPosition: '', sleepImpact: '', morningStiffnessArea: '',
    worseningSituations: [], harderPosition: '', improvingSituations: []
};

const GENERATING_MESSAGES = [
    "Analyzing movement patterns...",
    "Processing kinetic chain data...",
    "Evaluating discomfort areas...",
    "Synthesizing diagnostic insights...",
    "Generating recovery protocol...",
    "Finalizing assessment report..."
];

const IntakeForm = () => {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
    const [activeNav, setActiveNav] = useState<number>(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [reportId, setReportId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);
    const [manualMovement, setManualMovement] = useState('');
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    const sectionRefs = useRef<(HTMLElement | null)[]>([]);

    const sectionStatus = useMemo(() => {
        return SECTIONS.map(section => {
            if (section.id === 4) {
                const hasHistory = formData.recordedAssessments.length > 0;
                const currentValid = (formData.selectedMovement || (isManualMode && manualMovement)) && formData.movementImpact;
                const hasHipSelection = !!formData.frontHipTightness;
                return { id: section.id, isComplete: Boolean((hasHistory || currentValid) && hasHipSelection) };
            }

            const filledFields = section.fields.filter(field => {
                const val = formData[field as keyof FormData];
                if (typeof val === 'string') return val.trim().length > 0;
                if (typeof val === 'number') return val !== 0;
                if (Array.isArray(val)) return val.length > 0;
                if (typeof val === 'object' && val !== null) return Object.keys(val).length > 0;
                return val !== undefined && val !== null;
            });

            const isComplete = filledFields.length === section.fields.length;
            return { id: section.id, isComplete: Boolean(isComplete) };
        });
    }, [formData, isManualMode, manualMovement]);

    const totalCompletionPercent = useMemo(() => {
        const completedCount = sectionStatus.filter(s => s.isComplete).length;
        return Math.round((completedCount / SECTIONS.length) * 100);
    }, [sectionStatus]);

    const updateField = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const scrollToSection = (id: number) => {
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveNav(id);
        setIsSidebarOpen(false);
    };

    const toggleMultiSelect = (field: keyof FormData, value: string) => {
        const current = formData[field] as string[];
        const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
        updateField(field, next);
    };

    // Rotate through generating messages
    useEffect(() => {
        if (!isAnalyzing) return;

        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % GENERATING_MESSAGES.length);
        }, 3000); // Change message every 3 seconds

        return () => clearInterval(interval);
    }, [isAnalyzing]);

    const handleFinalize = async () => {
        console.log(formData)
        const hasHistory = formData.recordedAssessments.length > 0;
        const currentValid = (formData.selectedMovement || (isManualMode && manualMovement)) && formData.movementImpact;

        if (!hasHistory && !currentValid) {
            alert("MANDATORY: Please complete at least one Guided Movement assessment in Section 4 to initialize the diagnostic protocol.");
            scrollToSection(4);
            return;
        }

        setIsAnalyzing(true);
        setReport(null);
        setReportId(null);
        setCurrentMessageIndex(0);

        try {
            const { responseText, responseId } = await callAIAssistant(formData);
            setReport(responseText);
            setReportId(responseId);

            // Redirect to report page if reportId is available
            // Use Next.js router for faster client-side navigation
            if (responseId) {
                // Navigate immediately - router.push is faster than window.location.href
                router.push(`/reports/${responseId}`);
                // Keep loading state visible during navigation transition
                // The loading state will be cleared when component unmounts on navigation
                return;
            }

            // If no reportId, stop analyzing
            setIsAnalyzing(false);
        } catch (error) {
            console.error("AI Analysis Error:", error);
            alert("Encountered an issue with the AI diagnostic engine. Please retry the assessment.");
            setIsAnalyzing(false);
        }
    };

    // Call the actual AI Assistant API
    const callAIAssistant = async (data: FormData): Promise<{ responseText: string; responseId: string | null }> => {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                formData: data
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate report');
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to generate report');
        }

        // Return both the response text and the report ID
        return {
            responseText: result.data?.response || 'No response generated',
            responseId: result.data?.response_id || null
        };
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = sectionRefs.current.indexOf(entry.target as HTMLElement);
                        if (index !== -1) setActiveNav(index);
                    }
                });
            },
            { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
        );

        sectionRefs.current.forEach((ref) => ref && observer.observe(ref));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center relative">
            {/* Generating Overlay */}
            {isAnalyzing && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-[#1a2b33] rounded-[3rem] p-12 lg:p-16 max-w-2xl w-full mx-4 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-500">
                        <div className="flex flex-col items-center justify-center space-y-8">
                            {/* Spinner */}
                            <div className="relative">
                                <div className="animate-spin w-20 h-20 border-[6px] border-[#d6b499] border-t-transparent rounded-full" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-[#d6b499]/20 rounded-full animate-pulse" />
                                </div>
                            </div>

                            {/* Title */}
                            <div className="text-center space-y-4">
                                <h3 className="text-3xl font-black uppercase tracking-tight text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    Kinetic Chain Analysis
                                </h3>
                                <p className="text-[#d6b499] text-lg font-semibold uppercase tracking-[0.2em]" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {GENERATING_MESSAGES[currentMessageIndex]}
                                </p>
                            </div>

                            {/* Progress dots */}
                            <div className="flex gap-2">
                                {GENERATING_MESSAGES.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-all duration-500 ${index === currentMessageIndex
                                            ? 'bg-[#d6b499] w-8'
                                            : 'bg-white/20'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Info text */}
                            <p className="text-[#8b8780] text-sm text-center max-w-md font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Our AI engine is analyzing your movement patterns and generating a personalized recovery protocol. This may take a few moments...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                activeNav={activeNav}
                sectionStatus={sectionStatus}
                totalCompletionPercent={totalCompletionPercent}
                scrollToSection={scrollToSection}
            />

            <main className="flex-1 lg:ml-80 min-h-screen px-6 py-16 lg:px-24 space-y-16 max-w-7xl transition-all ">
                <header className="flex justify-between items-center mb-12 animate-in slide-in-from-top-4 duration-700">
                    <div>
                        <h1 className="text-5xl font-bold text-[#1a2b33] tracking-tight mb-3" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Kinetic Profile Intake
                        </h1>
                        <p className="text-[#8b8780] text-lg font-normal mt-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Personalized biometric screening for precision recovery.
                        </p>
                    </div>
                </header>

                <Card id={1} title="Basic Information" subtitle="Vitals Initialization" sectionRefs={sectionRefs}>
                    <Section1 formData={formData} updateField={updateField} />
                </Card>

                <Card id={2} title="Primary Discomfort" subtitle="Focus Mapping" sectionRefs={sectionRefs}>
                    <Section2 formData={formData} updateField={updateField} />
                </Card>

                <Card id={3} title="Other Areas of Discomfort" subtitle="Compensatory Scanning" sectionRefs={sectionRefs}>
                    <Section3 formData={formData} updateField={updateField} />
                </Card>

                <Card id={4} title="Movement & Body Awareness" subtitle="Kinetic Profiling" sectionRefs={sectionRefs}>
                    <Section4
                        formData={formData}
                        updateField={updateField}
                        toggleMultiSelect={toggleMultiSelect}
                        isManualMode={isManualMode}
                        manualMovement={manualMovement}
                        setIsManualMode={setIsManualMode}
                        setManualMovement={setManualMovement}
                    />
                </Card>

                <Card id={5} title="Daily Activities" subtitle="Habit Analysis" sectionRefs={sectionRefs}>
                    <Section5 formData={formData} updateField={updateField} />
                </Card>

                <Card id={6} title="Sleep & Recovery" subtitle="Nocturnal Metrics" sectionRefs={sectionRefs}>
                    <Section6 formData={formData} updateField={updateField} />
                </Card>

                <Card id={7} title="Activity Response" subtitle="Symptom Dynamics" sectionRefs={sectionRefs}>
                    <Section7
                        formData={formData}
                        toggleMultiSelect={toggleMultiSelect}
                        updateField={updateField}
                    />
                    <div className="mt-16">
                        <ReportDisplay
                            report={report}
                            reportId={reportId}
                            isAnalyzing={isAnalyzing}
                            onReProcess={handleFinalize}
                            formData={formData}
                            isManualMode={isManualMode}
                            manualMovement={manualMovement}
                            onFinalize={handleFinalize}
                        />
                    </div>
                </Card>
            </main>
        </div>
    );
};

export default IntakeForm;

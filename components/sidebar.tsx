"use client";
import React from 'react';
import { SECTIONS } from '@/constants';
import Image from 'next/image';

interface SidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    activeNav: number;
    sectionStatus: Array<{ id: number; isComplete: boolean }>;
    totalCompletionPercent: number;
    scrollToSection: (id: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isSidebarOpen,
    setIsSidebarOpen,
    activeNav,
    sectionStatus,
    totalCompletionPercent,
    scrollToSection
}) => {
    return (
        <>
            <div className="lg:hidden fixed top-6 right-6 z-[110]">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="w-12 h-12 tan-bg text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90"
                >
                    {isSidebarOpen ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    )}
                </button>
            </div>

            <aside className={`fixed left-0 top-0 bottom-0 w-80 sidebar-bg text-white flex flex-col p-8 z-[100] transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="mb-10 flex items-center justify-center gap-4">
                    <div className="w-[200px] h-[50px] relative shrink-0">
                        <Image
                            src="/logo.png"
                            width={200}
                            height={200}
                            alt="Hydrawav3AI Logo"
                            className="object-contain"
                            priority
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </div>
                <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
                    {SECTIONS.map((section) => {
                        const status = sectionStatus.find(s => s.id === section.id);
                        return (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`w-full group flex items-center justify-between py-3.5 px-5 rounded-2xl transition-all ${activeNav === section.id
                                    ? 'tan-bg text-white font-semibold shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                style={{ fontFamily: 'var(--font-poppins)' }}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${activeNav === section.id
                                        ? 'bg-white active-dot'
                                        : status?.isComplete
                                            ? 'bg-[#d6b499]'
                                            : 'bg-slate-700'
                                        }`} />
                                    <span className="text-sm tracking-tight font-medium">{section.title}</span>
                                </div>
                                {status?.isComplete && activeNav !== section.id && (
                                    <svg className="w-4 h-4 text-tan-text" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </nav>
                <div className="mt-10 space-y-5">
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.15em]" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Intake Progress
                            </p>
                            <span className="text-sm font-bold tan-text" style={{ fontFamily: 'var(--font-poppins)' }}>
                                {totalCompletionPercent}%
                            </span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full tan-bg transition-all duration-1000 ease-out rounded-full" style={{ width: `${totalCompletionPercent}%` }} />
                        </div>
                    </div>
                    <p className="text-[9px] text-center text-slate-500 font-medium tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-poppins)' }}>
                        © 2025 HW3 PRESCISION ENGINE
                    </p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

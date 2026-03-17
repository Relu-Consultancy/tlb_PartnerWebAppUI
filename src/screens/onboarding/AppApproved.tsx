import React from 'react';
import { CheckCircle2, ChevronRight, ArrowLeft, LayoutGrid } from 'lucide-react';
import { Screen } from '../../types';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

export const AppApproved: React.FC<OnboardingProps> = ({ onNavigate }) => (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center p-6">
        <header className="w-full flex items-center justify-between mb-8">
            <button onClick={() => onNavigate('APP_SUBMITTED')} className="p-2"><ArrowLeft size={24} className="text-tlb-yellow" /></button>
            <h2 className="font-black text-lg">Application Status</h2>
            <div className="w-10"></div>
        </header>

        <div className="w-full max-w-md">
            <div className="rounded-[2.5rem] overflow-hidden mb-10 shadow-2xl relative">
                <img loading="lazy" src="https://picsum.photos/seed/theater-approved/800/600" alt="Theater" className="w-full h-80 object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/20 flex items-end p-8">
                    <div className="bg-tlb-yellow text-tlb-dark px-4 py-2 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg">
                        <CheckCircle2 size={14} /> Approved
                    </div>
                </div>
            </div>

            <h1 className="text-4xl font-black text-center mb-4 font-serif italic">Application Approved!</h1>
            <p className="text-center text-gray-500 leading-relaxed mb-12 px-4">
                Congratulations! Your expertise and brand align perfectly with our vision for The Little Broadway. We are thrilled to have you on board.
            </p>

            <div className="space-y-0 relative mb-12 px-8">
                <div className="absolute left-[47px] top-4 bottom-4 w-0.5 bg-tlb-yellow"></div>
                {[
                    { label: 'Submitted', time: 'Oct 24, 10:24 AM', status: 'done' },
                    { label: 'Review Completed', time: 'Oct 25, 02:15 PM', status: 'done' },
                    { label: 'Final Decision', time: 'Approved Today', status: 'done' }
                ].map((step, i) => (
                    <div key={i} className="flex gap-6 items-start py-4 relative z-10">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm bg-tlb-yellow text-tlb-dark">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <h4 className="font-black text-lg">{step.label}</h4>
                            <p className="text-xs font-bold text-tlb-yellow uppercase tracking-widest mt-0.5">{step.time}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={() => onNavigate('AGREEMENT_SUBMIT')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
                Proceed to Submit Agreement <ChevronRight size={20} />
            </button>
            <button className="w-full mt-8 flex items-center justify-center gap-2 text-gray-400 font-bold text-sm">
                <LayoutGrid size={18} /> Back to Dashboard
            </button>

            <button className="w-full mt-4 flex items-center justify-center gap-2 text-tlb-yellow font-bold text-sm">
                <span className="bg-tlb-yellow/10 p-1 rounded">?</span> Contact Support
            </button>
        </div>
    </div>
);

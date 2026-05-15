import React from 'react';
import { CheckCircle2, ChevronRight, ArrowRight, PlusCircle } from 'lucide-react';
import { Screen } from '../../types';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

const X = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const UserCircle = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg>;
const BarChart3 = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>;

export const OnboardingComplete: React.FC<OnboardingProps> = ({ onNavigate }) => (
    <div className="min-h-screen bg-white flex flex-col">
        <header className="p-6 flex justify-between items-center">
            <button onClick={() => onNavigate('BANK_SETUP')}><X size={24} /></button>
            <h2 className="font-black text-lg">Onboarding Complete</h2>
            <div className="w-6"></div>
        </header>

        <main className="flex-1 p-6">
            <div className="tlb-content">
                <div className="bg-tlb-dark rounded-[2.5rem] p-10 text-center text-white relative overflow-hidden mb-12">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-tlb-yellow/20 to-transparent opacity-50"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="bg-tlb-yellow text-tlb-dark px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-8 shadow-lg">
                            <CheckCircle2 size={14} /> Verified Partner
                        </div>

                        <div className="w-32 h-32 rounded-full border-4 border-tlb-yellow p-1 mb-8 shadow-2xl shadow-tlb-yellow/20">
                            <div className="w-full h-full rounded-full overflow-hidden relative">
                                <img loading="lazy" src="https://picsum.photos/seed/spotlight/200/200" alt="Spotlight" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            </div>
                        </div>

                        <h1 className="text-4xl font-black mb-4 font-serif italic">Welcome to the Spotlight!</h1>
                        <p className="text-gray-400 leading-relaxed max-w-xs mx-auto">
                            Your journey with The Little Broadway officially begins now. Your profile is live and ready to reach your audience.
                        </p>
                    </div>
                </div>

                <h3 className="font-black text-xl mb-6">Next Steps</h3>
                <div className="space-y-4">
                    {[
                        { icon: PlusCircle, title: 'Create Your First Listing', desc: 'Add a class to your storefront', screen: 'CREATE_CLASS_IDENTITY' },
                        { icon: UserCircle, title: 'Complete Your Profile', desc: 'Add photos and social media links', screen: 'BRAND_PROFILE' },
                        { icon: BarChart3, title: 'Explore Dashboard', desc: 'View performance and ticket sales', screen: 'HOME' }
                    ].map((item, i) => (
                        <button
                            key={i}
                            onClick={() => onNavigate(item.screen as Screen)}
                            className="w-full tlb-card p-4 flex items-center gap-4 text-left hover:border-tlb-yellow transition-colors group"
                        >
                            <div className="bg-tlb-yellow/10 p-3 rounded-xl text-tlb-yellow group-hover:bg-tlb-yellow group-hover:text-tlb-dark transition-colors">
                                <item.icon size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold">{item.title}</h4>
                                <p className="text-xs text-gray-400 font-medium">{item.desc}</p>
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </button>
                    ))}
                </div>

                <button onClick={() => onNavigate('HOME')} className="tlb-button w-full py-4 mt-12 shadow-lg shadow-tlb-yellow/20">
                    Go to My Dashboard <ArrowRight size={20} />
                </button>
            </div>
        </main>
    </div>
);

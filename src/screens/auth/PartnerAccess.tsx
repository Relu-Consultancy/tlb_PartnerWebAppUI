import React from 'react';
import { Smartphone, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Screen } from '../../types';

interface AuthProps {
    onNavigate: (screen: Screen) => void;
}

export const PartnerAccess: React.FC<AuthProps> = ({ onNavigate }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white p-4 sm:p-6 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
                <button onClick={() => onNavigate('LANDING')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
                <h1 className="font-black text-lg">Partner Access</h1>
            </header>

            <main className="flex-1 px-4 sm:px-6 py-6">
                <div className="max-w-lg mx-auto space-y-6">
                    {/* Theater Banner */}
                    <div className="relative rounded-2xl overflow-hidden h-50 sm:h-70">
                        <img loading="lazy" src="https://picsum.photos/seed/theater/800/450" alt="Theater" className="w-full h-full object-cover " referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-5">
                            <span className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest mb-1">Business Portal</span>
                            <h2 className="text-white text-xl font-black">The Little Broadway</h2>
                        </div>
                    </div>

                    {/* Welcome */}
                    <div>
                        <h2 className="text-2xl font-black">Welcome to TLB</h2>
                        <p className="text-gray-400 text-sm mt-1">Enter your contact details in to start account creation process</p>
                    </div>

                    {/* Mobile Number */}
                    <div>
                        <label className="text-sm font-bold text-tlb-dark mb-2 block">Mobile Number</label>
                        <div className="relative">
                            <input type="tel" placeholder="Enter 10-digit number" className="tlb-input w-full pr-12" />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-tlb-yellow/10 p-1.5 rounded-lg text-tlb-yellow">
                                <Smartphone size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Or login with email</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-sm font-bold text-gray-400 mb-2 block">Email ID <span className="font-normal text-gray-300">(Optional)</span></label>
                        <div className="relative">
                            <input type="email" placeholder="partner@example.com" className="tlb-input w-full pr-12" />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                                <Mail size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Continue Button */}
                    <button onClick={() => onNavigate('PARTNER_ACCESS_OTP')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20 mt-8">
                        Send OTP <ArrowRight size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
};

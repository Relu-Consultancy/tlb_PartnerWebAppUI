import React, { useRef, useState } from 'react';
import { ChevronRight, Smartphone, ArrowRight, Mail } from 'lucide-react';
import { Screen } from '../../types';

interface AuthProps {
    onNavigate: (screen: Screen) => void;
}

const OtpInputGroup = ({ icon: Icon, label, color }: { icon: any, label: string, color: string }) => {
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted) {
            const newOtp = [...otp];
            pasted.split('').forEach((char, i) => { newOtp[i] = char; });
            setOtp(newOtp);
            const focusIndex = Math.min(pasted.length, 5);
            inputRefs.current[focusIndex]?.focus();
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-sm">{label}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Enter 6-digit code</p>
                </div>
            </div>
            
            <div className="flex justify-between gap-2">
                {otp.map((digit, i) => (
                    <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={i === 0 ? handlePaste : undefined}
                        className={`w-full aspect-[4/5] bg-gray-50 border border-gray-200 rounded-xl text-center text-xl font-black focus:outline-none focus:ring-2 focus:border-transparent transition-all max-w-[3rem] ${
                            color.includes('yellow') ? 'focus:ring-tlb-yellow/50 focus:border-tlb-yellow' : 'focus:ring-gray-300'
                        }`}
                    />
                ))}
            </div>
            <div className="text-right mt-3">
                 <button className="text-xs font-bold text-gray-400 hover:text-tlb-dark transition-colors">Resend Code</button>
            </div>
        </div>
    );
};

export const PartnerAccessOTP: React.FC<AuthProps> = ({ onNavigate }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            <header className="w-full bg-white p-4 sm:p-6 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => onNavigate('PARTNER_ACCESS')} className="p-2 -ml-2"><ArrowRight size={24} className="rotate-180" /></button>
                <h2 className="font-black text-lg">Verify Accounts</h2>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 w-full max-w-lg px-4 sm:px-6 py-8 flex flex-col">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black mb-3">Authentication</h1>
                    <p className="text-gray-500 leading-relaxed text-sm px-4">
                        Please enter the verification codes sent to your mobile number and email ID.
                    </p>
                </div>

                <div className="space-y-6 mb-12 flex-1">
                    <OtpInputGroup 
                        icon={Smartphone} 
                        label="Mobile Verification" 
                        color="bg-tlb-yellow/10 text-tlb-yellow" 
                    />
                    
                    <OtpInputGroup 
                        icon={Mail} 
                        label="Email Verification" 
                        color="bg-gray-100 text-gray-500" 
                    />
                </div>

                <div className="pb-8">
                    <button onClick={() => onNavigate('PARTNER_CATEGORY')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
                        Verify & Continue <ChevronRight size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
};

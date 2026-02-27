import React, { useRef, useState } from 'react';
import { ChevronRight, Smartphone, ArrowRight } from 'lucide-react';
import { Screen } from '../../types';

interface AuthProps {
    onNavigate: (screen: Screen) => void;
}

export const OTPVerify: React.FC<AuthProps> = ({ onNavigate }) => {
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
        <div className="min-h-screen bg-white flex flex-col items-center p-6">
            <div className="w-full flex items-center justify-between mb-12">
                <button onClick={() => onNavigate('LOGIN')} className="p-2"><ArrowRight size={24} className="rotate-180" /></button>
                <h2 className="font-black text-lg uppercase tracking-widest">Verify</h2>
                <div className="w-10"></div>
            </div>

            <div className="w-full max-w-md">
                <div className="bg-gray-100 rounded-3xl p-8 mb-12 flex items-center justify-center aspect-video relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="w-24 h-24 bg-tlb-yellow rounded-full flex items-center justify-center shadow-2xl relative z-10">
                        <Smartphone size={40} className="text-tlb-dark" />
                    </div>
                </div>

                <h1 className="text-4xl font-black text-center mb-4">Secure Verification</h1>
                <p className="text-center text-gray-500 leading-relaxed mb-10">
                    We've sent a 6-digit code to your registered mobile number for the <span className="font-bold text-tlb-dark">TLB Partner Portal</span>.
                </p>

                <div className="flex justify-between gap-2 mb-8">
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
                            className="w-14 h-16 bg-gray-50 border border-gray-200 rounded-2xl text-center text-2xl font-black focus:outline-none focus:ring-2 focus:ring-tlb-yellow/50 focus:border-tlb-yellow transition-all"
                        />
                    ))}
                </div>

                <p className="text-center text-gray-400 font-medium mb-12">
                    Didn't receive the code? <span className="text-tlb-yellow font-bold">Resend in 00:45</span>
                    <br />
                    <button className="text-xs underline mt-2 opacity-50">Change Number?</button>
                </p>

                <button onClick={() => onNavigate('DASHBOARD')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
                    Verify Identity <ChevronRight size={20} />
                </button>

                <p className="mt-12 text-center text-gray-300 text-[10px] font-bold tracking-widest uppercase">
                    The Little Broadway — Partner Portal V2.0
                </p>
            </div>
        </div>
    );
};

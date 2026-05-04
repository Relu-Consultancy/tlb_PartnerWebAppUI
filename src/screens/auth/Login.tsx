import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Smartphone, Mail, ArrowRight, X } from 'lucide-react';
import { Screen } from '../../types';

interface AuthProps {
    onNavigate: (screen: Screen) => void;
    setAuthData?: (data: { value: string; type: 'email' | 'phone' }) => void;
}

export const Login: React.FC<AuthProps> = ({ onNavigate, setAuthData }) => {
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [email, setEmail] = useState('');

    const isEmailValid = email.includes('@') && email.includes('.');

    const handleEmailOtp = () => {
        if (!isEmailValid) return;
        if (setAuthData) {
            setAuthData({ value: email, type: 'email' });
        }
        setShowEmailModal(false);
        onNavigate('OTP_VERIFY');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl relative"
            >
                <button onClick={() => onNavigate('LANDING')} className="absolute top-8 left-8 text-gray-400"><X size={24} /></button>

                <div className="flex flex-col items-center mt-8">
                    <div className="w-20 h-20 bg-tlb-yellow rounded-full flex items-center justify-center shadow-lg shadow-tlb-yellow/30 mb-6">
                        <Smartphone size={32} className="text-tlb-dark" />
                    </div>
                    <h1 className="text-3xl font-black text-center">The Little Broadway</h1>
                    <p className="text-gray-400 font-medium mt-1">Partner Portal Access</p>
                </div>

                <div className="mt-10 space-y-6">
                    <div className="flex gap-4">
                        <div className="w-24">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Code</label>
                            <div className="tlb-input flex items-center justify-between">
                                <span>+91</span>
                                <ChevronRight size={16} className="rotate-90 text-gray-400" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Mobile Number</label>
                            <input type="tel" placeholder="98765 43210" className="tlb-input" />
                        </div>
                    </div>

                    <button onClick={() => onNavigate('OTP_VERIFY')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
                        Send OTP <ArrowRight size={20} />
                    </button>

                    <div className="relative flex items-center justify-center py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                        <span className="relative bg-white px-4 text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">OR</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowEmailModal(true)}
                        className="w-full py-4 border border-gray-100 rounded-2xl font-bold text-gray-500 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                        <Mail size={20} /> Login with Email
                    </button>
                </div>

                <p className="mt-12 text-center text-gray-400 font-medium">
                    New to TLB? <button onClick={() => onNavigate('REGISTRATION')} className="text-tlb-yellow font-bold">Join as a Partner</button>
                </p>
            </motion.div>

            {/* Email Login Modal */}
            <AnimatePresence>
                {showEmailModal && (
                    <motion.div
                        key="email-login-overlay"
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowEmailModal(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="bg-tlb-yellow/10 p-1.5 rounded-lg text-tlb-yellow">
                                        <Mail size={16} />
                                    </div>
                                    <h3 className="font-bold text-gray-800">Login with Email</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowEmailModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Email Address</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            placeholder="you@company.com"
                                            className="tlb-input w-full pr-10"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                                            <Mail size={16} />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleEmailOtp}
                                    disabled={!isEmailValid}
                                    className={`tlb-button w-full py-4 shadow-lg gap-2 ${!isEmailValid ? 'opacity-50 cursor-not-allowed' : 'shadow-tlb-yellow/20'}`}
                                >
                                    Send OTP <ArrowRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

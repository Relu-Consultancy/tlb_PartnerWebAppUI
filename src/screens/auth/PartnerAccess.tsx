import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Mail, ArrowRight, ChevronDown, X } from 'lucide-react';
import { Screen } from '../../types';

interface AuthProps {
    onNavigate: (screen: Screen) => void;
    setAuthData: (data: { value: string; type: 'email' | 'phone' }) => void;
}

export const PartnerAccess: React.FC<AuthProps> = ({ onNavigate, setAuthData }) => {
    const [phone, setPhone] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [showEmailModal, setShowEmailModal] = React.useState(false);
    const [countryCode, setCountryCode] = React.useState('+91');

    const handleSendPhoneOtp = () => {
        if (!phone || phone.length < 10) return;
        setAuthData({ value: `${countryCode}${phone}`, type: 'phone' });
        onNavigate('PARTNER_ACCESS_OTP');
    };

    const handleSendEmailOtp = () => {
        if (!email || !email.includes('@')) return;
        setAuthData({ value: email, type: 'email' });
        onNavigate('PARTNER_ACCESS_OTP');
    };

    const isPhoneValid = phone.length >= 10;
    const isEmailValid = email.includes('@') && email.includes('.');

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Close Button */}
                <div className="p-5 flex justify-start">
                    <button
                        onClick={() => onNavigate('LANDING')}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="px-8 pb-10 pt-2">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-tlb-yellow rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-tlb-yellow/20">
                            <Smartphone size={28} className="text-tlb-dark" />
                        </div>
                        <h1 className="text-2xl font-black">The Little Broadway</h1>
                        <p className="text-sm text-tlb-yellow font-bold mt-1">Partner Portal Access</p>
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            {/* Country Code */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Code</label>
                                <div className="relative">
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="tlb-input appearance-none pr-8 w-20 cursor-pointer"
                                    >
                                        <option value="+91">+91</option>
                                        <option value="+1">+1</option>
                                        <option value="+44">+44</option>
                                        <option value="+971">+971</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="flex-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Mobile Number</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        placeholder="98765 43210"
                                        className="tlb-input w-full pr-10"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                                        <Smartphone size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Send OTP Button (Phone) */}
                    <button
                        onClick={handleSendPhoneOtp}
                        disabled={!isPhoneValid}
                        className={`tlb-button w-full py-4 mt-6 shadow-lg gap-2 ${!isPhoneValid ? 'opacity-50 cursor-not-allowed' : 'shadow-tlb-yellow/20'}`}
                    >
                        Send OTP <ArrowRight size={18} />
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-5">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* Login with Email Button */}
                    <button
                        type="button"
                        onClick={() => setShowEmailModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-4 border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <Mail size={18} /> Login with Email
                    </button>

                    {/* Join as Partner */}
                    <p className="text-center text-sm text-gray-400 mt-6">
                        New to TLB?{' '}
                        <button
                            onClick={() => onNavigate('PARTNER_CATEGORY')}
                            className="text-tlb-yellow font-bold hover:underline"
                        >
                            Join as a Partner
                        </button>
                    </p>
                </div>
            </div>

            {/* Email Login Modal */}
            <AnimatePresence>
                {showEmailModal && (
                    <motion.div 
                        key="email-modal-overlay"
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
                        
                        {/* Modal Content */}
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
                                    <div className="bg-gray-100 p-1.5 rounded-lg text-gray-500">
                                        <Mail size={16} />
                                    </div>
                                    <h3 className="font-bold text-gray-800">Login with Email</h3>
                                </div>
                                <button
                                    onClick={() => setShowEmailModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-6">
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
                                    onClick={handleSendEmailOtp}
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

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowRight, CheckCircle2, Shield, ShieldCheck } from 'lucide-react';
import { Screen } from '../../types';
import { OnboardingShell, PageHeader, ToastContainer, useToasts } from '../../components/ui';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const IdentityVerification: React.FC<OnboardingProps> = ({ onNavigate }) => {
    const [pan, setPan] = useState(sessionStorage.getItem('pan_number') || '');
    const [gst, setGst] = useState(sessionStorage.getItem('gst_number') || '');
    const { toasts, showToast, dismissToast } = useToasts();

    const panValid = PAN_REGEX.test(pan);
    const panInvalid = pan.length === 10 && !panValid;

    const handleContinue = () => {
        if (!pan) {
            showToast('PAN Number is required.', 'warning');
            return;
        }
        if (!panValid) {
            showToast('Invalid PAN format. Expected: ABCDE1234F.', 'error');
            return;
        }
        sessionStorage.setItem('pan_number', pan);
        sessionStorage.setItem('gst_number', gst);
        onNavigate('BANK_SETUP');
    };

    return (
        <OnboardingShell
            title="Identity Verification"
            eyebrow="Section A of 2"
            onBack={() => onNavigate('HOME')}
            progress={{ current: 1, total: 2 }}
            rightSlot={
                <div className="hidden sm:flex items-center gap-1.5 bg-tlb-yellow/15 text-amber-700 px-2.5 py-1 rounded-lg">
                    <Shield size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">KYC</span>
                </div>
            }
        >
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            <PageHeader
                eyebrow="Step A · Identity"
                title={
                    <>
                        Verify your <span className="text-tlb-yellow">identity.</span>
                    </>
                }
                subtitle="Provide your business identity details. We verify these securely with India's KYC infrastructure — your data never leaves encrypted storage."
            />

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
            >
                {/* PAN */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            PAN Number <span className="text-red-400">*</span>
                        </label>
                        {panValid && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                <CheckCircle2 size={11} /> Verified format
                            </span>
                        )}
                        {panInvalid && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-widest">
                                <AlertTriangle size={11} /> Invalid
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            autoFocus
                            className={`tlb-input w-full uppercase pr-10 text-base py-3.5 tracking-wider ${
                                panInvalid
                                    ? 'border-red-400 focus:ring-red-200'
                                    : panValid
                                    ? 'border-emerald-400 focus:ring-emerald-200'
                                    : ''
                            }`}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            value={pan}
                            onChange={(e) => setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        />
                        {panValid && (
                            <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                        )}
                        {panInvalid && (
                            <AlertTriangle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                        )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 ml-1">
                        Format: 5 letters · 4 digits · 1 letter (e.g. ABCDE1234F)
                    </p>
                </div>

                {/* GST */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            GST Number
                        </label>
                        <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-black uppercase">
                            Optional
                        </span>
                    </div>
                    <input
                        className="tlb-input w-full uppercase text-base py-3.5 tracking-wider"
                        placeholder="22AAAAA0000A1Z5"
                        maxLength={15}
                        value={gst}
                        onChange={(e) => setGst(e.target.value.toUpperCase())}
                    />
                    <p className="text-[11px] text-gray-400 mt-2 ml-1">
                        Required only if your annual turnover exceeds ₹20 lakhs.
                    </p>
                </div>

                <motion.button
                    type="button"
                    onClick={handleContinue}
                    disabled={!pan}
                    whileHover={pan ? { scale: 1.01 } : undefined}
                    whileTap={pan ? { scale: 0.99 } : undefined}
                    className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base transition-all ${
                        pan
                            ? 'bg-tlb-yellow text-tlb-dark shadow-xl shadow-tlb-yellow/30'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    Continue to Bank Setup <ArrowRight size={18} />
                </motion.button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    Details verified securely via India's KYC infrastructure
                </div>
            </motion.div>
        </OnboardingShell>
    );
};

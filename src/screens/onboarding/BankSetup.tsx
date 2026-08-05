import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Landmark, Lock, ShieldCheck } from 'lucide-react';
import { Screen } from '../../types';
import { submitVerification } from '../../api/onboarding';
import { OnboardingShell, PageHeader, ToastContainer, useToasts } from '../../components/ui';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_REGEX = /^\d{9,18}$/;

export const BankSetup: React.FC<OnboardingProps> = ({ onNavigate }) => {
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [confirmAccount, setConfirmAccount] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [loading, setLoading] = useState(false);
    const { toasts, showToast, dismissToast } = useToasts();

    const ifscValid = IFSC_REGEX.test(ifsc);
    const ifscInvalid = ifsc.length === 11 && !ifscValid;
    const accountValid = ACCOUNT_REGEX.test(accountNumber);
    const accountsMatch = accountNumber.length > 0 && accountNumber === confirmAccount;
    const accountsMismatch = accountNumber.length > 0 && confirmAccount.length > 0 && !accountsMatch;

    const canSubmit = accountName.trim() && accountValid && accountsMatch && ifscValid;

    const handleSubmit = async () => {
        if (!accountName.trim()) {
            showToast('Account holder name is required.', 'warning');
            return;
        }
        if (!accountValid) {
            showToast('Account number must be 9–18 digits.', 'error');
            return;
        }
        if (!accountsMatch) {
            showToast('Account numbers do not match.', 'error');
            return;
        }
        if (!ifscValid) {
            showToast('Invalid IFSC format. Expected: ABCD0123456.', 'error');
            return;
        }

        setLoading(true);
        try {
            await submitVerification({
                pan_number: sessionStorage.getItem('pan_number') || '',
                gst_number: sessionStorage.getItem('gst_number') || '',
                account_holder_name: accountName.trim(),
                account_number: accountNumber,
                ifsc_code: ifsc,
                agreement_accepted: true,
            });
            // PAN/GST are only needed transiently to carry them across this two-step
            // flow — clear them now that they've been submitted, rather than leaving
            // them in sessionStorage until the user eventually logs out.
            sessionStorage.removeItem('pan_number');
            sessionStorage.removeItem('gst_number');
            onNavigate('ONBOARDING_COMPLETE');
        } catch (err: any) {
            showToast(err?.message || 'Failed to submit. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingShell
            title="Payout Setup"
            eyebrow="Section B of 2"
            onBack={() => onNavigate('IDENTITY_VERIFICATION')}
            progress={{ current: 2, total: 2 }}
            rightSlot={
                <div className="hidden sm:flex items-center gap-1.5 bg-tlb-yellow/15 text-amber-700 px-2.5 py-1 rounded-lg">
                    <Lock size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">AES-256</span>
                </div>
            }
        >
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            <PageHeader
                eyebrow="Step B · Payouts"
                title={
                    <>
                        Add your <span className="text-tlb-yellow">payout account.</span>
                    </>
                }
                subtitle="Funds settle within 24 hours of a confirmed booking. All bank details are stored with AES-256 encryption."
            />

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5"
            >
                <div className="flex items-center gap-3 mb-2 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Landmark size={18} />
                    </div>
                    <div>
                        <h3 className="font-black text-base">Bank Account Details</h3>
                        <p className="text-[11px] text-gray-400 font-medium">Where you'd like your earnings deposited</p>
                    </div>
                </div>

                {/* Account holder name */}
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                        Account Holder Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        autoFocus
                        className="tlb-input w-full text-base py-3.5"
                        placeholder="As on your PAN card"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                    />
                    <p className="text-[11px] text-gray-400 mt-2 ml-1">Must match the name on your PAN card.</p>
                </div>

                {/* Account number */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Account Number <span className="text-red-400">*</span>
                        </label>
                        {accountValid && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                <CheckCircle2 size={11} /> Valid
                            </span>
                        )}
                    </div>
                    <input
                        className={`tlb-input w-full text-base py-3.5 ${
                            accountValid ? 'border-emerald-400 focus:ring-emerald-200' : ''
                        }`}
                        type="password"
                        placeholder="9–18 digits"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
                    />
                </div>

                {/* Confirm account number */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Confirm Account Number <span className="text-red-400">*</span>
                        </label>
                        {accountsMatch && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                <CheckCircle2 size={11} /> Match
                            </span>
                        )}
                        {accountsMismatch && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-widest">
                                <AlertTriangle size={11} /> Mismatch
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            className={`tlb-input w-full pr-10 text-base py-3.5 ${
                                accountsMismatch
                                    ? 'border-red-400 focus:ring-red-200'
                                    : accountsMatch
                                    ? 'border-emerald-400 focus:ring-emerald-200'
                                    : ''
                            }`}
                            placeholder="Re-enter account number"
                            value={confirmAccount}
                            onChange={(e) => setConfirmAccount(e.target.value.replace(/\D/g, '').slice(0, 18))}
                        />
                        {accountsMatch && (
                            <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                        )}
                        {accountsMismatch && (
                            <AlertTriangle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                        )}
                    </div>
                </div>

                {/* IFSC */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            IFSC Code <span className="text-red-400">*</span>
                        </label>
                        {ifscValid && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                <CheckCircle2 size={11} /> Valid
                            </span>
                        )}
                        {ifscInvalid && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-widest">
                                <AlertTriangle size={11} /> Invalid
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            className={`tlb-input w-full uppercase pr-10 text-base py-3.5 tracking-wider ${
                                ifscInvalid
                                    ? 'border-red-400 focus:ring-red-200'
                                    : ifscValid
                                    ? 'border-emerald-400 focus:ring-emerald-200'
                                    : ''
                            }`}
                            placeholder="SBIN0001234"
                            maxLength={11}
                            value={ifsc}
                            onChange={(e) => setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        />
                        {ifscValid && (
                            <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                        )}
                        {ifscInvalid && (
                            <AlertTriangle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                        )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 ml-1">
                        4 letters · 0 · 6 alphanumeric (e.g. SBIN0001234)
                    </p>
                </div>

                <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    whileHover={canSubmit && !loading ? { scale: 1.01 } : undefined}
                    whileTap={canSubmit && !loading ? { scale: 0.99 } : undefined}
                    className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base transition-all ${
                        canSubmit && !loading
                            ? 'bg-tlb-yellow text-tlb-dark shadow-xl shadow-tlb-yellow/30'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Submitting…
                        </>
                    ) : (
                        <>
                            <Landmark size={18} /> Link Payout Account
                        </>
                    )}
                </motion.button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    AES-256 encrypted storage · PCI-DSS compliant
                </div>
            </motion.div>
        </OnboardingShell>
    );
};

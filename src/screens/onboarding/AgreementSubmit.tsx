import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    CheckCircle2,
    FileText,
    Loader2,
    Shield,
    ShieldCheck,
} from 'lucide-react';
import { Screen } from '../../types';
import { submitVerification } from '../../api/onboarding';
import { OnboardingShell, PageHeader, ToastContainer, useToasts } from '../../components/ui';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

// ── Regex patterns matching backend validation ──
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_REGEX = /^\d{9,18}$/;

type SectionId = 'A' | 'B' | 'C';

const SECTION_LABELS: Record<SectionId, string> = {
    A: 'Identity',
    B: 'Bank',
    C: 'Agreement',
};

export const AgreementSubmit: React.FC<OnboardingProps> = ({ onNavigate }) => {
    // Section A
    const [panNumber, setPanNumber] = useState('');
    const [gstNumber, setGstNumber] = useState('');

    // Section B
    const [accountHolderName, setAccountHolderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');

    // Section C
    const [agreementAccepted, setAgreementAccepted] = useState(false);

    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<SectionId>('A');
    const { toasts, showToast, dismissToast } = useToasts();

    // ── Format validation ──
    const panValid = PAN_REGEX.test(panNumber);
    const panPartial = panNumber.length > 0 && panNumber.length < 10;
    const panInvalid = panNumber.length === 10 && !panValid;

    const ifscValid = IFSC_REGEX.test(ifscCode);
    const ifscPartial = ifscCode.length > 0 && ifscCode.length < 11;
    const ifscInvalid = ifscCode.length === 11 && !ifscValid;

    const accountValid = ACCOUNT_REGEX.test(accountNumber);
    const accountTooShort = accountNumber.length > 0 && accountNumber.length < 9;
    const accountTooLong = accountNumber.length > 18;

    const accountsMatch = accountNumber.length > 0 && accountNumber === confirmAccountNumber;
    const accountsMismatch = accountNumber.length > 0 && confirmAccountNumber.length > 0 && !accountsMatch;

    const sectionADone = panValid;
    const sectionBDone = !!accountHolderName && accountValid && accountsMatch && ifscValid;
    const canSubmit = sectionADone && sectionBDone && agreementAccepted;

    // ── Validation helpers ──
    const validateSectionA = (): boolean => {
        if (!panNumber) {
            showToast('PAN Number is required', 'error');
            return false;
        }
        if (!panValid) {
            showToast('Invalid PAN format. Expected: ABCDE1234F (5 letters, 4 digits, 1 letter)', 'error');
            return false;
        }
        return true;
    };

    const validateSectionB = (): boolean => {
        const errors: string[] = [];
        if (!accountHolderName.trim()) errors.push('Account holder name is required');
        if (!accountNumber) {
            errors.push('Account number is required');
        } else if (!accountValid) {
            errors.push('Account number must be 9–18 digits');
        }
        if (!confirmAccountNumber) {
            errors.push('Please confirm your account number');
        } else if (!accountsMatch) {
            errors.push('Account numbers do not match');
        }
        if (!ifscCode) {
            errors.push('IFSC code is required');
        } else if (!ifscValid) {
            errors.push('Invalid IFSC format. Expected: ABCD0123456 (4 letters, 0, 6 alphanumeric)');
        }
        if (errors.length > 0) {
            errors.forEach((msg) => showToast(msg, 'error'));
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        // Final validation sweep — jumps to the offending section if anything fails.
        if (!panValid) {
            showToast('Invalid PAN format. Expected: ABCDE1234F', 'error');
            setActiveSection('A');
            return;
        }
        if (!accountValid) {
            showToast('Account number must be 9–18 digits only', 'error');
            setActiveSection('B');
            return;
        }
        if (!accountsMatch) {
            showToast('Account numbers do not match', 'error');
            setActiveSection('B');
            return;
        }
        if (!ifscValid) {
            showToast('Invalid IFSC format. Expected: ABCD0123456', 'error');
            setActiveSection('B');
            return;
        }
        if (!agreementAccepted) {
            showToast('Please accept the partner agreement', 'warning');
            return;
        }

        setLoading(true);
        try {
            await submitVerification({
                pan_number: panNumber.toUpperCase(),
                gst_number: gstNumber.toUpperCase(),
                account_holder_name: accountHolderName,
                account_number: accountNumber,
                ifsc_code: ifscCode.toUpperCase(),
                agreement_accepted: true,
            });
            showToast('Verification submitted successfully!', 'success');
            setTimeout(() => onNavigate('HOME'), 800);
        } catch (error: any) {
            console.error('Verification failed', error);
            const errMsg = error?.message || '';
            try {
                const parsed = JSON.parse(errMsg);
                if (typeof parsed === 'object') {
                    Object.entries(parsed).forEach(([field, messages]: [string, any]) => {
                        const label = field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                        const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
                        showToast(`${label}: ${msg}`, 'error');
                    });
                    return;
                }
            } catch {
                // not JSON, fall through
            }
            showToast(errMsg || 'Failed to submit. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Field-status pill helper ──
    const StatusPill: React.FC<{ valid: boolean; invalid: boolean }> = ({ valid, invalid }) => {
        if (valid) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    <CheckCircle2 size={11} /> Valid
                </span>
            );
        }
        if (invalid) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-widest">
                    <AlertTriangle size={11} /> Invalid
                </span>
            );
        }
        return null;
    };

    // ── Step tab ──
    const StepTab: React.FC<{ id: SectionId; done: boolean }> = ({ id, done }) => {
        const active = activeSection === id;
        return (
            <button
                onClick={() => setActiveSection(id)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    active ? 'text-tlb-dark' : done ? 'text-emerald-600' : 'text-gray-400 hover:text-tlb-dark'
                }`}
            >
                {active && (
                    <motion.div
                        layoutId="agreement-section-pill"
                        className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-100"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                )}
                <span className="relative flex items-center gap-1.5">
                    {done && !active && <CheckCircle2 size={12} />}
                    <span className="opacity-50 mr-0.5">{id}.</span>
                    {SECTION_LABELS[id]}
                </span>
            </button>
        );
    };

    const stepNumber: Record<SectionId, number> = { A: 1, B: 2, C: 3 };

    return (
        <OnboardingShell
            title="Verification"
            eyebrow="Complete to get approved"
            onBack={() => onNavigate('HOME')}
            progress={{ current: stepNumber[activeSection], total: 3 }}
            maxWidth="max-w-2xl"
        >
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            <PageHeader
                eyebrow="Final Step"
                title={
                    <>
                        Complete your <span className="text-tlb-yellow">verification.</span>
                    </>
                }
                subtitle="Three quick sections — identity, payouts, and the partner agreement. Encrypted end-to-end."
            />

            {/* Section switcher */}
            <div className="bg-gray-100 rounded-2xl p-1.5 flex gap-1 mb-6">
                <StepTab id="A" done={sectionADone} />
                <StepTab id="B" done={sectionBDone} />
                <StepTab id="C" done={agreementAccepted} />
            </div>

            <AnimatePresence mode="wait">
                {/* ── Section A: Identity ── */}
                {activeSection === 'A' && (
                    <motion.div
                        key="A"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
                    >
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Shield size={18} />
                            </div>
                            <div>
                                <h3 className="font-black text-base">Identity Verification</h3>
                                <p className="text-[11px] text-gray-400 font-medium">Encrypted via India's KYC infrastructure</p>
                            </div>
                        </div>

                        {/* PAN */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    PAN Number <span className="text-red-400">*</span>
                                </label>
                                <StatusPill valid={panValid} invalid={panInvalid} />
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
                                    value={panNumber}
                                    onChange={(e) => setPanNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                />
                                {panValid && (
                                    <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                                )}
                                {panInvalid && (
                                    <AlertTriangle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                                )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2 ml-1">
                                {panInvalid
                                    ? 'Invalid format — must be 5 letters, 4 digits, 1 letter'
                                    : panPartial
                                    ? 'Format: ABCDE1234F — 5 letters, 4 digits, 1 letter'
                                    : 'Format: 5 letters · 4 digits · 1 letter'}
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
                                value={gstNumber}
                                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                            />
                            <p className="text-[11px] text-gray-400 mt-2 ml-1">Required only if turnover exceeds ₹20 lakhs.</p>
                        </div>

                        <motion.button
                            type="button"
                            onClick={() => { if (validateSectionA()) setActiveSection('B'); }}
                            disabled={!panNumber}
                            whileHover={panNumber ? { scale: 1.01 } : undefined}
                            whileTap={panNumber ? { scale: 0.99 } : undefined}
                            className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base transition-all ${
                                panNumber
                                    ? 'bg-tlb-yellow text-tlb-dark shadow-xl shadow-tlb-yellow/30'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            Next: Bank Details <ArrowRight size={18} />
                        </motion.button>
                    </motion.div>
                )}

                {/* ── Section B: Bank ── */}
                {activeSection === 'B' && (
                    <motion.div
                        key="B"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5"
                    >
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Building2 size={18} />
                            </div>
                            <div>
                                <h3 className="font-black text-base">Bank Details</h3>
                                <p className="text-[11px] text-gray-400 font-medium">Payouts settle within 24 hours</p>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                Account Holder Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                className="tlb-input w-full text-base py-3.5"
                                placeholder="As on your PAN card"
                                value={accountHolderName}
                                onChange={(e) => setAccountHolderName(e.target.value)}
                            />
                            <p className="text-[11px] text-gray-400 mt-2 ml-1">Must match the name on your PAN card.</p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Account Number <span className="text-red-400">*</span>
                                </label>
                                <StatusPill valid={accountValid} invalid={accountTooLong} />
                            </div>
                            <input
                                className={`tlb-input w-full text-base py-3.5 ${
                                    accountTooShort || accountTooLong
                                        ? 'border-amber-400'
                                        : accountValid
                                        ? 'border-emerald-400 focus:ring-emerald-200'
                                        : ''
                                }`}
                                type="password"
                                placeholder="Enter account number (9–18 digits)"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
                            />
                            {accountTooShort && (
                                <p className="text-[11px] text-gray-400 mt-2 ml-1">{accountNumber.length}/9 digits minimum</p>
                            )}
                            {accountTooLong && (
                                <p className="text-[11px] text-red-500 font-bold mt-2 ml-1">Account number cannot exceed 18 digits</p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Confirm Account Number <span className="text-red-400">*</span>
                                </label>
                                <StatusPill valid={accountsMatch} invalid={accountsMismatch} />
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
                                    value={confirmAccountNumber}
                                    onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
                                />
                                {accountsMatch && (
                                    <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                                )}
                                {accountsMismatch && (
                                    <AlertTriangle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                                )}
                            </div>
                            {accountsMismatch && (
                                <p className="text-[11px] text-red-500 font-bold mt-2 ml-1">Account numbers do not match</p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    IFSC Code <span className="text-red-400">*</span>
                                </label>
                                <StatusPill valid={ifscValid} invalid={ifscInvalid} />
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
                                    value={ifscCode}
                                    onChange={(e) => setIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                />
                                {ifscValid && (
                                    <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                                )}
                                {ifscInvalid && (
                                    <AlertTriangle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                                )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2 ml-1">
                                {ifscInvalid
                                    ? 'Invalid — must be 4 letters, 0, then 6 alphanumeric'
                                    : ifscPartial
                                    ? 'Format: ABCD0123456'
                                    : '4 letters · 0 · 6 alphanumeric (e.g. SBIN0001234)'}
                            </p>
                        </div>

                        <motion.button
                            type="button"
                            onClick={() => { if (validateSectionB()) setActiveSection('C'); }}
                            disabled={!accountHolderName || !accountNumber || !ifscCode}
                            whileHover={accountHolderName && accountNumber && ifscCode ? { scale: 1.01 } : undefined}
                            whileTap={accountHolderName && accountNumber && ifscCode ? { scale: 0.99 } : undefined}
                            className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base transition-all ${
                                accountHolderName && accountNumber && ifscCode
                                    ? 'bg-tlb-yellow text-tlb-dark shadow-xl shadow-tlb-yellow/30'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            Next: Partner Agreement <ArrowRight size={18} />
                        </motion.button>
                    </motion.div>
                )}

                {/* ── Section C: Agreement ── */}
                {activeSection === 'C' && (
                    <motion.div
                        key="C"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="space-y-5"
                    >
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <h3 className="font-black text-base">Partner Agreement</h3>
                                    <p className="text-[11px] text-gray-400 font-medium">Read &amp; accept to activate</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-3">
                                    The Little Broadway Partner Agreement
                                </p>
                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 h-52 overflow-y-auto text-xs text-gray-500 leading-relaxed space-y-3">
                                    <p><strong>1. Terms of Partnership:</strong> By joining The Little Broadway (TLB) Partner Program, you agree to uphold the values and standards of the platform. Partners are responsible for delivering safe, high-quality, and age-appropriate activities for children.</p>
                                    <p><strong>2. Roles and Responsibilities:</strong> As a TLB Partner, you commit to maintaining updated listings, responding to enquiries promptly, and providing accurate information about your offerings. TLB reserves the right to review and remove listings that do not meet quality standards.</p>
                                    <p><strong>3. Revenue Sharing:</strong> TLB operates on a credit-based model. Partners must maintain sufficient credits to publish and promote listings. Revenue earned through the platform will be settled to the registered bank account within 24 business hours of completion of the activity.</p>
                                    <p><strong>4. Safety & Compliance:</strong> Partners confirm that all activities, trainers, and venues comply with applicable safety regulations. Background verifications may be required for instructors working with children.</p>
                                    <p><strong>5. Confidentiality:</strong> Partners agree not to share any proprietary TLB platform data, pricing structures, or user information with third parties. Breach of confidentiality may result in immediate termination of the partnership.</p>
                                    <p><strong>6. Termination:</strong> Either party may terminate this agreement with 30 days written notice. TLB reserves the right to terminate immediately in cases of misconduct, safety violations, or fraudulent activity.</p>
                                    <p><strong>7. Dispute Resolution:</strong> Any disputes arising from this agreement shall be resolved through mutual negotiation. If unresolved, disputes will be subject to arbitration under applicable Indian law.</p>
                                </div>
                            </div>

                            <label
                                className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                    agreementAccepted
                                        ? 'bg-tlb-yellow/5 border-tlb-yellow'
                                        : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                                }`}
                            >
                                <div
                                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                        agreementAccepted ? 'bg-tlb-yellow text-tlb-dark' : 'bg-white border-2 border-gray-300'
                                    }`}
                                >
                                    {agreementAccepted && <CheckCircle2 size={14} />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={agreementAccepted}
                                    onChange={(e) => setAgreementAccepted(e.target.checked)}
                                />
                                <span className="flex-1 text-sm font-medium leading-relaxed text-tlb-dark">
                                    I have read and agree to The Little Broadway Partner Agreement
                                </span>
                            </label>
                        </div>

                        {/* Summary */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Submission Summary
                            </p>
                            {[
                                { label: 'Identity (PAN)', done: sectionADone },
                                { label: 'Bank Details', done: sectionBDone },
                                { label: 'Agreement', done: agreementAccepted },
                            ].map((row) => (
                                <div key={row.label} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">{row.label}</span>
                                    <span
                                        className={`font-black text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${
                                            row.done ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                                        }`}
                                    >
                                        {row.done ? '✓ Done' : 'Incomplete'}
                                    </span>
                                </div>
                            ))}
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
                                    <Loader2 size={18} className="animate-spin" /> Submitting…
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} /> Submit Profile for Approval
                                </>
                            )}
                        </motion.button>

                        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            All details encrypted at rest and in transit
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </OnboardingShell>
    );
};

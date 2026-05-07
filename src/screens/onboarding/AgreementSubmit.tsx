import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CheckCircle2, Building2, FileText, Shield, Loader2, X, AlertTriangle } from 'lucide-react';
import { Screen } from '../../types';
import { submitVerification } from '../../api/onboarding';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

// ── Regex patterns matching backend validation ──
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_REGEX = /^\d{9,18}$/;

// ── Toast Notification System ──
interface Toast {
    id: number;
    message: string;
    type: 'error' | 'success' | 'warning';
}

let toastId = 0;

const ToastContainer: React.FC<{ toasts: Toast[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90vw] max-w-md pointer-events-none">
        {toasts.map((toast) => (
            <div
                key={toast.id}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-sm animate-slide-in-toast ${
                    toast.type === 'error'
                        ? 'bg-red-50/95 border-red-200 text-red-800'
                        : toast.type === 'warning'
                        ? 'bg-amber-50/95 border-amber-200 text-amber-800'
                        : 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
                }`}
            >
                <div className={`shrink-0 mt-0.5 ${
                    toast.type === 'error' ? 'text-red-500' : toast.type === 'warning' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                    {toast.type === 'error' || toast.type === 'warning'
                        ? <AlertTriangle size={18} />
                        : <CheckCircle2 size={18} />
                    }
                </div>
                <p className="flex-1 text-sm font-semibold leading-snug">{toast.message}</p>
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="shrink-0 p-0.5 rounded-lg hover:bg-black/5 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        ))}
    </div>
);

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
    const [activeSection, setActiveSection] = useState<'A' | 'B' | 'C'>('A');

    // Toast state
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: Toast['type'] = 'error') => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // ── Format Validation ──
    const panValid = PAN_REGEX.test(panNumber);
    const panPartiallyValid = panNumber.length > 0 && panNumber.length < 10;
    const panInvalid = panNumber.length === 10 && !panValid;

    const ifscValid = IFSC_REGEX.test(ifscCode);
    const ifscPartiallyValid = ifscCode.length > 0 && ifscCode.length < 11;
    const ifscInvalid = ifscCode.length === 11 && !ifscValid;

    const accountValid = ACCOUNT_REGEX.test(accountNumber);
    const accountTooShort = accountNumber.length > 0 && accountNumber.length < 9;
    const accountTooLong = accountNumber.length > 18;

    const accountsMatch = accountNumber.length > 0 && accountNumber === confirmAccountNumber;

    const sectionADone = panValid;
    const sectionBDone = !!accountHolderName && accountValid && accountsMatch && ifscValid;
    const canSubmit = sectionADone && sectionBDone && agreementAccepted;

    // ── Validate before navigating to next section ──
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
        if (!accountHolderName.trim()) {
            errors.push('Account holder name is required');
        }
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
        // Final validation sweep
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
            // Parse backend error and show as toast(s)
            const errMsg = error?.message || '';
            try {
                // Try to parse structured error like {"pan_number": ["error msg"]}
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
                // Not JSON, use as-is
            }
            showToast(errMsg || 'Failed to submit. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const sectionTab = (id: 'A' | 'B' | 'C', label: string, done: boolean) => (
        <button
            onClick={() => setActiveSection(id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSection === id
                    ? 'bg-tlb-yellow text-tlb-dark shadow-sm'
                    : done
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-gray-400'
            }`}
        >
            {done && activeSection !== id ? <CheckCircle2 size={12} /> : null}
            {label}
        </button>
    );

    // ── Field hint component ──
    const FieldHint: React.FC<{ valid: boolean; invalid: boolean; partial: boolean; validMsg: string; invalidMsg: string; partialMsg?: string }> = 
        ({ valid, invalid, partial, validMsg, invalidMsg, partialMsg }) => {
        if (valid) return <p className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1"><CheckCircle2 size={10} /> {validMsg}</p>;
        if (invalid) return <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1"><AlertTriangle size={10} /> {invalidMsg}</p>;
        if (partial && partialMsg) return <p className="text-[10px] text-gray-400 mt-1">{partialMsg}</p>;
        return null;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            {/* Slide-in animation style */}
            <style>{`
                @keyframes slide-in-toast {
                    from { opacity: 0; transform: translateY(-16px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-slide-in-toast {
                    animation: slide-in-toast 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>

            <header className="bg-white p-6 flex items-center justify-between border-b border-gray-100 sticky top-0 z-30">
                <button onClick={() => onNavigate('HOME')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
                <div className="text-center">
                    <h2 className="font-black text-lg">Verification</h2>
                    <p className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Complete to get approved</p>
                </div>
                <div className="w-10" />
            </header>

            <main className="flex-1 p-6 pb-28">
                <div className="tlb-content space-y-6">

                    {/* Section Tabs */}
                    <div className="flex bg-white rounded-2xl p-1.5 border border-gray-100 gap-1">
                        {sectionTab('A', 'Identity', sectionADone)}
                        {sectionTab('B', 'Bank', sectionBDone)}
                        {sectionTab('C', 'Agreement', agreementAccepted)}
                    </div>

                    {/* ── Section A: Identity Verification ── */}
                    {activeSection === 'A' && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="bg-tlb-yellow/10 p-2.5 rounded-xl text-tlb-yellow"><Shield size={20} /></div>
                                <div>
                                    <h3 className="font-black text-xl">Identity Verification</h3>
                                    <p className="text-xs text-gray-400">Your documents are encrypted and secure.</p>
                                </div>
                            </div>

                            <div className="tlb-card space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                        PAN Number <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            className={`tlb-input w-full uppercase pr-10 ${panInvalid ? 'border-red-400 focus:ring-red-200' : panValid ? 'border-emerald-400 focus:ring-emerald-200' : ''}`}
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
                                    <FieldHint
                                        valid={panValid}
                                        invalid={panInvalid}
                                        partial={panPartiallyValid}
                                        validMsg="PAN format verified"
                                        invalidMsg="Invalid format — must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)"
                                        partialMsg="Format: ABCDE1234F — 5 letters, 4 digits, 1 letter"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">GST Number</label>
                                        <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-bold uppercase">Optional</span>
                                    </div>
                                    <input
                                        className="tlb-input w-full uppercase"
                                        placeholder="22AAAAA0000A1Z5"
                                        maxLength={15}
                                        value={gstNumber}
                                        onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Required only if your annual turnover exceeds ₹20 lakhs</p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (validateSectionA()) setActiveSection('B');
                                }}
                                disabled={!panNumber}
                                className={`tlb-button w-full py-4 ${!panNumber ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-tlb-yellow/20'}`}
                            >
                                Next: Bank Details →
                            </button>
                        </div>
                    )}

                    {/* ── Section B: Bank Details ── */}
                    {activeSection === 'B' && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="bg-tlb-yellow/10 p-2.5 rounded-xl text-tlb-yellow"><Building2 size={20} /></div>
                                <div>
                                    <h3 className="font-black text-xl">Bank Details</h3>
                                    <p className="text-xs text-gray-400">Payout Account — funds settled within 24 hours.</p>
                                </div>
                            </div>

                            <div className="tlb-card space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                        Account Holder Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        className="tlb-input w-full"
                                        placeholder="As on your PAN card"
                                        value={accountHolderName}
                                        onChange={(e) => setAccountHolderName(e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Must match the name on your PAN card</p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                        Account Number <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        className={`tlb-input w-full ${accountTooShort || accountTooLong ? 'border-amber-400' : accountValid ? 'border-emerald-400 focus:ring-emerald-200' : ''}`}
                                        type="password"
                                        placeholder="Enter account number (9–18 digits)"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
                                    />
                                    <FieldHint
                                        valid={accountValid}
                                        invalid={accountTooLong}
                                        partial={accountTooShort}
                                        validMsg="Account number format verified"
                                        invalidMsg="Account number cannot exceed 18 digits"
                                        partialMsg={`${accountNumber.length}/9 digits minimum`}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                        Confirm Account Number <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            className={`tlb-input w-full pr-10 ${accountNumber && confirmAccountNumber && !accountsMatch ? 'border-red-400 focus:ring-red-200' : accountsMatch ? 'border-emerald-400 focus:ring-emerald-200' : ''}`}
                                            placeholder="Re-enter account number"
                                            value={confirmAccountNumber}
                                            onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
                                        />
                                        {accountsMatch && (
                                            <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                                        )}
                                    </div>
                                    {accountNumber && confirmAccountNumber && !accountsMatch && (
                                        <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1"><AlertTriangle size={10} /> Account numbers do not match</p>
                                    )}
                                    {accountsMatch && (
                                        <p className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1"><CheckCircle2 size={10} /> Numbers match</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                        IFSC Code <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            className={`tlb-input w-full uppercase pr-10 ${ifscInvalid ? 'border-red-400 focus:ring-red-200' : ifscValid ? 'border-emerald-400 focus:ring-emerald-200' : ''}`}
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
                                    <FieldHint
                                        valid={ifscValid}
                                        invalid={ifscInvalid}
                                        partial={ifscPartiallyValid}
                                        validMsg="IFSC format verified"
                                        invalidMsg="Invalid format — must be 4 letters, then 0, then 6 alphanumeric (e.g. SBIN0001234)"
                                        partialMsg="Format: ABCD0123456 — 4 letters, '0', 6 alphanumeric"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (validateSectionB()) setActiveSection('C');
                                }}
                                disabled={!accountHolderName || !accountNumber || !ifscCode}
                                className={`tlb-button w-full py-4 ${(!accountHolderName || !accountNumber || !ifscCode) ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-tlb-yellow/20'}`}
                            >
                                Next: Partner Agreement →
                            </button>
                        </div>
                    )}

                    {/* ── Section C: Partner Agreement ── */}
                    {activeSection === 'C' && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="bg-tlb-yellow/10 p-2.5 rounded-xl text-tlb-yellow"><FileText size={20} /></div>
                                <div>
                                    <h3 className="font-black text-xl">Partner Agreement</h3>
                                    <p className="text-xs text-gray-400">Read and accept to activate your account.</p>
                                </div>
                            </div>

                            <div className="tlb-card space-y-5">
                                <div>
                                    <p className="text-xs font-bold text-tlb-yellow uppercase tracking-widest mb-3">The Little Broadway Partner Agreement</p>
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

                                <label className="flex gap-4 items-start bg-tlb-yellow/5 border border-tlb-yellow/20 p-4 rounded-2xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreementAccepted}
                                        onChange={(e) => setAgreementAccepted(e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-tlb-yellow text-tlb-yellow focus:ring-tlb-yellow"
                                    />
                                    <span className="text-sm font-medium leading-relaxed">
                                        I have read and agree to The Little Broadway Partner Agreement
                                    </span>
                                </label>
                            </div>

                            {/* Summary before submit */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Submission Summary</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Identity (PAN)</span>
                                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${sectionADone ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                        {sectionADone ? '✓ Done' : 'Incomplete'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Bank Details</span>
                                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${sectionBDone ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                        {sectionBDone ? '✓ Done' : 'Incomplete'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Agreement</span>
                                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${agreementAccepted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {agreementAccepted ? '✓ Accepted' : 'Pending'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit || loading}
                                className={`tlb-button w-full py-4 gap-3 ${(!canSubmit || loading) ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-tlb-yellow/20'}`}
                            >
                                {loading ? (
                                    <><Loader2 size={20} className="animate-spin" /> Submitting...</>
                                ) : (
                                    <><CheckCircle2 size={20} /> Submit Profile for Approval</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

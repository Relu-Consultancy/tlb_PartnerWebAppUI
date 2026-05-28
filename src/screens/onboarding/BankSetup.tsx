import React, { useState } from 'react';
import { CheckCircle2, ArrowLeft, LayoutGrid, AlertTriangle } from 'lucide-react';
import { Screen } from '../../types';
import { submitVerification } from '../../api/onboarding';

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
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const ifscValid = IFSC_REGEX.test(ifsc);
    const ifscInvalid = ifsc.length === 11 && !ifscValid;
    const accountValid = ACCOUNT_REGEX.test(accountNumber);
    const accountsMatch = accountNumber.length > 0 && accountNumber === confirmAccount;

    const handleSubmit = async () => {
        if (!accountName.trim()) { setError('Account holder name is required.'); return; }
        if (!accountValid) { setError('Account number must be 9–18 digits.'); return; }
        if (!accountsMatch) { setError('Account numbers do not match.'); return; }
        if (!ifscValid) { setError('Invalid IFSC format. Expected: ABCD0123456 (4 letters, 0, 6 alphanumeric)'); return; }

        setError('');
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
            onNavigate('ONBOARDING_COMPLETE');
        } catch (err: any) {
            setError(err?.message || 'Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white p-4 sm:p-6 flex items-center justify-between border-b border-gray-100">
            <button onClick={() => onNavigate('IDENTITY_VERIFICATION')} className="p-2 -ml-2 text-gray-400 hover:text-tlb-dark transition-colors">
                <ArrowLeft size={24} />
            </button>
            <h2 className="font-black text-lg">Payout Settings</h2>
            <div className="p-2 bg-gray-100 rounded-lg"><LayoutGrid size={20} className="text-gray-400" /></div>
        </header>

        <main className="p-4 sm:p-6">
            <div className="tlb-content space-y-8">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-2">
                        <CheckCircle2 size={12} /> Section B of 2
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black">Add Bank Account</h1>
                    <p className="text-gray-400 mt-2 font-medium text-sm">Funds are settled within 24 hours of performance.</p>
                </div>

                {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl p-3 text-xs font-bold text-red-600">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}

                <section className="tlb-card space-y-5">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                            Account Holder Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            className="tlb-input w-full"
                            placeholder="As on your PAN card"
                            value={accountName}
                            onChange={(e) => { setAccountName(e.target.value); setError(''); }}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Must match the name on your PAN card</p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                            Account Number <span className="text-red-400">*</span>
                        </label>
                        <input
                            className={`tlb-input w-full ${accountValid ? 'border-emerald-400 focus:ring-emerald-200' : ''}`}
                            type="password"
                            placeholder="9–18 digits"
                            value={accountNumber}
                            onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 18)); setError(''); }}
                        />
                        {accountValid && (
                            <p className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Account number format verified
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                            Confirm Account Number <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                className={`tlb-input w-full pr-10 ${accountNumber && confirmAccount && !accountsMatch ? 'border-red-400 focus:ring-red-200' : accountsMatch ? 'border-emerald-400 focus:ring-emerald-200' : ''}`}
                                placeholder="Re-enter account number"
                                value={confirmAccount}
                                onChange={(e) => { setConfirmAccount(e.target.value.replace(/\D/g, '').slice(0, 18)); setError(''); }}
                            />
                            {accountsMatch && <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                        </div>
                        {accountNumber && confirmAccount && !accountsMatch && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                                <AlertTriangle size={10} /> Account numbers do not match
                            </p>
                        )}
                        {accountsMatch && (
                            <p className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Numbers match
                            </p>
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
                                value={ifsc}
                                onChange={(e) => { setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError(''); }}
                            />
                            {ifscValid && <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                            {ifscInvalid && <AlertTriangle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />}
                        </div>
                        {ifscValid && (
                            <p className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
                                <CheckCircle2 size={10} /> IFSC format verified
                            </p>
                        )}
                        {ifscInvalid && (
                            <p className="text-[10px] text-red-500 font-bold mt-1">
                                Must be 4 letters, then 0, then 6 alphanumeric (e.g. SBIN0001234)
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !accountName || !accountNumber || !confirmAccount || !ifsc}
                        className={`tlb-button w-full py-4 ${(loading || !accountName || !accountNumber || !confirmAccount || !ifsc) ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-tlb-yellow/20'}`}
                    >
                        {loading ? 'Submitting…' : 'Link Payout Account'}
                    </button>

                    <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <LayoutGrid size={12} /> AES-256 Bit Encrypted Storage
                    </p>
                </section>
            </div>
        </main>
    </div>
    );
};

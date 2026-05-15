import React, { useState, useEffect } from 'react';
import { Menu, DollarSign, Download, ShieldCheck, AlertCircle, Building2, Smartphone, X, Loader2, Inbox } from 'lucide-react';
import { Screen } from '../../types';
import { getCurrentPartner } from '../../api/onboarding';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface BankAccount {
    accountHolderName: string;
    maskedNumber: string;
    ifscCode: string;
    isVerified: boolean;
}

interface Transaction {
    id: string;
    date: string;
    amount: string;
    status: string;
}

const maskAccount = (num: string): string => {
    if (!num) return '•••• •••• •••• ••••';
    const cleaned = num.replace(/\D/g, '');
    const last4 = cleaned.slice(-4);
    return `•••• •••• •••• ${last4}`;
};

const FinancialHub: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const [loading, setLoading] = useState(true);
    const [bank, setBank] = useState<BankAccount | null>(null);
    const [isKycVerified, setIsKycVerified] = useState(false);
    const [transactions] = useState<Transaction[]>([]);
    const [activeModal, setActiveModal] = useState<'bank' | 'upi' | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getCurrentPartner();
                const partner = res.data || res;

                // Bank details may be nested under bank_account, verification, or at root level
                const raw = partner.bank_account || partner.verification || partner;
                const accountHolderName: string =
                    raw.account_holder_name || partner.account_holder_name || '';
                const accountNumber: string =
                    raw.account_number || partner.account_number || '';
                const ifscCode: string =
                    raw.ifsc_code || partner.ifsc_code || '';

                if (accountHolderName || accountNumber) {
                    setBank({
                        accountHolderName,
                        maskedNumber: maskAccount(accountNumber),
                        ifscCode,
                        isVerified: raw.is_verified ?? partner.status === 'approved',
                    });
                }

                setIsKycVerified(partner.status === 'approved');
            } catch {
                // Profile fetch failed — show empty state, don't block the screen
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            <main className="flex-1 w-full md:w-auto h-screen overflow-y-auto">
                <header className="bg-white p-6 md:p-10 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={24} /></button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Pay-outs & Finance</h1>
                            <p className="text-sm font-bold text-gray-400 mt-1">Manage settlements and bank details</p>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 tlb-content space-y-6">
                    {/* Settlement Status Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Total Earned</p>
                            <h3 className="text-3xl font-black text-gray-900 relative z-10">—</h3>
                            <div className="absolute right-0 bottom-0 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={100} /></div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Commission Deducted</p>
                            <h3 className="text-3xl font-black text-red-400 relative z-10">—</h3>
                        </div>
                        <div className="bg-gradient-to-br from-tlb-dark to-gray-900 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                            <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest mb-1 relative z-10">Final Payout Pending</p>
                            <h3 className="text-3xl font-black text-tlb-yellow relative z-10">—</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Transaction History */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-lg font-black text-gray-900">Transaction History</h2>
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                            <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Invoice</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-16 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-gray-300">
                                                        <Inbox size={36} />
                                                        <p className="text-sm font-bold">No transactions yet</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : transactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-bold text-gray-700">{tx.date}</td>
                                                <td className="px-6 py-4 font-black text-gray-900">{tx.amount}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] bg-emerald-50 text-emerald-600 font-black px-2 py-1 rounded uppercase tracking-widest">{tx.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-[11px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 justify-end w-full">
                                                        <Download size={14} /> Download
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Payout Methods Card */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-black text-gray-900">Payout Methods</h2>

                            {/* Bank Account Card */}
                            <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-3xl text-white shadow-xl relative overflow-hidden mt-2">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-tlb-yellow/10 rounded-full blur-xl -ml-10 -mb-10" />

                                <div className="relative z-10 flex justify-between items-start mb-8">
                                    <div className="text-[10px] font-black tracking-widest uppercase text-gray-400">Primary Bank</div>
                                    <div className="h-6 px-3 bg-white/10 rounded flex items-center justify-center backdrop-blur-sm border border-white/5">
                                        <span className="text-[9px] font-bold tracking-wider">BANKING</span>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="relative z-10 flex items-center gap-2 text-gray-400 py-4">
                                        <Loader2 size={14} className="animate-spin" />
                                        <span className="text-xs font-bold">Loading…</span>
                                    </div>
                                ) : (
                                    <div className="relative z-10 space-y-4">
                                        <div className="text-xl font-black tracking-[0.2em] font-mono text-gray-100">
                                            {bank ? bank.maskedNumber : '—'}
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-1">Account Holder</p>
                                                <p className="font-bold text-sm tracking-wide">
                                                    {bank ? bank.accountHolderName : 'Not linked'}
                                                </p>
                                                {bank?.ifscCode && (
                                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{bank.ifscCode}</p>
                                                )}
                                            </div>
                                            {bank?.isVerified && <ShieldCheck size={22} className="text-emerald-400" />}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Add / Update Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setActiveModal('bank')} className="bg-white border border-gray-100 hover:border-tlb-yellow hover:shadow-md hover:-translate-y-0.5 transition-all p-5 rounded-2xl flex flex-col items-center justify-center gap-3 group shadow-sm">
                                    <div className="w-12 h-12 bg-gray-50 group-hover:bg-tlb-yellow/10 group-hover:text-tlb-yellow rounded-full flex items-center justify-center text-gray-400 transition-colors">
                                        <Building2 size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-600">{bank ? 'Update Bank' : 'Add Bank'}</span>
                                </button>
                                <button onClick={() => setActiveModal('upi')} className="bg-white border border-gray-100 hover:border-tlb-yellow hover:shadow-md hover:-translate-y-0.5 transition-all p-5 rounded-2xl flex flex-col items-center justify-center gap-3 group shadow-sm">
                                    <div className="w-12 h-12 bg-gray-50 group-hover:bg-tlb-yellow/10 group-hover:text-tlb-yellow rounded-full flex items-center justify-center text-gray-400 transition-colors">
                                        <Smartphone size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-600">Add UPI ID</span>
                                </button>
                            </div>

                            {/* KYC Warning */}
                            {!loading && !isKycVerified && (
                                <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-orange-800">Action Required</h4>
                                            <p className="text-[11px] text-orange-600 mt-1 leading-relaxed">
                                                Please provide a cancelled cheque to verify your account.
                                            </p>
                                            <button onClick={() => onNavigate('IDENTITY_VERIFICATION')} className="text-xs font-bold text-orange-700 mt-2 hover:underline">Complete KYC</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Bank Modal */}
            {activeModal === 'bank' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-black text-xl">{bank ? 'Update Bank Account' : 'Add Bank Account'}</h2>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Account Holder Name</label>
                                <input type="text" className="tlb-input w-full" placeholder="As per bank records" defaultValue={bank?.accountHolderName} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Account Number</label>
                                <input type="text" className="tlb-input w-full" placeholder="e.g. 1234567890" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Re-enter Account Number</label>
                                <input type="text" className="tlb-input w-full" placeholder="e.g. 1234567890" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">IFSC Code</label>
                                <input type="text" className="tlb-input w-full" placeholder="e.g. HDFC0001234" defaultValue={bank?.ifscCode} />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            <button onClick={() => setActiveModal(null)} className="tlb-button w-full shadow-lg shadow-tlb-yellow/20 py-4">Save Bank Details</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add UPI Modal */}
            {activeModal === 'upi' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-black text-xl">Add UPI ID</h2>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">UPI ID</label>
                                <input type="text" className="tlb-input w-full" placeholder="e.g. john@okhdfcbank" />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
                            <button onClick={() => setActiveModal(null)} className="tlb-button w-full shadow-lg shadow-tlb-yellow/20 py-4">Verify & Save</button>
                            <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">A test charge of ₹1 may be applied</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialHub;

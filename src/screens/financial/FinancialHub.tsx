import React, { useState, useEffect, useRef } from 'react';
import {
  DollarSign, ShieldCheck, AlertCircle, Building2, X, Loader2,
  Inbox, Clock, Eye, XCircle, CheckCircle, Upload, FileText, RefreshCw,
} from 'lucide-react';
import { Screen } from '../../types';
import { getBankDetails, updateBankDetails, BankDetails } from '../../api/banking';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

type VerificationStatus = BankDetails['verification_status'];

const VERIFICATION_CONFIG: Record<VerificationStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending verification', color: 'bg-gray-100 text-gray-600', icon: Clock },
  under_review: { label: 'Under review', color: 'bg-blue-50 text-blue-600', icon: Eye },
  verified: { label: 'Verified', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-600', icon: XCircle },
};

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_REGEX = /^\d{9,18}$/;

const FinancialHub: React.FC<Props> = ({ onOpenSidebar }) => {
  const [loading, setLoading] = useState(true);
  const [bank, setBank] = useState<BankDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [formName, setFormName] = useState('');
  const [formAccount, setFormAccount] = useState('');
  const [formConfirm, setFormConfirm] = useState('');
  const [formIfsc, setFormIfsc] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formBranch, setFormBranch] = useState('');
  const [formConsent, setFormConsent] = useState(false);
  const [chequeFile, setChequeFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBank = async () => {
    try {
      const data = await getBankDetails();
      setBank(data);
    } catch {
      // fetch failed — show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBank(); }, []);

  const openModal = () => {
    if (bank) {
      setFormName(bank.account_holder_name);
      setFormBankName(bank.bank_name || '');
      setFormBranch(bank.branch_name || '');
      setFormIfsc(bank.ifsc_code);
    } else {
      setFormName('');
      setFormBankName('');
      setFormBranch('');
      setFormIfsc('');
    }
    setFormAccount('');
    setFormConfirm('');
    setFormConsent(false);
    setChequeFile(null);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    if (!formName.trim()) { setError('Account holder name is required'); return; }
    if (!ACCOUNT_REGEX.test(formAccount)) { setError('Account number must be 9-18 digits'); return; }
    if (formAccount !== formConfirm) { setError('Account numbers do not match'); return; }
    if (!IFSC_REGEX.test(formIfsc.toUpperCase())) { setError('Invalid IFSC code format (e.g. HDFC0001234)'); return; }
    if (!formConsent) { setError('You must consent to store bank details'); return; }

    setSaving(true);
    try {
      const result = await updateBankDetails(
        {
          account_holder_name: formName.trim(),
          account_number: formAccount,
          ifsc_code: formIfsc.toUpperCase(),
          consent_given: true,
          bank_name: formBankName.trim() || undefined,
          branch_name: formBranch.trim() || undefined,
        },
        chequeFile || undefined
      );
      setBank(result);
      setShowModal(false);
      setToast('Bank details saved. Verification is pending.');
      setTimeout(() => setToast(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const vStatus = bank ? VERIFICATION_CONFIG[bank.verification_status] : null;
  const VIcon = vStatus?.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <main className="flex-1 w-full md:w-auto h-screen overflow-y-auto">
        <header className="bg-white p-6 md:p-10 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
          <div className="flex items-center gap-4">
            
            <div>
              <h1 className="tlb-page-title">Pay-outs & Finance</h1>
              <p className="tlb-page-sub">Manage your payout bank account</p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 tlb-content space-y-6">
          {/* Settlement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Total Earned</p>
              <h3 className="text-3xl font-black text-gray-900 relative z-10">--</h3>
              <div className="absolute right-0 bottom-0 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={100} /></div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Commission Deducted</p>
              <h3 className="text-3xl font-black text-red-400 relative z-10">--</h3>
            </div>
            <div className="bg-gradient-to-br from-tlb-dark to-gray-900 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
              <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest mb-1 relative z-10">Final Payout Pending</p>
              <h3 className="text-3xl font-black text-tlb-yellow relative z-10">--</h3>
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
                  <tbody>
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-300">
                          <Inbox size={36} />
                          <p className="text-sm font-bold">No transactions yet</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bank Account Section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">Payout Account</h2>
                {bank && vStatus && VIcon && (
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${vStatus.color}`}>
                    <VIcon size={12} />
                    {vStatus.label}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-3xl flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
              ) : bank ? (
                <>
                  {/* Bank Card */}
                  <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-tlb-yellow/10 rounded-full blur-xl -ml-10 -mb-10" />

                    <div className="relative z-10 flex justify-between items-start mb-6">
                      <div className="text-[10px] font-black tracking-widest uppercase text-gray-400">
                        {bank.bank_name || 'Primary Bank'}
                      </div>
                      <div className="h-6 px-3 bg-white/10 rounded flex items-center justify-center backdrop-blur-sm border border-white/5">
                        <span className="text-[9px] font-bold tracking-wider">BANKING</span>
                      </div>
                    </div>

                    <div className="relative z-10 space-y-4">
                      <div className="text-xl font-black tracking-[0.2em] font-mono text-gray-100">
                        {bank.account_number_masked}
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-1">Account Holder</p>
                          <p className="font-bold text-sm tracking-wide">{bank.account_holder_name}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{bank.ifsc_code}</p>
                          {bank.branch_name && (
                            <p className="text-[10px] text-gray-500 mt-0.5">{bank.branch_name}</p>
                          )}
                        </div>
                        {bank.verification_status === 'verified' && <ShieldCheck size={22} className="text-emerald-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Rejected warning */}
                  {bank.verification_status === 'rejected' && (
                    <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-red-800">Verification Rejected</h4>
                          {bank.verification_note && (
                            <p className="text-xs text-red-600 mt-1 leading-relaxed">{bank.verification_note}</p>
                          )}
                          <button onClick={openModal} className="text-xs font-bold text-red-700 mt-2 hover:underline">Update details</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pending / under review note */}
                  {(bank.verification_status === 'pending' || bank.verification_status === 'under_review') && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <Clock size={18} className="text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-blue-800">
                            {bank.verification_status === 'pending' ? 'Awaiting Review' : 'Under Admin Review'}
                          </h4>
                          <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                            Your bank details are being reviewed. Payouts will be enabled once verified.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cheque preview */}
                  {bank.cancelled_cheque_url && (
                    <div className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-3">
                      <FileText size={18} className="text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700">Cancelled Cheque</p>
                        <p className="text-[10px] text-gray-400 truncate">Uploaded</p>
                      </div>
                      <a href={bank.cancelled_cheque_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-500 hover:underline">View</a>
                    </div>
                  )}

                  {/* Update button */}
                  <button
                    onClick={openModal}
                    className="w-full bg-white border border-gray-100 hover:border-tlb-yellow hover:shadow-md transition-all p-4 rounded-2xl flex items-center justify-center gap-3 group shadow-sm"
                  >
                    <RefreshCw size={18} className="text-gray-400 group-hover:text-tlb-yellow transition-colors" />
                    <span className="text-sm font-bold text-gray-600">Update Bank Details</span>
                  </button>
                </>
              ) : (
                /* Empty state — no bank details yet */
                <div className="bg-white border-2 border-dashed border-gray-200 p-8 rounded-3xl text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 size={28} className="text-gray-300" />
                  </div>
                  <h3 className="font-bold text-gray-700 mb-1">No bank account linked</h3>
                  <p className="text-xs text-gray-400 mb-5">Add your bank details to receive payouts</p>
                  <button onClick={openModal} className="tlb-button px-8 py-3 text-sm shadow-lg shadow-tlb-yellow/20">
                    Add Bank Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bank Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="font-black text-xl">{bank ? 'Update Bank Account' : 'Add Bank Account'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {bank && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                  <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1.5">
                    <AlertCircle size={13} />
                    Updating will reset verification to pending
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
                  <p className="text-xs text-red-600 font-semibold">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Account Holder Name *</label>
                <input type="text" className="tlb-input w-full" placeholder="As per bank records" value={formName} onChange={e => setFormName(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Account Number *</label>
                <input
                  type="text"
                  className="tlb-input w-full"
                  placeholder={bank ? bank.account_number_masked : '9-18 digit account number'}
                  value={formAccount}
                  onChange={e => setFormAccount(e.target.value.replace(/\D/g, ''))}
                  maxLength={18}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Re-enter Account Number *</label>
                <input
                  type="text"
                  className="tlb-input w-full"
                  placeholder="Confirm account number"
                  value={formConfirm}
                  onChange={e => setFormConfirm(e.target.value.replace(/\D/g, ''))}
                  maxLength={18}
                />
                {formConfirm && formAccount && formConfirm !== formAccount && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold">Account numbers do not match</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">IFSC Code *</label>
                <input
                  type="text"
                  className="tlb-input w-full uppercase"
                  placeholder="e.g. HDFC0001234"
                  value={formIfsc}
                  onChange={e => setFormIfsc(e.target.value.toUpperCase().slice(0, 11))}
                  maxLength={11}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Bank Name</label>
                  <input type="text" className="tlb-input w-full" placeholder="e.g. HDFC Bank" value={formBankName} onChange={e => setFormBankName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Branch</label>
                  <input type="text" className="tlb-input w-full" placeholder="e.g. Andheri" value={formBranch} onChange={e => setFormBranch(e.target.value)} />
                </div>
              </div>

              {/* Cancelled Cheque Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Cancelled Cheque (optional)</label>
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => setChequeFile(e.target.files?.[0] || null)} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 hover:border-tlb-yellow rounded-xl p-4 flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {chequeFile ? (
                    <>
                      <FileText size={16} className="text-emerald-500" />
                      <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">{chequeFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span className="text-xs font-bold">Upload cheque image</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-gray-400 mt-1">Recommended for faster verification</p>
              </div>

              {/* Consent */}
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={formConsent}
                  onChange={e => setFormConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-tlb-yellow focus:ring-tlb-yellow accent-yellow-500"
                />
                <span className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                  I consent to TLB storing my bank details securely for processing payouts.
                </span>
              </label>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving || !formConsent}
                className="tlb-button w-full shadow-lg shadow-tlb-yellow/20 py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Saving...' : 'Save Bank Details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-bold">
          <CheckCircle size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
};

export default FinancialHub;

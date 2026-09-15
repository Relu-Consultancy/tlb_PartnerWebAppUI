import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, FileText, Loader2, Upload } from 'lucide-react';
import { BankDetails, UpdateBankPayload } from '../../../api/banking';
import { PortalModal } from '../../../components/portal';
import { ACCOUNT_REGEX, IFSC_REGEX } from '../model';

interface BankDetailsModalProps {
    open: boolean;
    bank: BankDetails | null;
    onClose: () => void;
    onSave: (data: UpdateBankPayload, cheque?: File) => Promise<boolean>;
}

/** The real bank-account CRUD form — Profile's own "Bank & payouts" tab links back here to edit, so this is the single place that capability lives; restyled to match the mock, logic unchanged. */
export const BankDetailsModal: React.FC<BankDetailsModalProps> = ({ open, bank, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [account, setAccount] = useState('');
    const [confirm, setConfirm] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [bankName, setBankName] = useState('');
    const [branch, setBranch] = useState('');
    const [consent, setConsent] = useState(false);
    const [cheque, setCheque] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        setName(bank?.account_holder_name || '');
        setBankName(bank?.bank_name || '');
        setBranch(bank?.branch_name || '');
        setIfsc(bank?.ifsc_code || '');
        setAccount('');
        setConfirm('');
        setConsent(false);
        setCheque(null);
        setError('');
    }, [open, bank]);

    const handleSave = async () => {
        setError('');
        if (!name.trim()) { setError('Account holder name is required'); return; }
        if (!ACCOUNT_REGEX.test(account)) { setError('Account number must be 9-18 digits'); return; }
        if (account !== confirm) { setError('Account numbers do not match'); return; }
        if (!IFSC_REGEX.test(ifsc.toUpperCase())) { setError('Invalid IFSC code format (e.g. HDFC0001234)'); return; }
        if (!consent) { setError('You must consent to store bank details'); return; }

        setSaving(true);
        const ok = await onSave({
            account_holder_name: name.trim(),
            account_number: account,
            ifsc_code: ifsc.toUpperCase(),
            consent_given: true,
            bank_name: bankName.trim() || undefined,
            branch_name: branch.trim() || undefined,
        }, cheque || undefined);
        setSaving(false);
        if (ok) onClose(); else setError('Failed to save bank details');
    };

    return (
        <PortalModal open={open} onClose={onClose} title={bank ? 'Update bank account' : 'Add bank account'} widthClass="max-w-[480px]">
            <div className="flex flex-col gap-3.5">
                {bank && (
                    <div className="pt-note bg-tlb-cream text-tlb-body">
                        <AlertCircle size={14} strokeWidth={2.75} className="flex-none text-tlb-gold" />
                        Updating will reset verification to pending.
                    </div>
                )}
                {error && <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{error}</div>}

                <div className="pt-field">
                    <label className="pt-field-k">Account holder name</label>
                    <input className="pt-input" placeholder="As per bank records" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
                </div>
                <div className="pt-field">
                    <label className="pt-field-k">Account number</label>
                    <input
                        className="pt-input"
                        placeholder={bank ? bank.account_number_masked : '9-18 digit account number'}
                        value={account}
                        maxLength={18}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccount(e.target.value.replace(/\D/g, ''))}
                    />
                </div>
                <div className="pt-field">
                    <label className="pt-field-k">Re-enter account number</label>
                    <input
                        className="pt-input"
                        placeholder="Confirm account number"
                        value={confirm}
                        maxLength={18}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value.replace(/\D/g, ''))}
                    />
                </div>
                <div className="pt-field">
                    <label className="pt-field-k">IFSC code</label>
                    <input
                        className="pt-input uppercase"
                        placeholder="e.g. HDFC0001234"
                        value={ifsc}
                        maxLength={11}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIfsc(e.target.value.toUpperCase().slice(0, 11))}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="pt-field">
                        <label className="pt-field-k">Bank name</label>
                        <input className="pt-input" placeholder="e.g. HDFC Bank" value={bankName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankName(e.target.value)} />
                    </div>
                    <div className="pt-field">
                        <label className="pt-field-k">Branch</label>
                        <input className="pt-input" placeholder="e.g. Andheri" value={branch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBranch(e.target.value)} />
                    </div>
                </div>

                <div className="pt-field">
                    <label className="pt-field-k">Cancelled cheque (optional)</label>
                    <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheque(e.target.files?.[0] || null)} />
                    <button type="button" onClick={() => fileRef.current?.click()} className="pt-btn pt-btn-o justify-center py-3">
                        {cheque ? <><FileText size={14} className="text-tlb-green" /> {cheque.name}</> : <><Upload size={14} /> Upload cheque image</>}
                    </button>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer text-[12px] text-tlb-muted">
                    <input type="checkbox" checked={consent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsent(e.target.checked)} className="mt-0.5" />
                    I consent to TLB storing my bank details securely for processing payouts.
                </label>

                <button type="button" onClick={handleSave} disabled={saving} className="pt-btn pt-btn-y justify-center py-3 mt-1">
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? 'Saving…' : 'Save bank details'}
                </button>
            </div>
        </PortalModal>
    );
};

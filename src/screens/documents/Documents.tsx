import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
    ShieldCheck,
    Clock,
    AlertCircle,
    Loader2,
    CheckCircle2,
    RefreshCw,
    Image as ImageIcon,
    UploadCloud,
    Trash2,
    FileText,
    Landmark,
    BadgeCheck,
    ArrowLeft,
} from 'lucide-react';
import { Screen } from '../../types';
import { toast } from '../../components/ui';
import { requestProfileSection } from '../../constants/profileSections';
import { verificationOf } from '../../components/portal';
import { getCurrentPartner, getPartnerMedia, uploadPartnerMedia, deletePartnerMedia, submitVerification } from '../../api/onboarding';
import { notifyPartnerUpdated } from '../../api/portalSummary';
import { BankDetails, getBankDetails } from '../../api/banking';

interface Props {
    onNavigate: (s: Screen) => void;
    onOpenSidebar: () => void;
}

const API_BASE = 'https://tlb-api.reluconsultancy.in';
const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const ACCOUNT_DIGITS = 12;
// Keep in step with ACCOUNT_DIGITS — a template literal would eat the \d.
const ACCOUNT_REGEX = /^\d{12}$/;

/** Field labels for the backend's validation errors, keyed by its own field names. */
const FIELD_LABEL: Record<string, string> = {
    pan_number: 'PAN number',
    gst_number: 'GST number',
    account_holder_name: 'Account holder name',
    account_number: 'Account number',
    ifsc_code: 'IFSC code',
};

/**
 * Turns a DRF validation payload into something a partner can read. The API
 * hands back the serializer's own repr —
 * `{'account_number': [ErrorDetail(string='This field may not be blank.', …)]}`
 * — which must never reach a toast as-is.
 */
export const humanizeFieldErrors = (raw: string): string | null => {
    const fields = [...raw.matchAll(/['"]([a-z_]+)['"]\s*:/g)].map((m) => m[1]).filter((f) => f in FIELD_LABEL);
    if (fields.length === 0) return null;
    const unique = [...new Set(fields)].map((f) => FIELD_LABEL[f]);
    return /blank|required/i.test(raw)
        ? `Please fill ${unique.join(', ')} before saving.`
        : `Please check ${unique.join(', ')} and try again.`;
};
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** ABCDE1234F -> ABCDE••••F — enough to recognise, not enough to copy. */
export const maskPan = (pan: string) => (pan.length === 10 ? `${pan.slice(0, 5)}••••${pan.slice(9)}` : pan);
const maskAccount = (acc: string) => (acc.length > 4 ? `••${acc.slice(-4)}` : acc);

const Documents: React.FC<Props> = ({ onNavigate }) => {
    // Documents lives under My profile → return to its Documents & KYC section.
    const backToProfile = () => {
        requestProfileSection('documents');
        onNavigate('BRAND_PROFILE');
    };

    const [loading, setLoading] = useState(true);
    const [partner, setPartner] = useState<any>(null);
    const [bank, setBank] = useState<BankDetails | null>(null);
    // Submitted documents show as a summary; this reopens the form to change them.
    const [editing, setEditing] = useState(false);
    const [justSubmitted, setJustSubmitted] = useState(false);
    const [media, setMedia] = useState<any[]>([]);

    // KYC form
    const [pan, setPan] = useState('');
    const [gst, setGst] = useState('');
    const [holder, setHolder] = useState('');
    const [account, setAccount] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [savingKyc, setSavingKyc] = useState(false);
    // State flips only after a re-render; a ref stops a fast double tap sending twice.
    const savingRef = useRef(false);
    // The "what's missing" warning is stale once a save goes through.
    const warningRef = useRef<number | null>(null);
    // Set by the first failed save, so empty fields only turn red once asked for.
    const [showMissing, setShowMissing] = useState(false);

    // Uploads
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const docRef = useRef<HTMLInputElement>(null);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [pRes, mRes, bRes] = await Promise.allSettled([getCurrentPartner(), getPartnerMedia(), getBankDetails()]);
            const p = pRes.status === 'fulfilled' ? pRes.value?.data || pRes.value : null;
            const m = mRes.status === 'fulfilled' ? mRes.value?.data || mRes.value : [];
            const b = bRes.status === 'fulfilled' ? bRes.value : null;
            setPartner(p);
            setMedia(Array.isArray(m) ? m : []);
            setBank(b);

            // The partner record doesn't send these back (and the verification
            // endpoint is POST-only), so a field is filled only when the server
            // actually has a value — never blanked. QA: everything typed vanished
            // right after a successful save, and the next save demanded the PAN.
            const v = (p?.verification || p || {}) as any;
            const keep = (server: unknown) => (prev: string) => (typeof server === 'string' && server ? server : prev);
            setPan(keep(v.pan_number || p?.pan_number));
            setGst(keep(v.gst_number || p?.gst_number));
            setHolder(keep(v.account_holder_name || p?.account_holder_name || b?.account_holder_name));
            // A masked number ("••4412") is never a usable value for the form.
            const fullAccount = v.account_number || p?.account_number || p?.bank_account_number;
            setAccount(keep(typeof fullAccount === 'string' && /^\d+$/.test(fullAccount) ? fullAccount : ''));
            setIfsc(keep(v.ifsc_code || p?.ifsc_code || b?.ifsc_code));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const status = partner?.status || '';
    const isVerified = verificationOf(partner) === 'verified';
    const inReview = ['under_review', 'approved'].includes(status);
    // Once submitted, show what was sent rather than an empty form asking again.
    const submitted = justSubmitted || inReview || isVerified;
    const showForm = !submitted || editing;

    const panValid = !pan || PAN_REGEX.test(pan.toUpperCase());
    const ifscValid = !ifsc || IFSC_REGEX.test(ifsc.toUpperCase());

    const accountValid = !account || ACCOUNT_REGEX.test(account);

    // POST /partner/verification/ is the only way in (no partial update), and it
    // refuses the request unless the bank account comes with it. So PAN and bank
    // details are one submission — QA saved a PAN alone and got a bank error.
    const missing = {
        pan: !pan.trim(),
        holder: !holder.trim(),
        account: !account,
        ifsc: !ifsc.trim(),
    };
    const hasBank = !missing.holder && !missing.account && !missing.ifsc;
    const canSaveKyc = !missing.pan && hasBank && panValid && ifscValid && accountValid && !savingKyc;
    const flag = (isMissing: boolean) => showMissing && isMissing;
    const flagCls = (isMissing: boolean) => (flag(isMissing) ? ' !border-red-300 ring-1 ring-red-200' : '');

    const saveKyc = async () => {
        if (savingRef.current) return;
        if (!canSaveKyc) {
            setShowMissing(true);
            if (!missing.pan && panValid && !hasBank) {
                warningRef.current = toast.warning(
                    'Add your bank account below to submit — your PAN and bank details are verified together.'
                );
            } else if (missing.pan || !panValid) {
                warningRef.current = toast.warning(
                    missing.pan ? 'Enter your PAN number to submit.' : 'Check your PAN number — it should look like ABCDE1234F.'
                );
            } else if (!accountValid) {
                warningRef.current = toast.warning(`Account number must be ${ACCOUNT_DIGITS} digits.`);
            } else {
                warningRef.current = toast.warning('Check the highlighted fields and try again.');
            }
            // Take the partner to the first thing to fix — usually off-screen on a phone.
            requestAnimationFrame(() => {
                const first = document.querySelector<HTMLInputElement>('[data-kyc-field][aria-invalid="true"]');
                first?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                first?.focus({ preventScroll: true });
            });
            return;
        }
        savingRef.current = true;
        setSavingKyc(true);
        try {
            // Only what's actually filled — the API rejects a blank string on
            // any of these, which is what produced the raw serializer error.
            const payload: Record<string, unknown> = {
                agreement_accepted: true,
                pan_number: pan.trim().toUpperCase(),
                account_holder_name: holder.trim(),
                account_number: account,
                ifsc_code: ifsc.trim().toUpperCase(),
            };
            if (gst.trim()) payload.gst_number = gst.trim().toUpperCase();
            await submitVerification(payload);
            toast.success('Documents submitted. Your details are under review.');
            if (warningRef.current != null) toast.dismiss(warningRef.current);
            setJustSubmitted(true);
            setEditing(false);
            setShowMissing(false);
            // Status just changed: drop the memoised partner read so the header
            // chip and the approval gate pick it up without a reload.
            notifyPartnerUpdated();
            loadAll();
        } catch (e: any) {
            const raw = String(e?.message || '');
            toast.error(humanizeFieldErrors(raw) || raw || 'Failed to update documents.');
        } finally {
            savingRef.current = false;
            setSavingKyc(false);
        }
    };

    const addDocument = async (file: File) => {
        const isVideo = file.type.startsWith('video');
        setUploadingDoc(true);
        try {
            await uploadPartnerMedia(file, isVideo ? 'video' : 'image');
            toast.success('Document uploaded.');
            loadAll();
        } catch (e: any) {
            toast.error(e?.message || 'Upload failed.');
        } finally {
            setUploadingDoc(false);
        }
    };

    const removeMedia = async (id: number) => {
        try {
            await deletePartnerMedia(id);
            setMedia((prev) => prev.filter((m) => m.id !== id));
            toast.success('Removed.');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to remove.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white px-6 md:px-10 py-5 flex items-center gap-4 border-b border-gray-100">
                <button
                    type="button"
                    onClick={backToProfile}
                    aria-label="Back to My profile"
                    className="w-10 h-10 flex-none rounded-[10px] border border-tlb-line bg-white flex items-center justify-center text-tlb-ink hover:bg-tlb-wash transition-colors"
                >
                    <ArrowLeft size={18} strokeWidth={2.5} />
                </button>
                <div>
                    <nav aria-label="Breadcrumb" className="text-xs text-tlb-muted mb-1">
                        <button
                            type="button"
                            onClick={() => onNavigate('HOME')}
                            className="text-tlb-link hover:text-tlb-gold transition-colors"
                        >
                            Dashboard
                        </button>
                        {' · '}
                        <button type="button" onClick={backToProfile} className="text-tlb-link hover:text-tlb-gold transition-colors">
                            My Profile
                        </button>
                        {' · '}Documents
                    </nav>
                    <h1 className="tlb-page-title">Documents</h1>
                    <p className="tlb-page-sub">View &amp; update your verification documents</p>
                </div>
            </header>

            <main className="p-5 md:p-8 max-w-4xl mx-auto space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <RefreshCw size={26} className="text-gray-300 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Verification status banner */}
                        <div
                            className={`rounded-2xl border p-5 flex items-center gap-4 ${
                                isVerified
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : inReview
                                      ? 'bg-blue-50 border-blue-200'
                                      : 'bg-amber-50 border-amber-200'
                            }`}
                        >
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                    isVerified
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : inReview
                                          ? 'bg-blue-100 text-blue-600'
                                          : 'bg-amber-100 text-amber-600'
                                }`}
                            >
                                {isVerified ? <BadgeCheck size={24} /> : inReview ? <Clock size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p
                                    className={`font-black ${isVerified ? 'text-emerald-700' : inReview ? 'text-blue-700' : 'text-amber-700'}`}
                                >
                                    {isVerified ? 'Verified Partner' : inReview ? 'Documents Under Review' : 'Verification Pending'}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isVerified
                                        ? 'Your documents have been verified by the TLB team.'
                                        : inReview
                                          ? 'Your submitted documents are being reviewed.'
                                          : 'Add your KYC & bank details below to get verified.'}
                                </p>
                            </div>
                        </div>

                        {!showForm ? (
                            <section
                                aria-label="Submitted documents"
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4"
                            >
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="font-black text-sm text-gray-900 leading-none">
                                                Identity &amp; bank details submitted
                                            </h2>
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                {isVerified ? 'Verified by the TLB team' : 'With the TLB team for review'}
                                            </p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setEditing(true)} className="pt-btn pt-btn-o shrink-0">
                                        Update details
                                    </button>
                                </div>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                    {[
                                        ['PAN', pan ? maskPan(pan.toUpperCase()) : 'Submitted'],
                                        ['GST', gst ? gst.toUpperCase() : 'Not provided'],
                                        ['Account holder', bank?.account_holder_name || holder || 'Submitted'],
                                        ['Account number', bank?.account_number_masked || (account ? maskAccount(account) : 'Submitted')],
                                        ['IFSC', bank?.ifsc_code || ifsc.toUpperCase() || 'Submitted'],
                                    ].map(([k, val]) => (
                                        <div key={k} className="min-w-0">
                                            <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">{k}</dt>
                                            <dd className="font-bold text-gray-800 mt-0.5 break-words">{val}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </section>
                        ) : (
                            <>
                                {submitted && (
                                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-gray-100 p-4 text-[12.5px] text-gray-600">
                                        <span>
                                            Updating sends your details for review again. Enter the full account number — it's only ever
                                            shown masked.
                                        </span>
                                        <button type="button" onClick={() => setEditing(false)} className="pt-btn pt-btn-o shrink-0">
                                            Cancel
                                        </button>
                                    </div>
                                )}
                                {/* KYC / Identity & Tax */}
                                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-tlb-yellow/10 text-tlb-yellow flex items-center justify-center">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <h2 className="font-black text-sm text-gray-900 leading-none">Identity &amp; Tax</h2>
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                PAN required · GST optional · submitted with your bank account
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="tlb-label">PAN Number</label>
                                            <input
                                                value={pan}
                                                onChange={(e) => setPan(e.target.value.toUpperCase())}
                                                maxLength={10}
                                                placeholder="ABCDE1234F"
                                                className={`tlb-input w-full uppercase${flagCls(missing.pan)}`}
                                                data-kyc-field
                                                aria-invalid={flag(missing.pan) || !panValid}
                                            />
                                            {!panValid && <p className="text-[11px] text-red-500 font-bold mt-1">Invalid PAN format</p>}
                                            {flag(missing.pan) && (
                                                <p className="text-[11px] text-red-500 font-bold mt-1">Enter your PAN number</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="tlb-label">
                                                GST Number <span className="text-gray-300">(optional)</span>
                                            </label>
                                            <input
                                                value={gst}
                                                onChange={(e) => setGst(e.target.value.toUpperCase())}
                                                maxLength={15}
                                                placeholder="22ABCDE1234F1Z5"
                                                className="tlb-input w-full uppercase"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end pt-1">
                                        <button onClick={saveKyc} disabled={savingKyc} className="tlb-button px-6 py-3 disabled:opacity-50">
                                            {savingKyc ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                            Save Documents
                                        </button>
                                    </div>
                                </section>

                                {/* Bank account */}
                                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Landmark size={18} />
                                        </div>
                                        <div>
                                            <h2 className="font-black text-sm text-gray-900 leading-none">Bank Account</h2>
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                Where your payouts are settled · required to submit
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="tlb-label">Account Holder Name</label>
                                            <input
                                                value={holder}
                                                onChange={(e) => setHolder(e.target.value)}
                                                placeholder="As per bank records"
                                                className={`tlb-input w-full${flagCls(missing.holder)}`}
                                                data-kyc-field
                                                aria-invalid={flag(missing.holder)}
                                            />
                                            {flag(missing.holder) && (
                                                <p className="text-[11px] text-red-500 font-bold mt-1">Enter the account holder name</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="tlb-label">Account Number</label>
                                            <input
                                                value={account}
                                                onChange={(e) => setAccount(e.target.value.replace(/\D/g, '').slice(0, ACCOUNT_DIGITS))}
                                                maxLength={ACCOUNT_DIGITS}
                                                inputMode="numeric"
                                                placeholder={`${ACCOUNT_DIGITS}-digit account number`}
                                                className={`tlb-input w-full${flagCls(missing.account)}`}
                                                data-kyc-field
                                                aria-invalid={flag(missing.account) || !accountValid}
                                            />
                                            {flag(missing.account) && (
                                                <p className="text-[11px] text-red-500 font-bold mt-1">Enter the account number</p>
                                            )}
                                            {!accountValid && (
                                                <p className="text-[11px] text-red-500 font-bold mt-1">
                                                    Account number must be {ACCOUNT_DIGITS} digits
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="tlb-label">IFSC Code</label>
                                            <input
                                                value={ifsc}
                                                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                                                maxLength={11}
                                                placeholder="HDFC0001234"
                                                className={`tlb-input w-full uppercase${flagCls(missing.ifsc)}`}
                                                data-kyc-field
                                                aria-invalid={flag(missing.ifsc) || !ifscValid}
                                            />
                                            {!ifscValid && <p className="text-[11px] text-red-500 font-bold mt-1">Invalid IFSC format</p>}
                                            {flag(missing.ifsc) && (
                                                <p className="text-[11px] text-red-500 font-bold mt-1">Enter the IFSC code</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end pt-1">
                                        <button onClick={saveKyc} disabled={savingKyc} className="tlb-button px-6 py-3 disabled:opacity-50">
                                            {savingKyc ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                            Save Documents
                                        </button>
                                    </div>
                                </section>
                            </>
                        )}

                        {/* Additional uploaded documents / media */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <UploadCloud size={18} />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-sm text-gray-900 leading-none">Uploaded Documents &amp; Media</h2>
                                        <p className="text-[11px] text-gray-400 mt-1">Certificates, brochures, gallery &amp; more</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => docRef.current?.click()}
                                    disabled={uploadingDoc}
                                    className="tlb-button px-4 py-2.5 text-sm disabled:opacity-50"
                                >
                                    {uploadingDoc ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                                    Add
                                </button>
                                <input
                                    ref={docRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    hidden
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) addDocument(f);
                                        e.target.value = '';
                                    }}
                                />
                            </div>

                            {media.length === 0 ? (
                                <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                                    <ImageIcon size={26} className="text-gray-200 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-gray-400">No documents uploaded yet</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Use “Add” to upload certificates or images.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {media.map((m, i) => {
                                        const url = resolveUrl(m.file_url || m.url);
                                        const isVideo = (m.media_type || '').includes('video');
                                        return (
                                            <motion.div
                                                key={m.id ?? i}
                                                initial={{ opacity: 0, scale: 0.96 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.2) }}
                                                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100"
                                            >
                                                {isVideo ? (
                                                    <video src={url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                )}
                                                <button
                                                    onClick={() => removeMedia(m.id)}
                                                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-white/90 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-gray-400" />
                            Updating identity or bank details re-submits them for review.
                        </p>
                    </>
                )}
            </main>
        </div>
    );
};

export default Documents;

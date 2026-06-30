import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
    Menu, ShieldCheck, Clock, AlertCircle, Loader2, CheckCircle2, RefreshCw,
    Image as ImageIcon, UploadCloud, Trash2, FileText, Landmark, BadgeCheck,
} from 'lucide-react';
import { Screen } from '../../types';
import { toast } from '../../components/ui';
import {
    getCurrentPartner, getExtendedProfile, updateExtendedProfile,
    getPartnerMedia, uploadPartnerMedia, deletePartnerMedia, submitVerification,
} from '../../api/onboarding';

interface Props { onNavigate: (s: Screen) => void; onOpenSidebar: () => void; }

const API_BASE = 'https://tlb-api.reluconsultancy.in';
const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const Documents: React.FC<Props> = ({ onOpenSidebar }) => {
    const [loading, setLoading] = useState(true);
    const [partner, setPartner] = useState<any>(null);
    const [extended, setExtended] = useState<any>(null);
    const [media, setMedia] = useState<any[]>([]);

    // KYC form
    const [pan, setPan] = useState('');
    const [gst, setGst] = useState('');
    const [holder, setHolder] = useState('');
    const [account, setAccount] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [savingKyc, setSavingKyc] = useState(false);

    // Uploads
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const logoRef = useRef<HTMLInputElement>(null);
    const coverRef = useRef<HTMLInputElement>(null);
    const docRef = useRef<HTMLInputElement>(null);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [pRes, eRes, mRes] = await Promise.allSettled([
                getCurrentPartner(), getExtendedProfile(), getPartnerMedia(),
            ]);
            const p = pRes.status === 'fulfilled' ? (pRes.value?.data || pRes.value) : null;
            const e = eRes.status === 'fulfilled' ? (eRes.value?.data || eRes.value) : null;
            const m = mRes.status === 'fulfilled' ? (mRes.value?.data || mRes.value) : [];
            setPartner(p);
            setExtended(e);
            setMedia(Array.isArray(m) ? m : []);

            const v = (p?.verification || p || {}) as any;
            setPan(v.pan_number || p?.pan_number || '');
            setGst(v.gst_number || p?.gst_number || '');
            setHolder(v.account_holder_name || p?.account_holder_name || '');
            setAccount(v.account_number || p?.account_number || p?.bank_account_number || '');
            setIfsc(v.ifsc_code || p?.ifsc_code || '');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    const status = partner?.status || '';
    const isVerified = partner?.is_verified === true || status === 'approved';
    const inReview = ['under_review', 'approved'].includes(status);

    const panValid = !pan || PAN_REGEX.test(pan.toUpperCase());
    const ifscValid = !ifsc || IFSC_REGEX.test(ifsc.toUpperCase());
    const canSaveKyc = !!pan && !!holder && !!account && !!ifsc && panValid && ifscValid && !savingKyc;

    const saveKyc = async () => {
        if (!canSaveKyc) {
            toast.warning('Please fill PAN, bank details with valid formats.');
            return;
        }
        setSavingKyc(true);
        try {
            await submitVerification({
                pan_number: pan.toUpperCase(),
                gst_number: gst.toUpperCase(),
                account_holder_name: holder,
                account_number: account,
                ifsc_code: ifsc.toUpperCase(),
                agreement_accepted: true,
            });
            toast.success('Documents submitted. Your details are under review.');
            loadAll();
        } catch (e: any) {
            toast.error(e?.message || 'Failed to update documents.');
        } finally {
            setSavingKyc(false);
        }
    };

    const replaceImage = async (file: File, field: 'logo' | 'cover_image', setBusy: (b: boolean) => void) => {
        setBusy(true);
        try {
            const fd = new FormData();
            fd.append(field, file);
            await updateExtendedProfile(fd);
            toast.success(`${field === 'logo' ? 'Logo' : 'Cover'} updated.`);
            loadAll();
        } catch (e: any) {
            toast.error(e?.message || 'Upload failed.');
        } finally {
            setBusy(false);
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
            setMedia(prev => prev.filter(m => m.id !== id));
            toast.success('Removed.');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to remove.');
        }
    };

    const logoUrl = resolveUrl(extended?.logo || partner?.logo);
    const coverUrl = resolveUrl(extended?.cover_image || partner?.cover_image);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white px-6 md:px-10 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
                <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={24} /></button>
                <div>
                    <h1 className="tlb-page-title">Documents</h1>
                    <p className="tlb-page-sub">View &amp; update your verification documents</p>
                </div>
            </header>

            <main className="p-5 md:p-8 max-w-4xl mx-auto space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-24"><RefreshCw size={26} className="text-gray-300 animate-spin" /></div>
                ) : (
                    <>
                        {/* Verification status banner */}
                        <div className={`rounded-2xl border p-5 flex items-center gap-4 ${
                            isVerified ? 'bg-emerald-50 border-emerald-200' :
                            inReview ? 'bg-blue-50 border-blue-200' :
                            'bg-amber-50 border-amber-200'
                        }`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                isVerified ? 'bg-emerald-100 text-emerald-600' :
                                inReview ? 'bg-blue-100 text-blue-600' :
                                'bg-amber-100 text-amber-600'
                            }`}>
                                {isVerified ? <BadgeCheck size={24} /> : inReview ? <Clock size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-black ${isVerified ? 'text-emerald-700' : inReview ? 'text-blue-700' : 'text-amber-700'}`}>
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

                        {/* KYC / Identity & Tax */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-tlb-yellow/10 text-tlb-yellow flex items-center justify-center"><FileText size={18} /></div>
                                <div>
                                    <h2 className="font-black text-sm text-gray-900 leading-none">Identity &amp; Tax</h2>
                                    <p className="text-[11px] text-gray-400 mt-1">PAN is required · GST optional</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="tlb-label">PAN Number</label>
                                    <input value={pan} onChange={e => setPan(e.target.value.toUpperCase())} maxLength={10}
                                        placeholder="ABCDE1234F" className="tlb-input w-full uppercase" />
                                    {!panValid && <p className="text-[11px] text-red-500 font-bold mt-1">Invalid PAN format</p>}
                                </div>
                                <div>
                                    <label className="tlb-label">GST Number <span className="text-gray-300">(optional)</span></label>
                                    <input value={gst} onChange={e => setGst(e.target.value.toUpperCase())} maxLength={15}
                                        placeholder="22ABCDE1234F1Z5" className="tlb-input w-full uppercase" />
                                </div>
                            </div>
                        </section>

                        {/* Bank account */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Landmark size={18} /></div>
                                <div>
                                    <h2 className="font-black text-sm text-gray-900 leading-none">Bank Account</h2>
                                    <p className="text-[11px] text-gray-400 mt-1">Where your payouts are settled</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="tlb-label">Account Holder Name</label>
                                    <input value={holder} onChange={e => setHolder(e.target.value)} placeholder="As per bank records" className="tlb-input w-full" />
                                </div>
                                <div>
                                    <label className="tlb-label">Account Number</label>
                                    <input value={account} onChange={e => setAccount(e.target.value.replace(/\D/g, ''))} placeholder="Account number" className="tlb-input w-full" />
                                </div>
                                <div>
                                    <label className="tlb-label">IFSC Code</label>
                                    <input value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} maxLength={11} placeholder="HDFC0001234" className="tlb-input w-full uppercase" />
                                    {!ifscValid && <p className="text-[11px] text-red-500 font-bold mt-1">Invalid IFSC format</p>}
                                </div>
                            </div>
                            <div className="flex items-center justify-end pt-1">
                                <button onClick={saveKyc} disabled={!canSaveKyc} className="tlb-button px-6 py-3 disabled:opacity-50">
                                    {savingKyc ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                    Save Documents
                                </button>
                            </div>
                        </section>

                        {/* Brand documents — logo & cover */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><ImageIcon size={18} /></div>
                                <div>
                                    <h2 className="font-black text-sm text-gray-900 leading-none">Brand Documents</h2>
                                    <p className="text-[11px] text-gray-400 mt-1">Logo &amp; cover image on your public profile</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Logo */}
                                <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                                        {logoUrl ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" /> : <ImageIcon size={22} className="text-gray-300" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900">Logo</p>
                                        <p className="text-[11px] text-gray-400">{logoUrl ? 'Uploaded' : 'Not uploaded'}</p>
                                        <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-blue-500 hover:underline disabled:opacity-50">
                                            {uploadingLogo ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
                                            {logoUrl ? 'Replace' : 'Upload'}
                                        </button>
                                        <input ref={logoRef} type="file" accept="image/*" hidden
                                            onChange={e => { const f = e.target.files?.[0]; if (f) replaceImage(f, 'logo', setUploadingLogo); e.target.value = ''; }} />
                                    </div>
                                </div>
                                {/* Cover */}
                                <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                                        {coverUrl ? <img src={coverUrl} alt="cover" className="w-full h-full object-cover" /> : <ImageIcon size={22} className="text-gray-300" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900">Cover Image</p>
                                        <p className="text-[11px] text-gray-400">{coverUrl ? 'Uploaded' : 'Not uploaded'}</p>
                                        <button onClick={() => coverRef.current?.click()} disabled={uploadingCover}
                                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-blue-500 hover:underline disabled:opacity-50">
                                            {uploadingCover ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
                                            {coverUrl ? 'Replace' : 'Upload'}
                                        </button>
                                        <input ref={coverRef} type="file" accept="image/*" hidden
                                            onChange={e => { const f = e.target.files?.[0]; if (f) replaceImage(f, 'cover_image', setUploadingCover); e.target.value = ''; }} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Additional uploaded documents / media */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><UploadCloud size={18} /></div>
                                    <div>
                                        <h2 className="font-black text-sm text-gray-900 leading-none">Uploaded Documents &amp; Media</h2>
                                        <p className="text-[11px] text-gray-400 mt-1">Certificates, brochures, gallery &amp; more</p>
                                    </div>
                                </div>
                                <button onClick={() => docRef.current?.click()} disabled={uploadingDoc}
                                    className="tlb-button px-4 py-2.5 text-sm disabled:opacity-50">
                                    {uploadingDoc ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                                    Add
                                </button>
                                <input ref={docRef} type="file" accept="image/*,video/*" hidden
                                    onChange={e => { const f = e.target.files?.[0]; if (f) addDocument(f); e.target.value = ''; }} />
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
                                            <motion.div key={m.id ?? i}
                                                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.2) }}
                                                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                                                {isVideo
                                                    ? <video src={url} className="w-full h-full object-cover" />
                                                    : <img src={url} alt="" className="w-full h-full object-cover" />}
                                                <button onClick={() => removeMedia(m.id)}
                                                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-white/90 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
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

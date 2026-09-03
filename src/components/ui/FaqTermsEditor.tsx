import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, HelpCircle, FileText, Save, X, Upload, Paperclip } from 'lucide-react';
import {
    getListingTerms, setListingTerms, deleteListingTerms, getListingFaqDoc, setListingFaqDoc, deleteListingFaqDoc,
    uploadFaqDocument, deleteFaqDocument, bulkSaveFaqs,
    FaqDocument, FaqDocumentEntity, FAQ_DOCUMENT_ACCEPTED_EXTENSIONS, FAQ_DOCUMENT_MAX_BYTES, FAQ_DOCUMENT_MAX_COUNT,
} from '../../api/listings';
import { toast } from './Toast';

export interface FaqApi {
    list: (listingId: string) => Promise<any>;
    create: (listingId: string, data: { question: string; answer: string; sort_order?: number }) => Promise<any>;
    update: (listingId: string, faqId: number, data: { question: string; answer: string; sort_order?: number }) => Promise<any>;
    remove: (listingId: string, faqId: number) => Promise<any>;
}

interface FaqRow { id?: number; question: string; answer: string; documents?: FaqDocument[]; uploadingDoc?: boolean; }

interface Props {
    listingId: string;
    faqApi: FaqApi;
    /** Accent colour matching the wizard theme. */
    accent?: 'blue' | 'amber' | 'emerald' | 'purple';
    /**
     * The listing type this FAQ list belongs to. Drives two things: the bulk
     * PUT .../faqs/bulk/ call the single "Save FAQs" button uses (without this,
     * saving is disabled), and per-FAQ document attachments (up to
     * FAQ_DOCUMENT_MAX_COUNT files per FAQ). Live for all four listing types —
     * every current caller passes this; treat it as required in practice.
     */
    faqDocumentsEntity?: FaqDocumentEntity;
}

const fmtBytes = (n: number | null): string => {
    if (n == null) return 'size unknown';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const fileExtension = (name: string): string => (name.split('.').pop() || '').toLowerCase();

const validateFaqDocument = (file: File): string | null => {
    if (!FAQ_DOCUMENT_ACCEPTED_EXTENSIONS.includes(fileExtension(file.name))) {
        return 'Upload a PDF, Word, Excel or image file.';
    }
    if (file.size > FAQ_DOCUMENT_MAX_BYTES) {
        return 'File must be under 10 MB.';
    }
    return null;
};

const ACCENT: Record<NonNullable<Props['accent']>, { btn: string; soft: string; text: string; ring: string }> = {
    blue:    { btn: 'bg-blue-500 hover:bg-blue-600',       soft: 'bg-blue-50 text-blue-600',       text: 'text-blue-600',    ring: 'focus:border-blue-300' },
    amber:   { btn: 'bg-amber-500 hover:bg-amber-600',     soft: 'bg-amber-50 text-amber-600',     text: 'text-amber-600',   ring: 'focus:border-amber-300' },
    emerald: { btn: 'bg-emerald-500 hover:bg-emerald-600', soft: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-600', ring: 'focus:border-emerald-300' },
    purple:  { btn: 'bg-purple-500 hover:bg-purple-600',   soft: 'bg-purple-50 text-purple-600',   text: 'text-purple-600',  ring: 'focus:border-purple-300' },
};

const MAX_DOC = 10 * 1024 * 1024;

export const FaqTermsEditor: React.FC<Props> = ({ listingId, faqApi, accent = 'blue', faqDocumentsEntity }) => {
    const a = ACCENT[accent];

    const [faqs, setFaqs] = useState<FaqRow[]>([]);
    const [loadingFaqs, setLoadingFaqs] = useState(true);
    const [savingFaqs, setSavingFaqs] = useState(false);
    const [confirmBulkSave, setConfirmBulkSave] = useState(false);

    const [termsContent, setTermsContent] = useState('');
    const [termsDocUrl, setTermsDocUrl] = useState<string | null>(null);
    const [termsFile, setTermsFile] = useState<File | null>(null);
    const [termsLoaded, setTermsLoaded] = useState(false);
    const [savingTerms, setSavingTerms] = useState(false);
    const [hasTerms, setHasTerms] = useState(false);

    const [faqDocUrl, setFaqDocUrl] = useState<string | null>(null);
    const [faqFile, setFaqFile] = useState<File | null>(null);
    const [faqDocLoaded, setFaqDocLoaded] = useState(false);
    const [savingFaqDoc, setSavingFaqDoc] = useState(false);
    const [hasFaqDoc, setHasFaqDoc] = useState(false);

    useEffect(() => {
        if (!listingId) { setLoadingFaqs(false); setTermsLoaded(true); setFaqDocLoaded(true); return; }
        let alive = true;
        (async () => {
            try {
                const res = await faqApi.list(listingId);
                const data = res?.data ?? res;
                const arr = Array.isArray(data) ? data : (data?.results ?? []);
                if (alive) setFaqs(arr.map((f: any) => ({ id: f.id, question: f.question || '', answer: f.answer || '', documents: Array.isArray(f.documents) ? f.documents : [] })));
            } catch { /* ignore */ } finally { if (alive) setLoadingFaqs(false); }
        })();
        (async () => {
            try {
                const res = await getListingTerms(listingId);
                const d = res?.data ?? res;
                if (alive && d) {
                    setTermsContent(d.content || '');
                    setTermsDocUrl(d.document_url || null);
                    setHasTerms(true);
                }
            } catch { /* ignore */ } finally { if (alive) setTermsLoaded(true); }
        })();
        (async () => {
            try {
                const res = await getListingFaqDoc(listingId);
                const d = res?.data ?? res;
                if (alive && d) {
                    setFaqDocUrl(d.document_url || null);
                    if (d.document_url) setHasFaqDoc(true);
                }
            } catch { /* ignore */ } finally { if (alive) setFaqDocLoaded(true); }
        })();
        return () => { alive = false; };
    }, [listingId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── FAQ handlers ──
    const setRow = (idx: number, patch: Partial<FaqRow>) =>
        setFaqs(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));

    const addFaq = () => setFaqs(prev => [...prev, { question: '', answer: '' }]);

    // Any FAQ carrying documents today means saving again will wipe them —
    // the bulk endpoint drops and recreates every row (even unchanged ones),
    // which deletes their attached documents along with them.
    const anyDocsAttached = faqs.some(f => (f.documents?.length || 0) > 0);

    const removeFaq = (idx: number) => {
        // Deletion is deferred to the next Save — the bulk endpoint is
        // replace-all, so a row simply missing from the array is removed.
        setFaqs(prev => prev.filter((_, i) => i !== idx));
    };

    const saveAllFaqs = async (skipConfirm = false) => {
        if (!faqDocumentsEntity) return; // bulk save requires a known entity
        const incomplete = faqs.some(f => (f.question.trim() && !f.answer.trim()) || (!f.question.trim() && f.answer.trim()));
        if (incomplete) { toast.warning('Complete or remove any FAQ that only has a question or only an answer.'); return; }
        const rows = faqs.filter(f => f.question.trim() && f.answer.trim());

        if (!skipConfirm && anyDocsAttached) { setConfirmBulkSave(true); return; }
        setConfirmBulkSave(false);

        setSavingFaqs(true);
        try {
            const payload = rows.map((f, i) => ({ question: f.question.trim(), answer: f.answer.trim(), sort_order: i }));
            const res = await bulkSaveFaqs(faqDocumentsEntity, listingId, payload);
            const data = res?.data ?? res;
            const arr = Array.isArray(data) ? data : (data?.results ?? []);
            setFaqs(arr.map((f: any) => ({ id: f.id, question: f.question || '', answer: f.answer || '', documents: Array.isArray(f.documents) ? f.documents : [] })));
            toast.success('FAQs saved.');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to save FAQs.');
        } finally {
            setSavingFaqs(false);
        }
    };

    // ── Per-FAQ document handlers (only active when `faqDocumentsEntity` is passed) ──
    const pickFaqRowDoc = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !faqDocumentsEntity) return;
        const f = faqs[idx];
        if (!f.id) return;
        const err = validateFaqDocument(file);
        if (err) { toast.warning(err); return; }
        if ((f.documents?.length || 0) >= FAQ_DOCUMENT_MAX_COUNT) {
            toast.warning(`Maximum ${FAQ_DOCUMENT_MAX_COUNT} documents per FAQ.`);
            return;
        }
        setRow(idx, { uploadingDoc: true });
        try {
            const doc = await uploadFaqDocument(faqDocumentsEntity, listingId, f.id, { file });
            setRow(idx, { documents: [...(f.documents || []), doc] });
            toast.success('Document uploaded.');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to upload document.');
        } finally {
            setRow(idx, { uploadingDoc: false });
        }
    };

    const removeFaqRowDoc = async (idx: number, docId: number) => {
        const f = faqs[idx];
        if (!f.id || !faqDocumentsEntity) return;
        try {
            await deleteFaqDocument(faqDocumentsEntity, listingId, f.id, docId);
            setRow(idx, { documents: (f.documents || []).filter((d: FaqDocument) => d.id !== docId) });
        } catch (e: any) {
            toast.error(e?.message || 'Failed to delete document.');
        }
    };

    const pickFaqDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_DOC) { toast.warning('Document must be under 10 MB.'); e.target.value = ''; return; }
        setFaqFile(file);
    };

    const saveFaqDoc = async () => {
        if (!faqFile) return;
        setSavingFaqDoc(true);
        try {
            const res = await setListingFaqDoc(listingId, { document: faqFile });
            const d = res?.data ?? res;
            setFaqDocUrl(d?.document_url || faqDocUrl);
            setFaqFile(null);
            setHasFaqDoc(true);
            toast.success('FAQ document saved.');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to save FAQ document.');
        } finally {
            setSavingFaqDoc(false);
        }
    };

    const removeFaqDoc = async () => {
        try {
            await deleteListingFaqDoc(listingId);
            setFaqDocUrl(null);
            setFaqFile(null);
            setHasFaqDoc(false);
            toast.success('FAQ document removed.');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to remove FAQ document.');
        }
    };

    // ── Terms handlers ──
    const pickDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_DOC) { toast.warning('Document must be under 10 MB.'); e.target.value = ''; return; }
        setTermsFile(file);
    };

    const saveTerms = async () => {
        if (!termsContent.trim() && !termsFile && !termsDocUrl) {
            toast.warning('Add terms text or upload a document.');
            return;
        }
        setSavingTerms(true);
        try {
            const res = await setListingTerms(listingId, {
                content: termsContent.trim() || undefined,
                document: termsFile,
            });
            const d = res?.data ?? res;
            setTermsDocUrl(d?.document_url || termsDocUrl);
            setTermsFile(null);
            setHasTerms(true);
            toast.success('Terms & conditions saved.');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to save terms.');
        } finally {
            setSavingTerms(false);
        }
    };

    const removeTerms = async () => {
        try {
            await deleteListingTerms(listingId);
            setTermsContent('');
            setTermsDocUrl(null);
            setTermsFile(null);
            setHasTerms(false);
            toast.success('Terms removed.');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to remove terms.');
        }
    };

    const inputCls = `tlb-input w-full ${a.ring}`;

    return (
        <div className="space-y-8">
            {/* FAQs */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${a.soft}`}><HelpCircle size={16} /></div>
                        <div>
                            <h3 className="font-black text-gray-900 leading-none">FAQs</h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">Answer common questions customers ask.</p>
                        </div>
                    </div>
                </div>

                {loadingFaqs ? (
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold py-6"><Loader2 size={14} className="animate-spin" /> Loading FAQs…</div>
                ) : (
                    <div className="space-y-3">
                        {faqs.length === 0 && (
                            <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">No FAQs yet. Add your first one below.</p>
                        )}
                        {faqs.map((f, idx) => (
                            <div key={f.id ?? `new-${idx}`} className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">FAQ {idx + 1}</span>
                                    <button onClick={() => removeFaq(idx)} className="text-gray-400 hover:text-red-500 p-1" aria-label="Delete FAQ">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <input
                                    className={inputCls}
                                    placeholder="Question (e.g. Is parking available?)"
                                    value={f.question}
                                    onChange={e => setRow(idx, { question: e.target.value })}
                                />
                                <textarea
                                    className={`${inputCls} min-h-[72px] resize-y`}
                                    placeholder="Answer"
                                    value={f.answer}
                                    onChange={e => setRow(idx, { answer: e.target.value })}
                                />
                                {faqDocumentsEntity && (
                                    <div className="pt-2.5 border-t border-gray-200/70">
                                        {!f.id ? (
                                            <p className="text-[11px] text-gray-400">Save your FAQs below to attach documents to this one.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {(f.documents || []).length > 0 && (
                                                    <div className="space-y-1.5">
                                                        {(f.documents || []).map(doc => (
                                                            <div key={doc.id} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-gray-100">
                                                                <FileText size={13} className={`shrink-0 ${a.text}`} />
                                                                <div className="min-w-0 flex-1">
                                                                    {doc.url ? (
                                                                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-gray-700 hover:underline truncate block">
                                                                            {doc.title || doc.file_name}
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-xs font-bold text-gray-400 truncate block">{doc.title || doc.file_name} (file unavailable)</span>
                                                                    )}
                                                                    <span className="text-[10px] text-gray-400">{fmtBytes(doc.size_bytes)}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => removeFaqRowDoc(idx, doc.id)}
                                                                    className="text-gray-300 hover:text-red-500 p-0.5 shrink-0"
                                                                    aria-label={`Remove ${doc.title || doc.file_name}`}
                                                                >
                                                                    <X size={13} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {(f.documents?.length || 0) < FAQ_DOCUMENT_MAX_COUNT ? (
                                                    <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-700 cursor-pointer">
                                                        {f.uploadingDoc ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
                                                        {f.uploadingDoc ? 'Uploading…' : 'Attach document'}
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                                            className="hidden"
                                                            disabled={f.uploadingDoc}
                                                            onChange={e => pickFaqRowDoc(idx, e)}
                                                        />
                                                    </label>
                                                ) : (
                                                    <p className="text-[10px] text-gray-400">Maximum {FAQ_DOCUMENT_MAX_COUNT} documents reached.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={addFaq}
                            className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-3 text-sm font-bold text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Add FAQ
                        </button>

                        {faqs.length > 0 && faqDocumentsEntity && (
                            <>
                                {anyDocsAttached && !confirmBulkSave && (
                                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
                                        Saving replaces every FAQ, which removes the documents currently attached to
                                        them — even ones you didn't change. Re-attach after saving if needed.
                                    </p>
                                )}
                                {confirmBulkSave && (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
                                        <p className="text-xs font-bold text-red-700 flex-1">
                                            This will remove the documents attached to your FAQs. Continue?
                                        </p>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => setConfirmBulkSave(false)}
                                                className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-2"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => saveAllFaqs(true)}
                                                disabled={savingFaqs}
                                                className="inline-flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                                            >
                                                {savingFaqs ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                                Save anyway
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => saveAllFaqs()}
                                        disabled={savingFaqs}
                                        className={`inline-flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 ${a.btn}`}
                                    >
                                        {savingFaqs ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                        Save FAQs
                                    </button>
                                </div>
                            </>
                        )}
                        
                        {/* FAQ Document Upload */}
                        <div className="pt-4 border-t border-gray-100 mt-6">
                            <p className="text-sm font-bold text-gray-700 mb-2">Or upload an FAQ document</p>
                            {!faqDocLoaded ? (
                                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold py-2"><Loader2 size={14} className="animate-spin" /> Loading…</div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <label className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 cursor-pointer transition-colors">
                                            <Upload size={15} /> {faqFile ? 'Change document' : 'Attach FAQ document'}
                                            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={pickFaqDoc} />
                                        </label>
                                        {faqFile && (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600">
                                                {faqFile.name}
                                                <button onClick={() => setFaqFile(null)} className="text-gray-400 hover:text-red-500"><X size={13} /></button>
                                            </span>
                                        )}
                                        {!faqFile && faqDocUrl && (
                                            <a href={faqDocUrl} target="_blank" rel="noreferrer" className={`text-xs font-bold underline ${a.text}`}>
                                                View current document
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={saveFaqDoc}
                                            disabled={savingFaqDoc || !faqFile}
                                            className={`inline-flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 ${a.btn}`}
                                        >
                                            {savingFaqDoc ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Document
                                        </button>
                                        {hasFaqDoc && (
                                            <button onClick={removeFaqDoc} className="inline-flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-600 px-3 py-2.5">
                                                <Trash2 size={15} /> Remove
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400">PDF/DOC · Max 10 MB.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* Terms & Conditions */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${a.soft}`}><FileText size={16} /></div>
                    <div>
                        <h3 className="font-black text-gray-900 leading-none">Terms &amp; Conditions</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Refund, cancellation and booking policies.</p>
                    </div>
                </div>

                {!termsLoaded ? (
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold py-6"><Loader2 size={14} className="animate-spin" /> Loading…</div>
                ) : (
                    <div className="space-y-3">
                        <textarea
                            className={`${inputCls} min-h-[120px] resize-y`}
                            placeholder="Write your terms & conditions (Markdown supported)…"
                            value={termsContent}
                            onChange={e => setTermsContent(e.target.value)}
                        />

                        {/* Document upload */}
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 cursor-pointer transition-colors">
                                <Upload size={15} /> {termsFile ? 'Change document' : 'Attach document'}
                                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={pickDoc} />
                            </label>
                            {termsFile && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600">
                                    {termsFile.name}
                                    <button onClick={() => setTermsFile(null)} className="text-gray-400 hover:text-red-500"><X size={13} /></button>
                                </span>
                            )}
                            {!termsFile && termsDocUrl && (
                                <a href={termsDocUrl} target="_blank" rel="noreferrer" className={`text-xs font-bold underline ${a.text}`}>
                                    View current document
                                </a>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={saveTerms}
                                disabled={savingTerms}
                                className={`inline-flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 ${a.btn}`}
                            >
                                {savingTerms ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Terms
                            </button>
                            {hasTerms && (
                                <button onClick={removeTerms} className="inline-flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-600 px-3 py-2.5">
                                    <Trash2 size={15} /> Remove
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400">Provide text, a document, or both. PDF/DOC · Max 10 MB.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default FaqTermsEditor;

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, HelpCircle, FileText, Save, Check, X, Upload } from 'lucide-react';
import { getListingTerms, setListingTerms, deleteListingTerms } from '../../api/listings';
import { toast } from './Toast';

export interface FaqApi {
    list: (listingId: string) => Promise<any>;
    create: (listingId: string, data: { question: string; answer: string; sort_order?: number }) => Promise<any>;
    update: (listingId: string, faqId: number, data: { question: string; answer: string; sort_order?: number }) => Promise<any>;
    remove: (listingId: string, faqId: number) => Promise<any>;
}

interface FaqRow { id?: number; question: string; answer: string; saving?: boolean; }

interface Props {
    listingId: string;
    faqApi: FaqApi;
    /** Accent colour matching the wizard theme. */
    accent?: 'blue' | 'amber' | 'emerald' | 'purple';
}

const ACCENT: Record<NonNullable<Props['accent']>, { btn: string; soft: string; text: string; ring: string }> = {
    blue:    { btn: 'bg-blue-500 hover:bg-blue-600',       soft: 'bg-blue-50 text-blue-600',       text: 'text-blue-600',    ring: 'focus:border-blue-300' },
    amber:   { btn: 'bg-amber-500 hover:bg-amber-600',     soft: 'bg-amber-50 text-amber-600',     text: 'text-amber-600',   ring: 'focus:border-amber-300' },
    emerald: { btn: 'bg-emerald-500 hover:bg-emerald-600', soft: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-600', ring: 'focus:border-emerald-300' },
    purple:  { btn: 'bg-purple-500 hover:bg-purple-600',   soft: 'bg-purple-50 text-purple-600',   text: 'text-purple-600',  ring: 'focus:border-purple-300' },
};

const MAX_DOC = 10 * 1024 * 1024;

export const FaqTermsEditor: React.FC<Props> = ({ listingId, faqApi, accent = 'blue' }) => {
    const a = ACCENT[accent];

    const [faqs, setFaqs] = useState<FaqRow[]>([]);
    const [loadingFaqs, setLoadingFaqs] = useState(true);

    const [termsContent, setTermsContent] = useState('');
    const [termsDocUrl, setTermsDocUrl] = useState<string | null>(null);
    const [termsFile, setTermsFile] = useState<File | null>(null);
    const [termsLoaded, setTermsLoaded] = useState(false);
    const [savingTerms, setSavingTerms] = useState(false);
    const [hasTerms, setHasTerms] = useState(false);

    useEffect(() => {
        if (!listingId) { setLoadingFaqs(false); setTermsLoaded(true); return; }
        let alive = true;
        (async () => {
            try {
                const res = await faqApi.list(listingId);
                const data = res?.data ?? res;
                const arr = Array.isArray(data) ? data : (data?.results ?? []);
                if (alive) setFaqs(arr.map((f: any) => ({ id: f.id, question: f.question || '', answer: f.answer || '' })));
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
        return () => { alive = false; };
    }, [listingId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── FAQ handlers ──
    const setRow = (idx: number, patch: Partial<FaqRow>) =>
        setFaqs(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));

    const addFaq = () => setFaqs(prev => [...prev, { question: '', answer: '' }]);

    const saveFaq = async (idx: number) => {
        const f = faqs[idx];
        if (!f.question.trim() || !f.answer.trim()) { toast.warning('Both question and answer are required.'); return; }
        setRow(idx, { saving: true });
        try {
            const payload = { question: f.question.trim(), answer: f.answer.trim(), sort_order: idx };
            if (f.id) {
                await faqApi.update(listingId, f.id, payload);
            } else {
                const res = await faqApi.create(listingId, payload);
                const created = res?.data ?? res;
                if (created?.id) setRow(idx, { id: created.id });
            }
            toast.success('FAQ saved.');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to save FAQ.');
        } finally {
            setRow(idx, { saving: false });
        }
    };

    const removeFaq = async (idx: number) => {
        const f = faqs[idx];
        if (f.id) {
            try { await faqApi.remove(listingId, f.id); }
            catch (e: any) { toast.error(e?.message || 'Failed to delete FAQ.'); return; }
        }
        setFaqs(prev => prev.filter((_, i) => i !== idx));
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
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => saveFaq(idx)}
                                        disabled={f.saving}
                                        className={`inline-flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-50 ${a.btn}`}
                                    >
                                        {f.saving ? <Loader2 size={13} className="animate-spin" /> : f.id ? <Check size={13} /> : <Save size={13} />}
                                        {f.id ? 'Update' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={addFaq}
                            className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-3 text-sm font-bold text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Add FAQ
                        </button>
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

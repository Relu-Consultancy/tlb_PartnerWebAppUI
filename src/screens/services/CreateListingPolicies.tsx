import React, { useState } from 'react';
import { ArrowLeft, Eye, Plus, Trash2, HelpCircle, FileText } from 'lucide-react';
import { Screen } from '../../types';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface FAQ { id: number; question: string; answer: string; }

export const CreateListingPolicies: React.FC<Props> = ({ onNavigate }) => {
    const [faqs, setFaqs] = useState<FAQ[]>([{ id: 1, question: '', answer: '' }]);

    const addFaq = () => setFaqs(prev => [...prev, { id: Date.now(), question: '', answer: '' }]);
    const removeFaq = (id: number) => { if (faqs.length > 1) setFaqs(prev => prev.filter(f => f.id !== id)); };

    return (
    <div className="min-h-screen bg-gray-50 pb-8">
        <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={() => onNavigate('CREATE_LISTING_MEDIA')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
            <div className="text-center">
                <h1 className="font-black text-lg">New Listing</h1>
                <p className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Stage 4 of 5 — Entry Path & Policies</p>
            </div>
            <div className="w-10" />
        </header>

        <div className="w-full h-1.5 bg-gray-100">
            <div className="h-full bg-tlb-yellow w-[80%] transition-all duration-500" />
        </div>

        <main className="p-6">
            <div className="tlb-content space-y-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black">Entry Path & Policies</h2>
                    <p className="text-sm text-gray-400">Lower the barrier to entry and set clear rules for parents.</p>
                </div>

                {/* Policy Boxes */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <FileText size={12} /> Cancellation Policy
                        </label>
                        <textarea className="tlb-input w-full min-h-[100px] resize-y" placeholder="e.g. Cancellations must be made 24 hours in advance for a full refund..."></textarea>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <FileText size={12} /> Refund Policy
                        </label>
                        <textarea className="tlb-input w-full min-h-[100px] resize-y" placeholder="e.g. No refunds after the first class. Prorated refunds available for medical reasons..."></textarea>
                    </div>
                </div>

                {/* FAQs */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <HelpCircle size={12} /> Frequently Asked Questions
                    </label>
                    <div className="space-y-3">
                        {faqs.map((faq, idx) => (
                            <div key={faq.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest">FAQ {idx + 1}</p>
                                    {faqs.length > 1 && (
                                        <button onClick={() => removeFaq(faq.id)} className="text-red-400 hover:text-red-600 p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <input className="tlb-input w-full" placeholder="Question" />
                                <textarea className="tlb-input w-full min-h-[60px] resize-y" placeholder="Answer"></textarea>
                            </div>
                        ))}
                    </div>
                    <button onClick={addFaq} className="w-full mt-3 py-2.5 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-400 flex items-center justify-center gap-2 hover:border-tlb-yellow/30 hover:text-tlb-yellow transition-colors">
                        <Plus size={16} /> Add Question
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                    <button onClick={() => onNavigate('CREATE_LISTING_MEDIA')} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 text-sm">
                        ← Back
                    </button>
                    <button onClick={() => onNavigate('CREATE_LISTING_PREVIEW')} className="flex-1 tlb-button py-4 gap-2">
                        <Eye size={18} /> Preview & Finish
                    </button>
                </div>
            </div>
        </main>
    </div>
    );
};

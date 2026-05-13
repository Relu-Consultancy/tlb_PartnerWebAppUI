import React, { useState } from 'react';
import { Eye, Plus, Trash2, HelpCircle, FileText } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface FAQ { id: number; question: string; answer: string; }

export const CreateClassPolicies: React.FC<Props> = ({ onNavigate }) => {
    const [faqs, setFaqs] = useState<FAQ[]>([{ id: 1, question: '', answer: '' }]);

    const addFaq = () => setFaqs(prev => [...prev, { id: Date.now(), question: '', answer: '' }]);
    const removeFaq = (id: number) => { if (faqs.length > 1) setFaqs(prev => prev.filter(f => f.id !== id)); };

    return (
        <WizardLayout
            title="New Listing"
            stepText="Stage 4 of 5"
            subtitle="Entry Path & Policies"
            progressPercentage={80}
            themeColor="yellow"
            onBack={() => onNavigate('CREATE_CLASS_MEDIA')}
        >
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

            <WizardNavigation 
                onBack={() => onNavigate('CREATE_CLASS_MEDIA')}
                onNext={() => onNavigate('CREATE_CLASS_PREVIEW')}
                nextText="Preview & Finish"
                nextIcon={<Eye size={18} />}
                themeColor="yellow"
            />
    </WizardLayout>
    );
};

import React from 'react';
import {
    CheckCircle2,
    FileText,
    Upload,
    Building2,
    ArrowLeft,
    LayoutGrid,
    Instagram,
    Facebook,
    Globe,
    Video,
    Image as ImageIcon
} from 'lucide-react';
import { Screen } from '../../types';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

const Mail = ({ size, className }: { size: number, className?: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path><rect width="20" height="16" x="2" y="4" rx="2"></rect></svg>;

export const Registration: React.FC<OnboardingProps> = ({ onNavigate }) => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white p-6 flex items-center justify-between border-b border-gray-100">
            <button type="button" onClick={() => onNavigate('LANDING')}><ArrowLeft size={24} /></button>
            <h2 className="font-black text-lg">Partner Registration</h2>
            <div className="w-6"></div>
        </header>

        <div className="p-6 flex justify-between relative mb-4">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-tlb-yellow/20 -translate-y-1/2 z-0"></div>
            {[
                { n: 1, label: 'Details' },
                { n: 2, label: 'Digital' },
                { n: 3, label: 'Work' },
                { n: 4, label: 'Safety' }
            ].map((s) => (
                <div key={s.n} className="relative z-10 flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${s.n === 1 ? 'bg-tlb-yellow text-tlb-dark' : 'bg-white border-2 border-tlb-yellow/20 text-gray-300'}`}>
                        {s.n}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{s.label}</span>
                </div>
            ))}
        </div>

        <main className="flex-1 p-6 pb-24">
            <div className="tlb-content space-y-6">
                <section className="tlb-card space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><Building2 size={20} /></div>
                        <h3 className="font-black text-xl">Business Details</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Business / Brand Name</label>
                            <input className="tlb-input" defaultValue="The Grand Theater" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Contact Person Name</label>
                            <input className="tlb-input" defaultValue="Sarah Bernhardt" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Email ID</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input className="tlb-input pl-12" defaultValue="sarah@grandtheater.com" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">City</label>
                            <select className="tlb-input appearance-none">
                                <option>New York</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section className="tlb-card space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><Globe size={20} /></div>
                        <h3 className="font-black text-xl">Digital Presence</h3>
                    </div>
                    <br></br>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest -mt-4">* At least one field required</p>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <Instagram size={18} className="text-pink-500" />
                            <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Instagram URL" defaultValue="https://instagram.com/thegrandtheater" />
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <Facebook size={18} className="text-blue-600" />
                            <input className="bg-transparent flex-1 text-sm outline-none" placeholder="https://facebook.com/..." />
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <Globe size={18} className="text-tlb-dark" />
                            <input className="bg-transparent flex-1 text-sm outline-none" placeholder="https://www.yourbusiness.com" />
                        </div>
                    </div>
                </section>

                <section className="tlb-card space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><CheckCircle2 size={20} /></div>
                        <h3 className="font-black text-xl">Proof of Work</h3>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Experience</label>
                            <div className="flex gap-2">
                                <input className="tlb-input flex-1" placeholder="e.g. 5" />
                                <div className="flex bg-gray-100 rounded-xl p-1">
                                    <button className="px-4 py-2 bg-white rounded-lg text-xs font-bold shadow-sm">Years</button>
                                    <button className="px-4 py-2 text-xs font-bold text-gray-400">Months</button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Upload 3-5 Real Photos</label>
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 bg-gray-50/50">
                                <div className="bg-tlb-yellow/10 p-3 rounded-xl text-tlb-yellow"><ImageIcon size={24} /></div>
                                <p className="text-sm font-medium"><span className="text-tlb-yellow font-bold">Click to upload</span> or drag and drop</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">PNG, JPG up to 5MB each</p>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Upload Short Video</label>
                                <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-bold uppercase">Optional</span>
                            </div>
                            <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                                <div className="bg-gray-200 p-3 rounded-xl text-gray-500"><Video size={20} /></div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold">Select video file</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">MP4, MOV up to 50MB</p>
                                </div>
                                <button className="text-tlb-yellow font-bold text-sm">Browse</button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="tlb-card">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><FileText size={20} /></div>
                        <h3 className="font-black text-xl">Safety Confirmation</h3>
                    </div>
                    <label className="flex gap-4 items-start bg-tlb-yellow/5 border border-tlb-yellow/20 p-4 rounded-2xl cursor-pointer">
                        <input type="checkbox" className="mt-1 w-5 h-5 rounded border-tlb-yellow text-tlb-yellow focus:ring-tlb-yellow" />
                        <span className="text-sm font-medium leading-relaxed">I confirm that the information provided is genuine.</span>
                    </label>
                </section>

                <button onClick={() => onNavigate('APP_SUBMITTED')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
                    Submit Application <CheckCircle2 size={20} />
                </button>
            </div>
        </main>
    </div>
);

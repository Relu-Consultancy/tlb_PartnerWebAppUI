import React from 'react';
import { FileText, Upload, ArrowLeft } from 'lucide-react';
import { Screen } from '../../types';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

const X = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export const AgreementSubmit: React.FC<OnboardingProps> = ({ onNavigate }) => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
        <header className="w-full flex items-center justify-between mb-8">
            <button onClick={() => onNavigate('APP_APPROVED')} className="p-2"><ArrowLeft size={24} /></button>
            <h2 className="font-black text-lg">TLB Partner</h2>
            <div className="w-10"></div>
        </header>

        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-tlb-yellow/10 rounded-full flex items-center justify-center mb-6">
                    <FileText size={32} className="text-tlb-yellow" />
                </div>
                <h1 className="text-3xl font-black text-center">Agreement Submission</h1>
                <p className="text-center text-gray-400 mt-4 leading-relaxed">
                    Upload the signed agreement between TLB and the Partner to complete your verification process.
                </p>
            </div>

            <div className="border-2 border-dashed border-tlb-yellow/30 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 bg-tlb-yellow/5 mb-6">
                <div className="bg-tlb-yellow p-3 rounded-xl text-tlb-dark shadow-lg shadow-tlb-yellow/20">
                    <Upload size={24} />
                </div>
                <div className="text-center">
                    <p className="font-black text-lg">Upload Signed Agreement</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">PDF format only (Max 10MB)</p>
                </div>
                <button className="mt-2 px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm shadow-sm">Select File</button>
            </div>

            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center gap-4 mb-8">
                <div className="bg-red-50 p-3 rounded-xl text-red-500"><FileText size={24} /></div>
                <div className="flex-1">
                    <p className="text-sm font-bold truncate">partnership_agreement_2...</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">2.4 MB</p>
                </div>
                <button className="text-gray-300 hover:text-red-500"><X size={20} /></button>
            </div>

            <button onClick={() => onNavigate('BANK_SETUP')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
                Submit Document
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest italic animate-pulse">
                <div className="w-4 h-4 border-2 border-gray-200 border-t-tlb-yellow rounded-full animate-spin"></div>
                Verification in progress
            </div>
        </div>

        <p className="mt-12 text-center text-gray-400 font-medium">
            Need help? <button className="text-tlb-yellow font-bold underline">Contact TLB Support</button>
        </p>
    </div>
);

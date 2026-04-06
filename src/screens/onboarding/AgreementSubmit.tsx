import React, { useState } from 'react';
import { FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Screen } from '../../types';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

export const AgreementSubmit: React.FC<OnboardingProps> = ({ onNavigate }) => {
    const [accepted, setAccepted] = useState(false);

    return (
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
                    Please read and accept the partner agreement to complete your verification process.
                </p>
            </div>

            <div className="mb-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-2">
                    <CheckCircle2 size={12} /> Section C
                </div>
                <h3 className="font-bold text-gray-700 mb-2">The Little Broadway Partner Agreement</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 h-48 overflow-y-auto text-xs text-gray-500 leading-relaxed space-y-3 custom-scrollbar">
                    <p>
                        <strong>1. Terms of Partnership:</strong> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <p>
                        <strong>2. Roles and Responsibilities:</strong> Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                    <p>
                        <strong>3. Revenue Sharing:</strong> Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                    </p>
                    <p>
                        <strong>4. Confidentiality:</strong> Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.
                    </p>
                    <p>
                        <strong>5. Termination:</strong> Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.
                    </p>
                </div>
            </div>

            <label className="flex gap-4 items-start bg-tlb-yellow/5 border border-tlb-yellow/20 p-4 rounded-2xl cursor-pointer mb-8">
                <input 
                    type="checkbox" 
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-tlb-yellow text-tlb-yellow focus:ring-tlb-yellow" 
                />
                <span className="text-sm font-medium leading-relaxed">I have read and agree to The Little Broadway Partner Agreement</span>
            </label>

            <button 
                disabled={!accepted}
                onClick={() => {
                    sessionStorage.setItem('onboardingStep', '4');
                    onNavigate('HOME');
                }} 
                className={`tlb-button w-full py-4 shadow-lg ${accepted ? 'shadow-tlb-yellow/20' : 'opacity-50 cursor-not-allowed'}`}
            >
                Submit Profile for Approval
            </button>
        </div>

        <p className="mt-12 text-center text-gray-400 font-medium">
            Need help? <button className="text-tlb-yellow font-bold underline">Contact TLB Support</button>
        </p>
    </div>
    );
};

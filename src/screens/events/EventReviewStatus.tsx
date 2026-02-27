import React from 'react';
import { Clock } from 'lucide-react';
import { Screen } from '../../types';

interface EventProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

export const EventReviewStatus: React.FC<EventProps> = ({ onNavigate, onOpenSidebar }) => (
    <div className="min-h-screen bg-tlb-dark flex flex-col items-center justify-center p-8 text-center">
        <div className="w-32 h-32 bg-tlb-yellow/10 rounded-full flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 border-4 border-tlb-yellow/20 rounded-full border-t-tlb-yellow animate-spin"></div>
            <Clock size={48} className="text-tlb-yellow" />
        </div>
        <h2 className="text-3xl font-black text-white mb-4">Under Review</h2>
        <p className="text-gray-400 leading-relaxed mb-12">
            Our team is reviewing your event details. This usually takes 2-4 hours. You'll be notified once it's live!
        </p>
        <div className="w-full space-y-4 max-w-md">
            <button onClick={() => onNavigate('EVENT_LISTINGS')} className="tlb-button w-full py-4">Back to Listings</button>
            <button onClick={() => onNavigate('DASHBOARD')} className="w-full py-4 text-gray-400 font-black text-sm uppercase tracking-widest">Dashboard</button>
        </div>
    </div>
);

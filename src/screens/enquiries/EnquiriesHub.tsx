import React, { useState, useEffect } from 'react';
import { Menu, BookOpen, GraduationCap, MapPin } from 'lucide-react';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { motion, AnimatePresence } from 'motion/react';
import { Enquiries } from './Enquiries';
import { ProgramEnquiries } from './ProgramEnquiries';
import { VenueEnquiries } from './VenueEnquiries';

interface Props {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

type TabType = 'Classes' | 'Programs' | 'Venues';

export const EnquiriesHub: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const { allowedEntities } = usePartner();
    const [activeTab, setActiveTab] = useState<TabType | null>(null);

    const hasClasses = allowedEntities.includes('Classes');
    const hasPrograms = allowedEntities.includes('Programs');
    const hasVenues = allowedEntities.includes('Venues');

    // Default to the first available entity type
    useEffect(() => {
        if (!activeTab) {
            if (hasClasses) setActiveTab('Classes');
            else if (hasPrograms) setActiveTab('Programs');
            else if (hasVenues) setActiveTab('Venues');
        }
    }, [hasClasses, hasPrograms, hasVenues, activeTab]);

    const cards = [
        { id: 'Classes' as TabType, label: 'Classes', icon: BookOpen, desc: 'Manage class leads', visible: hasClasses, color: '#3B82F6', bg: '#EFF6FF' },
        { id: 'Programs' as TabType, label: 'Programs', icon: GraduationCap, desc: 'Manage program enrolments', visible: hasPrograms, color: '#8B5CF6', bg: '#F5F3FF' },
        { id: 'Venues' as TabType, label: 'Venues', icon: MapPin, desc: 'Manage venue bookings', visible: hasVenues, color: '#10B981', bg: '#ECFDF5' },
    ].filter(c => c.visible);

    if (cards.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <header className="bg-white/90 backdrop-blur-sm px-5 md:px-8 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
                    <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={24} /></button>
                    <div className="flex-1">
                        <h1 className="tlb-page-title">Enquiries</h1>
                    </div>
                </header>
                <main className="p-5 md:p-6 text-center pt-20">
                    <p className="text-gray-400 font-semibold">You don't have any categories enabled that support enquiries.</p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 flex flex-col">
            <header className="bg-white/90 backdrop-blur-sm px-5 md:px-8 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
                <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors">
                    <Menu size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="tlb-page-title">Enquiries Hub</h1>
                    <p className="tlb-page-sub">Manage leads across your categories</p>
                </div>
            </header>

            <main className="flex-1 flex flex-col">
                {/* Category Selection Cards */}
                {cards.length > 1 && (
                    <div className="px-5 md:px-6 pt-6 pb-2 max-w-6xl mx-auto w-full">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {cards.map(card => {
                                const isActive = activeTab === card.id;
                                return (
                                    <motion.button
                                        key={card.id}
                                        onClick={() => setActiveTab(card.id)}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex items-center gap-4 p-4 rounded-2xl text-left border transition-all ${
                                            isActive 
                                                ? 'bg-white border-tlb-yellow ring-2 ring-tlb-yellow/30 shadow-md' 
                                                : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                                        }`}
                                    >
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: card.bg, color: card.color }}>
                                            <card.icon size={24} />
                                        </div>
                                        <div className="hidden sm:block min-w-0">
                                            <p className={`font-black text-lg leading-tight truncate ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>{card.label}</p>
                                            <p className="text-xs text-gray-400 truncate mt-0.5">{card.desc}</p>
                                        </div>
                                        <div className="sm:hidden min-w-0 flex-1">
                                            <p className={`font-black leading-tight truncate ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>{card.label}</p>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Content Container (takes remainder of space, negative margin to pull up over gray background if needed, but the children have bg-gray-50 so it's fine) */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        {activeTab === 'Classes' && (
                            <motion.div key="classes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <Enquiries onNavigate={onNavigate} onOpenSidebar={onOpenSidebar} />
                            </motion.div>
                        )}
                        {activeTab === 'Programs' && (
                            <motion.div key="programs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <ProgramEnquiries onNavigate={onNavigate} onOpenSidebar={onOpenSidebar} />
                            </motion.div>
                        )}
                        {activeTab === 'Venues' && (
                            <motion.div key="venues" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <VenueEnquiries onNavigate={onNavigate} onOpenSidebar={onOpenSidebar} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

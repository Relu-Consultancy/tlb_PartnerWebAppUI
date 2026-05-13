import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CalendarDays, BarChart3, Users, MapPin, ChevronRight } from 'lucide-react';
import { EntityType, Screen } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    allowedEntities: EntityType[];
    onNavigate: (screen: Screen) => void;
}

const entityConfig: Record<EntityType, { icon: any; subtitle: string; color: string; bg: string; screen: Screen }> = {
    Events: {
        icon: CalendarDays,
        subtitle: 'Workshops, shows & experiences',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        screen: 'CREATE_EVENT_DETAILS',
    },
    Classes: {
        icon: BarChart3,
        subtitle: 'Recurring lessons & courses',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        screen: 'CREATE_CLASS_IDENTITY',
    },
    Programs: {
        icon: Users,
        subtitle: 'Long-term structured programs',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        screen: 'CREATE_PROGRAM_IDENTITY',
    },
    Venues: {
        icon: MapPin,
        subtitle: 'List your performance space',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        screen: 'CREATE_VENUE_DETAILS',
    },
};

export const EntityPickerSheet: React.FC<Props> = ({ isOpen, onClose, allowedEntities, onNavigate }) => {
    const handleSelect = (entity: EntityType) => {
        const config = entityConfig[entity];
        onClose();
        onNavigate(config.screen);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
                    />
                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-lg mx-auto"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 bg-gray-200 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-6 pb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black">Create New Listing</h3>
                                <p className="text-xs text-gray-400 mt-0.5">What would you like to list?</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Entity Options */}
                        <div className="px-6 pb-8 space-y-3">
                            {allowedEntities.map((entity) => {
                                const config = entityConfig[entity];
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={entity}
                                        onClick={() => handleSelect(entity)}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-tlb-yellow/40 hover:shadow-md transition-all group"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center`}>
                                            <Icon size={24} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-bold text-base">{entity}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{config.subtitle}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-tlb-yellow transition-colors" />
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

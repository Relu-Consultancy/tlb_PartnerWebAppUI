import React, { useState } from 'react';
import { ChevronRight, ArrowRight, CheckCircle2, BarChart3, Users, MapPin, ArrowLeft, CalendarDays } from 'lucide-react';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';

interface AuthProps {
    onNavigate: (screen: Screen) => void;
}

export const PartnerCategory: React.FC<AuthProps> = ({ onNavigate }) => {
    const { allowedEntities, setAllowedEntities } = usePartner();
    const [selectedCategories, setSelectedCategories] = useState<EntityType[]>(allowedEntities.length > 0 ? allowedEntities : []);

    const toggleCategory = (catName: EntityType) => {
        setSelectedCategories(prev =>
            prev.includes(catName)
                ? prev.filter(c => c !== catName)
                : [...prev, catName]
        );
    };

    const handleContinue = () => {
        if (selectedCategories.length > 0) {
            setAllowedEntities(selectedCategories);
            onNavigate('REGISTRATION');
        }
    };

    const categories: { name: EntityType; icon: any; desc: string }[] = [
        { name: 'Events', icon: CalendarDays, desc: 'Workshops, shows & experiences' },
        { name: 'Classes', icon: BarChart3, desc: 'Recurring lessons & courses' },
        { name: 'Programs', icon: Users, desc: 'Long-term structured programs' },
        { name: 'Venues', icon: MapPin, desc: 'List your performance space' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            <header className="w-full bg-white p-4 sm:p-6 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => onNavigate('PARTNER_ACCESS_OTP')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
                <h2 className="font-black text-lg">Business Type</h2>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 w-full max-w-lg px-4 sm:px-6 py-8 flex flex-col">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black mb-3">What do you offer?</h1>
                    <p className="text-gray-500 leading-relaxed text-sm px-4">
                        Select your business categories. You can change this later from your profile settings.
                    </p>
                </div>

                <div className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => toggleCategory(cat.name)}
                                className={`relative p-6 rounded-2xl border-2 flex flex-col items-center text-center gap-3 transition-all ${selectedCategories.includes(cat.name)
                                    ? 'border-tlb-yellow bg-tlb-yellow/5'
                                    : 'border-white bg-white shadow-sm hover:border-gray-200 hover:shadow-md'
                                    }`}
                            >
                                {selectedCategories.includes(cat.name) && (
                                    <div className="absolute top-3 right-3 w-6 h-6 bg-tlb-yellow rounded-full flex items-center justify-center shadow-sm">
                                        <CheckCircle2 size={16} className="text-tlb-dark" />
                                    </div>
                                )}
                                <div className={`p-4 rounded-2xl ${selectedCategories.includes(cat.name)
                                    ? 'bg-tlb-yellow text-tlb-dark shadow-inner'
                                    : 'bg-gray-50 text-gray-400'
                                    }`}>
                                    <cat.icon size={32} />
                                </div>
                                <div>
                                    <span className={`block text-lg font-black ${selectedCategories.includes(cat.name) ? 'text-tlb-dark' : 'text-gray-600'
                                        }`}>{cat.name}</span>
                                    <span className="text-xs text-gray-400 font-medium mt-1 block px-2 leading-tight">
                                        {cat.desc}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-8 pb-4">
                    <button
                        onClick={handleContinue}
                        disabled={selectedCategories.length === 0}
                        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${selectedCategories.length > 0
                            ? 'bg-tlb-yellow text-tlb-dark shadow-lg shadow-tlb-yellow/20 hover:brightness-105 active:scale-[0.98]'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Continue to Registration <ArrowRight size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
};

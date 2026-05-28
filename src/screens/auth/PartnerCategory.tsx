import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, BarChart3, Users, MapPin, ArrowLeft, CalendarDays } from 'lucide-react';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { selectCategories } from '../../api/onboarding';
import { ToastContainer, useToasts } from '../../components/ui';
import { clearTokens } from '../../api/client';

interface AuthProps {
    onNavigate: (screen: Screen) => void;
}

export const PartnerCategory: React.FC<AuthProps> = ({ onNavigate }) => {
    const { allowedEntities, setAllowedEntities } = usePartner();
    const [selectedCategories, setSelectedCategories] = useState<EntityType[]>(allowedEntities.length > 0 ? allowedEntities : []);
    const [loading, setLoading] = useState(false);
    const { toasts, showToast, dismissToast } = useToasts();

    const toggleCategory = (catName: EntityType) => {
        setSelectedCategories(prev =>
            prev.includes(catName)
                ? prev.filter(c => c !== catName)
                : [...prev, catName]
        );
    };

    const handleContinue = async () => {
        if (selectedCategories.length > 0) {
            setLoading(true);
            try {
                await selectCategories(selectedCategories);
                setAllowedEntities(selectedCategories);
                onNavigate('REGISTRATION');
            } catch (err) {
                console.error('Failed to select categories', err);
                const message = err instanceof Error ? err.message : '';
                // Backend returns "This action is not allowed in '<status>' status." when the
                // partner is already onboarded. Treat that as "already registered" — drop the
                // session so the user can switch to the Login flow cleanly.
                if (/not allowed in/i.test(message)) {
                    clearTokens();
                    sessionStorage.clear();
                    showToast(
                        'This email is already registered as a partner. Redirecting you to login…',
                        'warning'
                    );
                    setTimeout(() => onNavigate('LOGIN'), 1800);
                } else {
                    showToast(message || 'Failed to save categories. Please try again.', 'error');
                }
            } finally {
                setLoading(false);
            }
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
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
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
                        disabled={selectedCategories.length === 0 || loading}
                        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${(selectedCategories.length > 0 && !loading)
                            ? 'bg-tlb-yellow text-tlb-dark shadow-lg shadow-tlb-yellow/20 hover:brightness-105 active:scale-[0.98]'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {loading ? 'Saving...' : 'Continue to Registration'} <ArrowRight size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
};

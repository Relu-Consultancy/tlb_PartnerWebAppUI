import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Screen, VenuePackage } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';

interface Props { onNavigate: (screen: Screen) => void; }

export const CreateVenuePackages: React.FC<Props> = ({ onNavigate }) => {
    const [packages, setPackages] = useState<VenuePackage[]>([
        { id: '1', name: 'Basic Party', price: 15000, description: 'Venue access, standard decoration, basic sound system.' },
        { id: '2', name: 'Standard (Special Treat)', price: 20000, description: 'Basic + theme decoration, host, and return gifts.' },
    ]);

    const addPackage = () => {
        setPackages([...packages, { id: Date.now().toString(), name: '', price: 0, description: '' }]);
    };

    const removePackage = (id: string) => {
        setPackages(packages.filter(p => p.id !== id));
    };

    const updatePackage = (id: string, field: keyof VenuePackage, value: any) => {
        setPackages(packages.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    return (
        <WizardLayout
            title="Packages & Pricing"
            stepText="Step 4 of 5"
            subtitle="Packages"
            progressPercentage={80}
            themeColor="amber"
            onBack={() => onNavigate('CREATE_VENUE_AVAILABILITY')}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Build Your Packages</h2>
                <p className="text-sm text-gray-400">Offer different tiers for customers to choose from.</p>
            </div>

            {/* Packages List */}
            <div className="space-y-6">
                {packages.map((pkg, index) => (
                    <div key={pkg.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative group">
                        {packages.length > 1 && (
                            <button 
                                onClick={() => removePackage(pkg.id)}
                                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 font-black text-xs flex items-center justify-center">
                                {index + 1}
                            </div>
                            <h3 className="font-bold text-gray-700">Package Details</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Package Name</label>
                                <input
                                    className="tlb-input w-full bg-gray-50 border-transparent focus:bg-white"
                                    placeholder="e.g. Premium Party"
                                    value={pkg.name}
                                    onChange={(e) => updatePackage(pkg.id, 'name', e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Price (₹)</label>
                                <input
                                    type="number"
                                    className="tlb-input w-full bg-gray-50 border-transparent focus:bg-white font-black text-lg text-amber-600"
                                    placeholder="0"
                                    value={pkg.price || ''}
                                    onChange={(e) => updatePackage(pkg.id, 'price', Number(e.target.value))}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">What's Included?</label>
                                <textarea
                                    className="tlb-input w-full min-h-[80px] resize-y bg-gray-50 border-transparent focus:bg-white text-sm"
                                    placeholder="List the features, decorations, food, etc."
                                    value={pkg.description}
                                    onChange={(e) => updatePackage(pkg.id, 'description', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Package Button */}
            <button 
                onClick={addPackage}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
            >
                <Plus size={18} /> Add Another Package
            </button>

            <WizardNavigation 
                onBack={() => onNavigate('CREATE_VENUE_AVAILABILITY')}
                onNext={() => onNavigate('CREATE_VENUE_PREVIEW')}
                nextText="Review & Publish"
                nextIcon={<CheckCircle2 size={20} />}
                themeColor="amber"
            />
        </WizardLayout>
    );
};

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Plus, Trash2, Loader2, Star } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation, toast } from '../../components/ui';
import {
    getVenuePackages,
    createVenuePackage,
    updateVenuePackage,
    deleteVenuePackage,
    getCurrentVenueDraftId,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar?: () => void; }

interface PkgForm {
    localKey: string;
    apiId?: number;
    name: string;
    price: string;
    description: string;
    duration_minutes: string;
    max_guests: string;
    dirty: boolean;
    saving: boolean;
}

const newPkgForm = (): PkgForm => ({
    localKey: `new_${Date.now()}_${Math.random()}`,
    name: '',
    price: '',
    description: '',
    duration_minutes: '',
    max_guests: '',
    dirty: true,
    saving: false,
});

export const CreateVenuePackages: React.FC<Props> = ({ onNavigate }) => {
    const [draftId, setDraftId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [packages, setPackages] = useState<PkgForm[]>([]);
    const [proceeding, setProceeding] = useState(false);

    useEffect(() => {
        const id = getCurrentVenueDraftId();
        if (!id) { setLoadError('No active draft. Start from "Venue Details".'); setLoading(false); return; }
        setDraftId(id);

        const load = async () => {
            try {
                const res = await getVenuePackages(id);
                const data: any[] = res.data || res || [];
                setPackages(data.map(p => ({
                    localKey: String(p.id),
                    apiId: p.id,
                    name: p.name || '',
                    price: p.price != null ? String(p.price) : '',
                    description: p.description || '',
                    duration_minutes: p.duration_minutes != null ? String(p.duration_minutes) : '',
                    max_guests: p.max_guests != null ? String(p.max_guests) : '',
                    dirty: false,
                    saving: false,
                })));
            } catch (err: any) {
                setLoadError(err?.message || 'Failed to load packages.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const updateField = (localKey: string, field: keyof PkgForm, value: any) => {
        setPackages(prev => prev.map(p => p.localKey === localKey ? { ...p, [field]: value, dirty: true } : p));
    };

    const handleDelete = async (pkg: PkgForm) => {
        if (!draftId) return;
        if (pkg.apiId) {
            updateField(pkg.localKey, 'saving', true);
            try {
                await deleteVenuePackage(draftId, pkg.apiId);
            } catch (err: any) {
                toast.error(err?.message || 'Failed to delete package.');
                updateField(pkg.localKey, 'saving', false);
                return;
            }
        }
        setPackages(prev => prev.filter(p => p.localKey !== pkg.localKey));
    };

    const handleNext = async () => {
        if (!draftId) return;
        setProceeding(true);
        try {
            for (const pkg of packages) {
                if (!pkg.dirty) continue;
                if (!pkg.name.trim()) { toast.warning('Package name is required for all packages.'); setProceeding(false); return; }
                const payload: Record<string, any> = {
                    name: pkg.name.trim(),
                    price: pkg.price ? Number(pkg.price) : 0,
                    description: pkg.description.trim(),
                };
                const durMins = Number(pkg.duration_minutes);
                const maxG = Number(pkg.max_guests);
                if (pkg.duration_minutes && durMins >= 1) payload.duration_minutes = durMins;
                if (pkg.max_guests && maxG >= 1) payload.max_guests = maxG;
                if (pkg.apiId) {
                    await updateVenuePackage(draftId, pkg.apiId, payload);
                } else {
                    await createVenuePackage(draftId, payload);
                }
            }
            onNavigate('CREATE_VENUE_AMENITIES');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to save packages.');
        } finally {
            setProceeding(false);
        }
    };

    if (loading) {
        return (
            <WizardLayout title="Packages & Pricing" stepText="Step 4 of 7" subtitle="Packages" progressPercentage={57} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_AVAILABILITY')}>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading packages…
                </div>
            </WizardLayout>
        );
    }

    if (loadError) {
        return (
            <WizardLayout title="Packages & Pricing" stepText="Step 4 of 7" subtitle="Packages" progressPercentage={57} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_AVAILABILITY')}>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">{loadError}</div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout title="Packages & Pricing" stepText="Step 4 of 7" subtitle="Packages" progressPercentage={57} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_AVAILABILITY')}>
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Build Your Packages</h2>
                <p className="text-sm text-gray-400">Offer different tiers for customers to choose from.</p>
            </div>

            {packages.length === 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-8 text-center">
                    <Star size={32} className="text-amber-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-amber-700">No packages yet</p>
                    <p className="text-xs text-amber-500 mt-1">Add at least one package for customers to book.</p>
                </div>
            )}

            <div className="space-y-6">
                {packages.map((pkg, index) => (
                    <div key={pkg.localKey} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative">
                        {packages.length > 0 && (
                            <button
                                onClick={() => handleDelete(pkg)}
                                disabled={pkg.saving}
                                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                                aria-label="Remove package"
                            >
                                {pkg.saving ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
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
                                    onChange={e => updateField(pkg.localKey, 'name', e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Price (₹)</label>
                                    <input
                                        type="number"
                                        className="tlb-input w-full bg-gray-50 border-transparent focus:bg-white font-black text-lg text-amber-600"
                                        placeholder="0"
                                        value={pkg.price}
                                        onChange={e => updateField(pkg.localKey, 'price', e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Duration (min)</label>
                                    <input
                                        type="number"
                                        className="tlb-input w-full bg-gray-50 border-transparent focus:bg-white"
                                        placeholder="e.g. 180"
                                        value={pkg.duration_minutes}
                                        onChange={e => updateField(pkg.localKey, 'duration_minutes', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Max Guests</label>
                                <input
                                    type="number"
                                    className="tlb-input w-full bg-gray-50 border-transparent focus:bg-white"
                                    placeholder="e.g. 50"
                                    value={pkg.max_guests}
                                    onChange={e => updateField(pkg.localKey, 'max_guests', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">What's Included?</label>
                                <textarea
                                    className="tlb-input w-full min-h-[80px] resize-y bg-gray-50 border-transparent focus:bg-white text-sm"
                                    placeholder="List the features, decorations, food, etc."
                                    value={pkg.description}
                                    onChange={e => updateField(pkg.localKey, 'description', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={() => setPackages(prev => [...prev, newPkgForm()])}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
            >
                <Plus size={18} /> Add Another Package
            </button>

            <WizardNavigation
                onBack={() => onNavigate('CREATE_VENUE_AVAILABILITY')}
                onNext={handleNext}
                nextText={proceeding ? 'Saving…' : 'Next: Amenities'}
                nextIcon={proceeding ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                themeColor="amber"
            />
        </WizardLayout>
    );
};

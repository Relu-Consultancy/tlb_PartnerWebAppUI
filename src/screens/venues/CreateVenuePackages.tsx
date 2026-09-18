import React, { useState, useEffect } from 'react';
import { CheckCircle2, Plus, Trash2, Loader2, Star } from 'lucide-react';
import { Screen } from '../../types';
import { toast } from '../../components/ui';
import { WizardShell, WizardNav, WizardField } from '../../components/portal/wizard';
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
            <WizardShell title="New venue" entityType="Venues" step={4} totalSteps={7} stepLabel="Packages" onBack={() => onNavigate('CREATE_VENUE_AVAILABILITY')}>
                <div className="pt-card p-5 sm:p-6 flex items-center justify-center gap-2 text-tlb-muted text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading packages…
                </div>
            </WizardShell>
        );
    }

    if (loadError) {
        return (
            <WizardShell title="New venue" entityType="Venues" step={4} totalSteps={7} stepLabel="Packages" onBack={() => onNavigate('CREATE_VENUE_AVAILABILITY')}>
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{loadError}</div>
            </WizardShell>
        );
    }

    return (
        <WizardShell title="New venue" entityType="Venues" step={4} totalSteps={7} stepLabel="Packages" onBack={() => onNavigate('CREATE_VENUE_AVAILABILITY')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                <div>
                    <h2 className="pt-h-sec">Build your packages</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Offer different tiers for customers to choose from.</p>
                </div>

                {packages.length === 0 && (
                    <div className="pt-note bg-tlb-amber-soft text-tlb-gold flex-col items-center text-center gap-2 py-8">
                        <Star size={32} />
                        <p className="text-sm font-bold">No packages yet</p>
                        <p className="text-xs">Add at least one package for customers to book.</p>
                    </div>
                )}

                <div className="flex flex-col gap-5">
                    {packages.map((pkg, index) => (
                        <div key={pkg.localKey} className="pt-card p-5 relative flex flex-col gap-4">
                            {packages.length > 0 && (
                                <button
                                    onClick={() => handleDelete(pkg)}
                                    disabled={pkg.saving}
                                    className="absolute top-4 right-4 p-2 text-tlb-faint hover:text-tlb-red-deep hover:bg-tlb-red-soft rounded-full transition-colors disabled:opacity-50"
                                    aria-label="Remove package"
                                >
                                    {pkg.saving ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                </button>
                            )}

                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-tlb-amber-soft text-tlb-gold font-black text-xs flex items-center justify-center">
                                    {index + 1}
                                </div>
                                <h3 className="pt-h-sec">Package details</h3>
                            </div>

                            <WizardField label="Package name">
                                <input
                                    className="pt-input"
                                    placeholder="e.g. Premium Party"
                                    value={pkg.name}
                                    onChange={e => updateField(pkg.localKey, 'name', e.target.value)}
                                />
                            </WizardField>

                            <div className="grid grid-cols-2 gap-3">
                                <WizardField label="Price (₹)">
                                    <input
                                        type="number"
                                        className="pt-input font-black text-lg text-tlb-gold"
                                        placeholder="0"
                                        value={pkg.price}
                                        onChange={e => updateField(pkg.localKey, 'price', e.target.value)}
                                    />
                                </WizardField>
                                <WizardField label="Duration (min)">
                                    <input
                                        type="number"
                                        className="pt-input"
                                        placeholder="e.g. 180"
                                        value={pkg.duration_minutes}
                                        onChange={e => updateField(pkg.localKey, 'duration_minutes', e.target.value)}
                                    />
                                </WizardField>
                            </div>

                            <WizardField label="Max guests">
                                <input
                                    type="number"
                                    className="pt-input"
                                    placeholder="e.g. 50"
                                    value={pkg.max_guests}
                                    onChange={e => updateField(pkg.localKey, 'max_guests', e.target.value)}
                                />
                            </WizardField>

                            <WizardField label="What's included?">
                                <textarea
                                    className="pt-input min-h-[80px]"
                                    placeholder="List the features, decorations, food, etc."
                                    value={pkg.description}
                                    onChange={e => updateField(pkg.localKey, 'description', e.target.value)}
                                />
                            </WizardField>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => setPackages(prev => [...prev, newPkgForm()])}
                    className="pt-btn pt-btn-o w-full justify-center border-dashed py-3.5"
                >
                    <Plus size={18} /> Add another package
                </button>

                <WizardNav
                    onBack={() => onNavigate('CREATE_VENUE_AVAILABILITY')}
                    onNext={handleNext}
                    nextText={proceeding ? 'Saving…' : 'Next: Amenities'}
                    nextIcon={proceeding ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};

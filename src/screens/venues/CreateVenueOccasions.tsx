import React, { useState, useEffect } from 'react';
import { ArrowRight, Users, CheckSquare, Square, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';
import {
    getVenueMetaOccasions,
    getVenueListingDetail,
    getVenueAttendeeFields,
    updateVenueListing,
    updateVenueAttendeeFields,
    getCurrentVenueDraftId,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar?: () => void; }

const ATTENDEE_FIELD_OPTIONS = [
    { key: 'child_name', label: 'Child Name' },
    { key: 'child_age', label: 'Child Age' },
    { key: 'parent_name', label: 'Parent Name' },
    { key: 'contact_number', label: 'Contact Number' },
    { key: 'email_id', label: 'Email ID' },
];

export const CreateVenueOccasions: React.FC<Props> = ({ onNavigate }) => {
    const [draftId, setDraftId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [occasions, setOccasions] = useState<string[]>([]);
    const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
    const [minGuests, setMinGuests] = useState('');
    const [maxGuests, setMaxGuests] = useState('');
    const [requiredFields, setRequiredFields] = useState<string[]>([]);

    useEffect(() => {
        const id = getCurrentVenueDraftId();
        if (!id) { setLoadError('No active draft. Start from "Venue Details".'); setLoading(false); return; }
        setDraftId(id);

        const load = async () => {
            try {
                const [occRes, detailRes, fieldsRes] = await Promise.allSettled([
                    getVenueMetaOccasions(),
                    getVenueListingDetail(id),
                    getVenueAttendeeFields(id),
                ]);

                if (occRes.status === 'fulfilled') {
                    const raw = occRes.value.data || occRes.value || [];
                    setOccasions(raw.map((o: any) => typeof o === 'string' ? o : (o.name || o.label)));
                }

                if (detailRes.status === 'fulfilled') {
                    const d = detailRes.value.data || detailRes.value;
                    if (Array.isArray(d.occasions) && d.occasions.length) {
                        setSelectedOccasions(d.occasions.map((o: any) => typeof o === 'string' ? o : (o.name || o.label)));
                    }
                    if (d.min_guests != null) setMinGuests(String(d.min_guests));
                    if (d.max_guests != null) setMaxGuests(String(d.max_guests));
                }

                if (fieldsRes.status === 'fulfilled') {
                    const raw = fieldsRes.value.data ?? fieldsRes.value ?? {};
                    const fields: any[] = Array.isArray(raw) ? raw : (raw.fields ?? []);
                    setRequiredFields(fields.map((f: any) => typeof f === 'string' ? f : f.key));
                }
            } catch (err: any) {
                setLoadError(err?.message || 'Failed to load data.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const toggleOccasion = (name: string) => {
        setSelectedOccasions(prev => prev.includes(name) ? prev.filter(o => o !== name) : [...prev, name]);
    };

    const toggleField = (key: string) => {
        setRequiredFields(prev => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]);
    };

    const handleNext = async () => {
        if (!draftId) return;
        if (selectedOccasions.length === 0) { alert('Please select at least one occasion.'); return; }
        setSaving(true);
        try {
            await updateVenueListing(draftId, {
                occasions: selectedOccasions,
                ...(minGuests && { min_guests: Number(minGuests) }),
                ...(maxGuests && { max_guests: Number(maxGuests) }),
            });
            await updateVenueAttendeeFields(draftId, requiredFields);
            onNavigate('CREATE_VENUE_AVAILABILITY');
        } catch (err: any) {
            alert(err?.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <WizardLayout title="Configuration" stepText="Step 2 of 5" subtitle="Occasions & Capacity" progressPercentage={40} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_DETAILS')}>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                </div>
            </WizardLayout>
        );
    }

    if (loadError) {
        return (
            <WizardLayout title="Configuration" stepText="Step 2 of 5" subtitle="Occasions & Capacity" progressPercentage={40} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_DETAILS')}>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">{loadError}</div>
            </WizardLayout>
        );
    }

    return (
        <WizardLayout title="Configuration" stepText="Step 2 of 5" subtitle="Occasions & Capacity" progressPercentage={40} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_DETAILS')}>
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Occasions & Capacity</h2>
                <p className="text-sm text-gray-400">What types of events do you host?</p>
            </div>

            {/* Supported Occasions */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Supported Occasions</label>
                {occasions.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {occasions.map(name => (
                            <button key={name} onClick={() => toggleOccasion(name)}
                                className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                                    selectedOccasions.includes(name)
                                        ? 'border-amber-400 bg-amber-50'
                                        : 'border-gray-100 bg-white hover:border-amber-200'
                                }`}>
                                <div className={selectedOccasions.includes(name) ? 'text-amber-500' : 'text-gray-300'}>
                                    {selectedOccasions.includes(name) ? <CheckSquare size={20} /> : <Square size={20} />}
                                </div>
                                <span className={`text-sm font-bold ${selectedOccasions.includes(name) ? 'text-amber-900' : 'text-gray-600'}`}>{name}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 italic">No occasions loaded from API.</p>
                )}
            </div>

            {/* Capacity */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Guest Capacity</label>
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-gray-400 uppercase">Min</label>
                        <div className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20">
                            <div className="pl-4 text-gray-400"><Users size={16} /></div>
                            <input type="number" className="w-full p-4 pl-2 outline-none text-sm font-bold text-gray-700" placeholder="e.g. 10" value={minGuests} onChange={e => setMinGuests(e.target.value)} />
                        </div>
                    </div>
                    <span className="text-gray-400 font-bold">-</span>
                    <div className="flex-1 relative">
                        <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-gray-400 uppercase">Max</label>
                        <div className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20">
                            <div className="pl-4 text-gray-400"><Users size={16} /></div>
                            <input type="number" className="w-full p-4 pl-2 outline-none text-sm font-bold text-gray-700" placeholder="e.g. 50" value={maxGuests} onChange={e => setMaxGuests(e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Required Attendee Info */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Require from user at Checkout</label>
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    {ATTENDEE_FIELD_OPTIONS.map((field, idx) => (
                        <button key={field.key} onClick={() => toggleField(field.key)}
                            className={`w-full flex items-center justify-between p-4 transition-colors ${idx !== ATTENDEE_FIELD_OPTIONS.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50`}>
                            <span className="text-sm font-semibold text-gray-700">{field.label}</span>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${requiredFields.includes(field.key) ? 'bg-amber-400' : 'bg-gray-200'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${requiredFields.includes(field.key) ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <WizardNavigation
                onBack={() => onNavigate('CREATE_VENUE_DETAILS')}
                onNext={handleNext}
                nextText={saving ? 'Saving…' : 'Next: Availability'}
                nextIcon={saving ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                themeColor="amber"
            />
        </WizardLayout>
    );
};

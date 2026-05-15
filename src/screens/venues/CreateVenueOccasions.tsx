import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';
import {
    getVenueMetaOccasions,
    getVenueMetaDiscoveryEnums,
    getVenueListingDetail,
    getVenueAttendeeFields,
    updateVenueListing,
    updateVenueDiscovery,
    updateVenueAttendeeFields,
    getCurrentVenueDraftId,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar?: () => void; }

interface OccasionItem { id: number; name: string; slug: string }
interface DiscoveryOption { value: string; label: string }

const ATTENDEE_FIELD_OPTIONS: { key: string; label: string }[] = [
    { key: 'child_name',           label: 'Child Name' },
    { key: 'child_age',            label: 'Child Age' },
    { key: 'contact_number',       label: 'Contact Number' },
    { key: 'email',                label: 'Email' },
    { key: 'guest_count',          label: 'Guest Count' },
    { key: 'special_requirements', label: 'Special Requirements' },
];

export const CreateVenueOccasions: React.FC<Props> = ({ onNavigate }) => {
    const [draftId, setDraftId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Occasions (using IDs)
    const [occasions, setOccasions] = useState<OccasionItem[]>([]);
    const [selectedOccasionIds, setSelectedOccasionIds] = useState<number[]>([]);

    // Discovery enums
    const [outingTypeOptions, setOutingTypeOptions] = useState<DiscoveryOption[]>([]);
    const [activityTypeOptions, setActivityTypeOptions] = useState<DiscoveryOption[]>([]);
    const [formatTypeOptions, setFormatTypeOptions] = useState<DiscoveryOption[]>([]);
    const [selectedOutingTypes, setSelectedOutingTypes] = useState<string[]>([]);
    const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);
    const [selectedFormatTypes, setSelectedFormatTypes] = useState<string[]>([]);

    // Attendee fields
    const [requiredFields, setRequiredFields] = useState<string[]>([]);

    useEffect(() => {
        const id = getCurrentVenueDraftId();
        if (!id) { setLoadError('No active draft. Start from "Venue Details".'); setLoading(false); return; }
        setDraftId(id);

        const load = async () => {
            try {
                const [occRes, discoveryRes, detailRes, fieldsRes] = await Promise.allSettled([
                    getVenueMetaOccasions(),
                    getVenueMetaDiscoveryEnums(),
                    getVenueListingDetail(id),
                    getVenueAttendeeFields(id),
                ]);

                if (occRes.status === 'fulfilled') {
                    const raw: OccasionItem[] = occRes.value.data || occRes.value || [];
                    setOccasions(raw);
                }

                if (discoveryRes.status === 'fulfilled') {
                    const d = discoveryRes.value.data || discoveryRes.value || {};
                    setOutingTypeOptions(d.outing_types || []);
                    setActivityTypeOptions(d.activity_types || []);
                    setFormatTypeOptions(d.format_types || []);
                }

                if (detailRes.status === 'fulfilled') {
                    const d = detailRes.value.data || detailRes.value;
                    // occasions are returned as [{id, name, slug}]
                    if (Array.isArray(d.occasions)) {
                        setSelectedOccasionIds(d.occasions.map((o: any) => o.id).filter(Boolean));
                    }
                    // discovery is returned as { outing_types: [], activity_types: [], format_types: [] }
                    if (d.discovery) {
                        setSelectedOutingTypes(d.discovery.outing_types || []);
                        setSelectedActivityTypes(d.discovery.activity_types || []);
                        setSelectedFormatTypes(d.discovery.format_types || []);
                    }
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

    const toggleOccasion = (id: number) => {
        setSelectedOccasionIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleOutingType = (v: string) =>
        setSelectedOutingTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
    const toggleActivityType = (v: string) =>
        setSelectedActivityTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
    const toggleFormatType = (v: string) =>
        setSelectedFormatTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

    const toggleField = (key: string) => {
        setRequiredFields(prev => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]);
    };

    const handleNext = async () => {
        if (!draftId) return;
        setSaving(true);
        try {
            // PATCH venue with occasion_ids (atomic replace)
            await updateVenueListing(draftId, {
                occasion_ids: selectedOccasionIds,
            });
            // PUT discovery (atomic replace)
            await updateVenueDiscovery(draftId, {
                outing_types: selectedOutingTypes,
                activity_types: selectedActivityTypes,
                format_types: selectedFormatTypes,
            });
            // PUT attendee fields (atomic replace)
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
            <WizardLayout title="Occasions & Discovery" stepText="Step 2 of 5" subtitle="Configuration" progressPercentage={40} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_DETAILS')}>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                </div>
            </WizardLayout>
        );
    }

    if (loadError) {
        return (
            <WizardLayout title="Occasions & Discovery" stepText="Step 2 of 5" subtitle="Configuration" progressPercentage={40} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_DETAILS')}>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-600">{loadError}</div>
            </WizardLayout>
        );
    }

    const ChipGroup = ({
        options,
        selected,
        toggle,
    }: {
        options: DiscoveryOption[];
        selected: string[];
        toggle: (v: string) => void;
    }) => (
        <div className="flex flex-wrap gap-2">
            {options.map(o => (
                <button
                    key={o.value}
                    onClick={() => toggle(o.value)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${selected.includes(o.value)
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-500 hover:border-amber-300'
                    }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );

    return (
        <WizardLayout title="Occasions & Discovery" stepText="Step 2 of 5" subtitle="Configuration" progressPercentage={40} themeColor="amber" onBack={() => onNavigate('CREATE_VENUE_DETAILS')}>
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Occasions & Discovery</h2>
                <p className="text-sm text-gray-400">Help customers find the right fit.</p>
            </div>

            {/* Occasions */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Supported Occasions <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                {occasions.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {occasions.map(occ => (
                            <button key={occ.id} onClick={() => toggleOccasion(occ.id)}
                                className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                                    selectedOccasionIds.includes(occ.id)
                                        ? 'border-amber-400 bg-amber-50'
                                        : 'border-gray-100 bg-white hover:border-amber-200'
                                }`}>
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    selectedOccasionIds.includes(occ.id)
                                        ? 'bg-amber-500 border-amber-500'
                                        : 'border-gray-300'
                                }`}>
                                    {selectedOccasionIds.includes(occ.id) && (
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-sm font-bold ${selectedOccasionIds.includes(occ.id) ? 'text-amber-900' : 'text-gray-600'}`}>{occ.name}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 italic">No occasions available.</p>
                )}
            </div>

            {/* Discovery — Outing Types */}
            {outingTypeOptions.length > 0 && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Outing Type <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                    <ChipGroup options={outingTypeOptions} selected={selectedOutingTypes} toggle={toggleOutingType} />
                </div>
            )}

            {/* Discovery — Activity Types */}
            {activityTypeOptions.length > 0 && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Activity Type <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                    <ChipGroup options={activityTypeOptions} selected={selectedActivityTypes} toggle={toggleActivityType} />
                </div>
            )}

            {/* Discovery — Format Types */}
            {formatTypeOptions.length > 0 && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Format <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                    <ChipGroup options={formatTypeOptions} selected={selectedFormatTypes} toggle={toggleFormatType} />
                </div>
            )}

            {/* Required Attendee Info */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Require at Checkout <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
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
                onNext={saving ? () => {} : handleNext}
                nextText={saving ? 'Saving…' : 'Next: Availability'}
                nextIcon={saving ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                themeColor="amber"
            />
        </WizardLayout>
    );
};

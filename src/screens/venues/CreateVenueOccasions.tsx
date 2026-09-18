import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { toast } from '../../components/ui';
import { WizardShell, WizardNav, WizardField, OptionTileGrid } from '../../components/portal/wizard';
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
    { key: 'child_name',           label: 'Contact person name' },
    { key: 'child_age',            label: 'Age' },
    { key: 'contact_number',       label: 'Contact number' },
    { key: 'email',                label: 'Email' },
    { key: 'guest_count',          label: 'Guest count' },
    { key: 'special_requirements', label: 'Special requirements' },
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
            toast.error(err?.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <WizardShell title="New venue" entityType="Venues" step={2} totalSteps={7} stepLabel="Occasions" onBack={() => onNavigate('CREATE_VENUE_DETAILS')}>
                <div className="pt-card p-5 sm:p-6 flex items-center justify-center gap-2 text-tlb-muted text-xs font-bold py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                </div>
            </WizardShell>
        );
    }

    if (loadError) {
        return (
            <WizardShell title="New venue" entityType="Venues" step={2} totalSteps={7} stepLabel="Occasions" onBack={() => onNavigate('CREATE_VENUE_DETAILS')}>
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{loadError}</div>
            </WizardShell>
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
                    type="button"
                    onClick={() => toggle(o.value)}
                    className={`pt-scope ${selected.includes(o.value) ? 'is-active' : ''}`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );

    return (
        <WizardShell title="New venue" entityType="Venues" step={2} totalSteps={7} stepLabel="Occasions" onBack={() => onNavigate('CREATE_VENUE_DETAILS')}>
            <div className="pt-card p-5 sm:p-6 flex flex-col gap-5">
                <div>
                    <h2 className="pt-h-sec">Occasions &amp; discovery</h2>
                    <p className="text-[13px] text-tlb-sub mt-0.5">Help customers find the right fit.</p>
                </div>

                <WizardField label="Supported occasions">
                    {occasions.length > 0 ? (
                        <OptionTileGrid
                            options={occasions.map(occ => ({ id: String(occ.id), label: occ.name }))}
                            isSelected={(id) => selectedOccasionIds.includes(Number(id))}
                            onToggle={(id) => toggleOccasion(Number(id))}
                        />
                    ) : (
                        <p className="text-xs text-tlb-muted italic">No occasions available.</p>
                    )}
                </WizardField>

                {outingTypeOptions.length > 0 && (
                    <WizardField label="Outing type">
                        <ChipGroup options={outingTypeOptions} selected={selectedOutingTypes} toggle={toggleOutingType} />
                    </WizardField>
                )}

                {activityTypeOptions.length > 0 && (
                    <WizardField label="Activity type">
                        <ChipGroup options={activityTypeOptions} selected={selectedActivityTypes} toggle={toggleActivityType} />
                    </WizardField>
                )}

                {formatTypeOptions.length > 0 && (
                    <WizardField label="Format">
                        <ChipGroup options={formatTypeOptions} selected={selectedFormatTypes} toggle={toggleFormatType} />
                    </WizardField>
                )}

                <WizardField label="Require at checkout">
                    <div className="pt-card overflow-hidden">
                        {ATTENDEE_FIELD_OPTIONS.map((field, idx) => (
                            <button
                                key={field.key}
                                type="button"
                                onClick={() => toggleField(field.key)}
                                className={`w-full flex items-center justify-between p-4 transition-colors hover:bg-tlb-wash ${idx !== ATTENDEE_FIELD_OPTIONS.length - 1 ? 'border-b border-tlb-divider' : ''}`}
                            >
                                <span className="text-sm font-semibold text-tlb-body">{field.label}</span>
                                <span
                                    role="switch"
                                    aria-checked={requiredFields.includes(field.key)}
                                    className="pt-switch"
                                />
                            </button>
                        ))}
                    </div>
                </WizardField>

                <WizardNav
                    onBack={() => onNavigate('CREATE_VENUE_DETAILS')}
                    onNext={saving ? () => {} : handleNext}
                    nextText={saving ? 'Saving…' : 'Next: Availability'}
                    nextIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} strokeWidth={2.75} />}
                />
            </div>
        </WizardShell>
    );
};

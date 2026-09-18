import { EntityType } from '../../types';

// Re-exported for existing consumers — canonical source is src/constants/entityMeta.ts,
// shared with the listing-creation wizards.
export { SERVICE_TONE, SERVICE_LABEL } from '../../constants/entityMeta';

export const MODEL_LABEL: Record<'ticketed' | 'enquiry', string> = {
    ticketed: 'Ticketed',
    enquiry: 'Enquiry',
};

export const SCOPE_HINT: Record<EntityType, string> = {
    Events: 'Ticketed — sold by the seat.',
    Classes: 'Enquiry-led — you confirm each place.',
    Programs: 'Enquiry-led — you confirm each enrolment.',
    Venues: 'Some listings sell slots directly, others take enquiries.',
};

// Informational only — set in the listing's Policies step, doesn't gate refund processing itself.
export const refundTagMeta = (isRefundable: boolean): { label: string; tone: 'neutral' | 'amber' } =>
    isRefundable ? { label: 'Refundable', tone: 'neutral' } : { label: 'Non-refundable', tone: 'amber' };

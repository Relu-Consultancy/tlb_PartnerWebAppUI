import { EntityType } from '../../types';
import { Tone } from '../../components/portal';

// Matches the client mock's own listing-service tag palette exactly.
export const SERVICE_TONE: Record<EntityType, Tone> = {
    Events: 'amber',
    Classes: 'green',
    Programs: 'purple',
    Venues: 'blue',
};

export const SERVICE_LABEL: Record<EntityType, string> = {
    Events: 'Event',
    Classes: 'Class',
    Programs: 'Program',
    Venues: 'Venue',
};

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

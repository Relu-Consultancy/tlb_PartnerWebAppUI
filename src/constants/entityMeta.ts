import { EntityType } from '../types';
import { Tone } from '../components/portal';

// ---------------------------------------------------------------------------
// Per-entity-type display metadata shared across My Listings, Analytics,
// Bookings/Enquiries, and the listing-creation wizards. Matches the client
// mock's own listing-service tag palette exactly.
// ---------------------------------------------------------------------------

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

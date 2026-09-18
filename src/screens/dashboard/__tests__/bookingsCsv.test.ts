import { describe, it, expect } from 'vitest';
import { BOOKING_CSV_HEADER, buildBookingsCsv, fileSafeName } from '../bookingsCsv';

describe('buildBookingsCsv', () => {
    it('writes a header row and probes alternate field names', () => {
        const csv = buildBookingsCsv([{
            booking_reference: 'BKG-5001',
            user: { first_name: 'Neha', last_name: 'Rao', phone: '+91 98450 22119', email: 'neha@example.com' },
            quantity: 3,
            total_amount: '3300.00',
            status: 'confirmed',
        }]);
        const [header, row] = csv.split('\r\n');
        expect(header).toBe(BOOKING_CSV_HEADER.map(h => `"${h}"`).join(','));
        expect(row).toBe('"BKG-5001","Neha Rao","+91 98450 22119","neha@example.com","3","Rs 3,300","confirmed"');
    });

    it('escapes quotes and neutralises spreadsheet formulas', () => {
        const csv = buildBookingsCsv([{ id: 1, customer_name: '=HYPERLINK("x")', status: 'say "hi"' }]);
        const row = csv.split('\r\n')[1];
        expect(row).toContain(`"'=HYPERLINK(""x"")"`);
        expect(row).toContain('"say ""hi"""');
    });
});

describe('fileSafeName', () => {
    it('collapses punctuation into dashes', () => {
        expect(fileSafeName('Sketching Walk — Cubbon Park')).toBe('Sketching-Walk-Cubbon-Park');
        expect(fileSafeName('***')).toBe('listing');
    });
});

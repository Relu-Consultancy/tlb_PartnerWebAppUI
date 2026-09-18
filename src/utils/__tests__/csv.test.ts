import { describe, it, expect } from 'vitest';
import { escapeCsvCell, toCsv } from '../csv';

describe('escapeCsvCell', () => {
    it('quotes plain text and escapes embedded quotes', () => {
        expect(escapeCsvCell('hello')).toBe('"hello"');
        expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    });

    it('neutralises formula-like text but leaves phone numbers intact', () => {
        expect(escapeCsvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
        expect(escapeCsvCell('+91 98450 22119')).toBe('"+91 98450 22119"');
    });

    it('treats null/undefined as empty', () => {
        expect(escapeCsvCell(null)).toBe('""');
        expect(escapeCsvCell(undefined)).toBe('""');
    });
});

describe('toCsv', () => {
    it('joins header and rows with CRLF', () => {
        expect(toCsv(['A', 'B'], [['1', '2']])).toBe('"A","B"\r\n"1","2"');
    });
});

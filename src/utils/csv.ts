// ---------------------------------------------------------------------------
// Minimal CSV builder shared by every "export as CSV" feature in the portal.
// ---------------------------------------------------------------------------

/**
 * Quotes a cell and neutralises a leading `= + - @` (Excel/Sheets formula
 * injection) unless the text is plainly a phone number, which legitimately
 * starts with `+`.
 */
export const escapeCsvCell = (value: unknown): string => {
    const text = value == null ? '' : String(value);
    const isFormulaLike = /^[=+\-@\t\r]/.test(text) && !/^\+?[\d\s()-]+$/.test(text);
    const safe = isFormulaLike ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
};

export const toCsv = (header: string[], rows: string[][]): string =>
    [header, ...rows].map(row => row.map(escapeCsvCell).join(',')).join('\r\n');

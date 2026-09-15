/** Saves text content as a file via a temporary object URL. */
export const downloadTextFile = (filename: string, content: string, mime = 'text/csv;charset=utf-8'): void => {
    // BOM so spreadsheet apps read non-ASCII names correctly.
    const blob = new Blob(['﻿', content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
};

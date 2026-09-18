import React, { useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useDismiss } from '../../../hooks/useDismiss';
import { ListingRow } from '../types';

interface RowActionsProps {
    row: ListingRow;
    onEdit: () => void;
    onTogglePause: () => void;
    onToggleArchive: () => void;
}

/** Edit + "···" (Pause/Resume, Archive/Unarchive) — stops the row's own onClick from also firing. */
export const RowActions: React.FC<RowActionsProps> = ({ row, onEdit, onTogglePause, onToggleArchive }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    useDismiss(rootRef, open, () => setOpen(false));

    const canPause = row.state === 'live' || row.state === 'paused';
    const canArchive = row.state === 'live' || row.state === 'paused' || row.state === 'archived';
    const editable = row.state !== 'archived';

    return (
        <div className="flex items-center gap-1.5 justify-end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <button type="button" onClick={onEdit} disabled={!editable} className="pt-btn pt-btn-o pt-btn-sm">
                {editable ? 'Edit' : 'Locked'}
            </button>
            {(canPause || canArchive) && (
                <div ref={rootRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setOpen(o => !o)}
                        aria-haspopup="menu"
                        aria-expanded={open}
                        aria-label="More actions"
                        className="pt-btn pt-btn-o pt-btn-sm px-2"
                    >
                        <MoreHorizontal size={14} />
                    </button>
                    {open && (
                        <div role="menu" className="pt-popover absolute right-0 top-9 z-30 w-[170px] p-[7px]">
                            {canPause && (
                                <button type="button" role="menuitem" className="pt-opt" onClick={() => { onTogglePause(); setOpen(false); }}>
                                    {row.state === 'paused' ? 'Resume' : 'Pause'}
                                </button>
                            )}
                            {canArchive && (
                                <button type="button" role="menuitem" className="pt-opt" onClick={() => { onToggleArchive(); setOpen(false); }}>
                                    {row.state === 'archived' ? 'Unarchive' : 'Archive'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

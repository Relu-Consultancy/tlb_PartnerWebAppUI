import React, { useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useDismiss } from '../../../hooks/useDismiss';
import { canArchiveListing, canEditListing, canPauseListing } from '../model';
import { ListingRow } from '../types';

interface RowActionsProps {
    row: ListingRow;
    onEdit: () => void;
    onTogglePause: () => void;
    onToggleArchive: () => void;
}

/**
 * One primary action + "···" — stops the row's own onClick from also firing.
 *
 * The primary action is Archive while the listing is on the marketplace (or
 * queued for it) and Edit once it's off — see `canEditListing`. Offering Edit
 * on a live listing is what confused partners, so it isn't shown there at all.
 */
export const RowActions: React.FC<RowActionsProps> = ({ row, onEdit, onTogglePause, onToggleArchive }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    useDismiss(rootRef, open, () => setOpen(false));

    const editable = canEditListing(row.state);
    const canPause = canPauseListing(row.state);
    const archived = row.state === 'archived';
    const hasMenu = canPause || archived;

    return (
        <div className="flex items-center gap-1.5 justify-end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {editable ? (
                <button type="button" onClick={onEdit} className="pt-btn pt-btn-o pt-btn-sm">
                    Edit
                </button>
            ) : canArchiveListing(row.state) ? (
                <button
                    type="button"
                    onClick={onToggleArchive}
                    title="Take this listing off the marketplace — you can edit it once archived"
                    className="pt-btn pt-btn-o pt-btn-sm"
                >
                    Archive
                </button>
            ) : null}
            {hasMenu && (
                <div ref={rootRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
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
                                <button
                                    type="button"
                                    role="menuitem"
                                    className="pt-opt"
                                    onClick={() => {
                                        onTogglePause();
                                        setOpen(false);
                                    }}
                                >
                                    {row.state === 'paused' ? 'Resume' : 'Pause'}
                                </button>
                            )}
                            {archived && (
                                <button
                                    type="button"
                                    role="menuitem"
                                    className="pt-opt"
                                    onClick={() => {
                                        onToggleArchive();
                                        setOpen(false);
                                    }}
                                >
                                    Unarchive
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

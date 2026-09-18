import React from 'react';
import { CouponRow } from '../types';

interface RowActionsProps {
    row: CouponRow;
    onEdit: () => void;
    onTogglePause: () => void;
}

/** Edit + Pause/Resume — stops the row's own onClick from also firing. */
export const RowActions: React.FC<RowActionsProps> = ({ row, onEdit, onTogglePause }) => (
    <div className="flex items-center gap-1.5 justify-end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button type="button" onClick={onEdit} className="pt-btn pt-btn-o pt-btn-sm">Edit</button>
        {row.status !== 'ended' && (
            <button type="button" onClick={onTogglePause} className="pt-btn pt-btn-o pt-btn-sm">
                {row.status === 'paused' ? 'Resume' : 'Pause'}
            </button>
        )}
    </div>
);

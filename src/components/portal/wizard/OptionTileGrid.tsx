import React from 'react';
import { Check } from 'lucide-react';

export interface WizardTileOption {
    id: string;
    label: string;
    icon?: React.ElementType;
}

interface OptionTileGridProps {
    options: WizardTileOption[];
    isSelected: (id: string) => boolean;
    onToggle: (id: string) => void;
    columns?: string;
}

/** Selectable tile grid — category/subcategory/tag/mode pickers. Works for both single- and multi-select via `isSelected`/`onToggle`. */
export const OptionTileGrid: React.FC<OptionTileGridProps> = ({ options, isSelected, onToggle, columns = 'grid-cols-2 sm:grid-cols-3' }) => (
    <div className={`grid ${columns} gap-3`}>
        {options.map((opt) => {
            const on = isSelected(opt.id);
            const Icon = opt.icon;
            return (
                <button key={opt.id} type="button" onClick={() => onToggle(opt.id)} className={`pt-tile ${on ? 'is-on' : ''}`}>
                    {on && <span className="pt-tile-check"><Check size={11} strokeWidth={3} /></span>}
                    {Icon && <Icon size={18} strokeWidth={2} />}
                    <span className="leading-tight">{opt.label}</span>
                </button>
            );
        })}
    </div>
);

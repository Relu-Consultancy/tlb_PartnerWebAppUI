import React from 'react';
import { ProfileSectionId } from '../../../constants/profileSections';
import { CountBadge } from '../../../components/portal';

export interface ProfileTab {
    id: ProfileSectionId;
    label: string;
    icon: React.ElementType;
    alert?: number;
}

interface ProfileTabsProps {
    tabs: ProfileTab[];
    active: ProfileSectionId;
    onSelect: (id: ProfileSectionId) => void;
}

/** Section switcher — a sticky column on desktop, a scrolling strip on small screens. */
export const ProfileTabs: React.FC<ProfileTabsProps> = ({ tabs, active, onSelect }) => (
    <nav
        aria-label="Profile sections"
        className="pt-card p-2 lg:p-3 flex lg:flex-col gap-0.5 overflow-x-auto lg:sticky lg:top-[76px]"
    >
        {tabs.map(({ id, label, icon: Icon, alert }) => (
            <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                aria-current={active === id ? 'true' : undefined}
                className={`pt-tab w-auto lg:w-full flex-none ${active === id ? 'is-active' : ''}`}
            >
                <Icon size={15} strokeWidth={2.75} aria-hidden="true" />
                {label}
                {!!alert && <CountBadge count={alert} small className="ml-auto" />}
            </button>
        ))}
    </nav>
);

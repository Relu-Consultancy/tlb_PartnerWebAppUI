import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GroupedList } from '../GroupedList';

const LONG = 'Young Innovators: Hands-On Robotics & Coding Masterclass for Ages 8 to 14 — Weekend Batch';

describe('GroupedList — long listing names (QA: program text spilled out of the card)', () => {
    it('truncates the name and keeps the pill and count in place', () => {
        render(
            <GroupedList
                groups={[{ listingId: 'p1', listingTitle: LONG, entity: 'Programs', rows: [{ id: 1 }] } as any]}
                expandedId={null}
                onToggle={() => {}}
                entityLabel={() => 'Program'}
                entityTone={() => 'purple'}
                countLabel={(n) => `${n} enquiry`}
                renderRow={() => null}
            />
        );
        const name = screen.getByText(LONG);
        expect(name.className).toMatch(/\btruncate\b/);
        expect(name.className).toMatch(/\bmin-w-0\b/);
        // Full name still available on hover.
        expect(name).toHaveAttribute('title', LONG);
        // The pill and count must not be the ones that shrink.
        expect(screen.getByText('Program').className).toMatch(/\bflex-none\b/);
        expect(screen.getByText('1 enquiry').className).toMatch(/\bflex-none\b/);
    });
});

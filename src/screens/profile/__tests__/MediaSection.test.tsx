import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaSection } from '../components/MediaSection';

const VIDEO_URL = 'https://cdn.example.com/partner/media/intro.mp4';

const renderWith = (video: any, onDelete = vi.fn()) =>
    render(
        <MediaSection
            coverUrl={null}
            onCoverSelected={vi.fn()}
            images={[]}
            video={video}
            uploading={false}
            onAddImages={vi.fn()}
            onAddVideo={vi.fn()}
            onDelete={onDelete}
        />
    );

describe('MediaSection — gallery video', () => {
    it('plays an uploaded video when the partner clicks it', async () => {
        renderWith({ id: 7, media_type: 'video', file_url: VIDEO_URL });

        // The tile used to be a static box with a play icon — nothing to click.
        await userEvent.click(screen.getByRole('button', { name: 'Play gallery video' }));

        const dialog = await screen.findByRole('dialog', { name: 'Gallery video' });
        const player = dialog.querySelector('video');
        expect(player).not.toBeNull();
        expect(player!.getAttribute('src')).toBe(VIDEO_URL);
        expect(player!.hasAttribute('controls')).toBe(true);
    });

    it('offers the file directly when the browser can’t decode it (e.g. a .mov)', async () => {
        renderWith({ id: 7, media_type: 'video', file: VIDEO_URL });
        await userEvent.click(screen.getByRole('button', { name: 'Play gallery video' }));

        const dialog = await screen.findByRole('dialog', { name: 'Gallery video' });
        fireEvent.error(dialog.querySelector('video')!);

        expect(await screen.findByText(/can’t be played in your browser/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Open in a new tab/i })).toHaveAttribute('href', VIDEO_URL);
    });

    it('still deletes the video from its tile without opening the player', async () => {
        const onDelete = vi.fn();
        renderWith({ id: 7, media_type: 'video', file_url: VIDEO_URL }, onDelete);

        await userEvent.click(screen.getByRole('button', { name: 'Delete video' }));

        expect(onDelete).toHaveBeenCalledWith(7, 'video');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { Registration } from '../Registration';

const BASE = 'https://tlb-api.reluconsultancy.in';

let mediaId = 0;
let posted: Record<string, unknown> | null;

const serve = () => {
    posted = null;
    server.use(
        http.post(`${BASE}/api/v1/partner/media/`, () =>
            HttpResponse.json({ success: true, data: { id: ++mediaId, media_type: 'image', file_url: `https://cdn/x${mediaId}.jpg` } })
        ),
        http.post(`${BASE}/api/v1/partner/profile/`, async ({ request }) => {
            posted = (await request.json()) as Record<string, unknown>;
            return HttpResponse.json({ success: true, data: {} });
        })
    );
};

async function fillAndSubmit(links: { facebook?: string; website?: string }) {
    const onNavigate = vi.fn();
    const { container } = render(<Registration onNavigate={onNavigate} />);
    // Pasted, not typed key by key — ten fields of keystrokes timed out under
    // the full suite's parallel load.
    const fill = async (placeholder: string, value: string) => {
        await userEvent.click(screen.getByPlaceholderText(placeholder));
        await userEvent.paste(value);
    };
    await fill('The Grand Theater', 'Grand Studio');
    await fill('Sarah Bernhardt', 'Asha Rao');
    await fill('xyz@email_name.com', 'asha@grand.example');
    await fill('Mumbai', 'Pune');
    await fill('https://instagram.com/yourbusiness', 'https://instagram.com/grand');
    if (links.facebook) await fill('https://facebook.com/yourbusiness', links.facebook);
    if (links.website) await fill('https://www.yourbusiness.com', links.website);

    const photos = [1, 2, 3].map((i) => new File(['x'], `p${i}.jpg`, { type: 'image/jpeg' }));
    const fileInput = container.querySelector('input[type="file"][multiple]') as HTMLInputElement;
    await userEvent.upload(fileInput, photos);
    await waitFor(() => expect(screen.getAllByRole('button', { name: /delete|remove/i }).length).toBeGreaterThanOrEqual(3));

    for (const box of screen.getAllByRole('checkbox')) await userEvent.click(box);
    await userEvent.click(screen.getByRole('button', { name: /Submit Application/i }));
    await waitFor(() => expect(posted).not.toBeNull());
    return posted!;
}

describe('Registration — Digital Presence', () => {
    it('saves the Facebook and website links a partner types (they used to be thrown away)', async () => {
        serve();
        const body = await fillAndSubmit({ facebook: 'https://facebook.com/grand', website: 'https://grand.example' });
        expect(body).toMatchObject({
            instagram_url: 'https://instagram.com/grand',
            facebook_url: 'https://facebook.com/grand',
            website_url: 'https://grand.example',
        });
    });

    it('leaves the optional links out when they are blank', async () => {
        serve();
        const body = await fillAndSubmit({});
        expect(body).not.toHaveProperty('facebook_url');
        expect(body).not.toHaveProperty('website_url');
    });

    it('suggests a neutral email placeholder', () => {
        render(<Registration onNavigate={vi.fn()} />);
        expect(screen.getByPlaceholderText('xyz@email_name.com')).toBeInTheDocument();
    });
});

describe('Registration — required fields are checked before anything is sent', () => {
    it('marks every missing field inline and sends nothing (QA: raw "may not be blank" dump)', async () => {
        serve();
        render(<Registration onNavigate={vi.fn()} />);

        await userEvent.click(screen.getByRole('button', { name: /Submit Application/i }));

        expect(await screen.findByText('Enter your business or brand name.')).toBeInTheDocument();
        expect(screen.getByText('Enter the contact person’s name.')).toBeInTheDocument();
        expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
        expect(screen.getByText('Enter the city you’re based in.')).toBeInTheDocument();
        expect(screen.getByText(/Add your Instagram link/)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('The Grand Theater')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.queryByText(/ErrorDetail/)).not.toBeInTheDocument();
        expect(posted).toBeNull();
    });

    it('rejects a malformed email and clears a field’s message as the partner fixes it', async () => {
        serve();
        render(<Registration onNavigate={vi.fn()} />);
        const email = screen.getByPlaceholderText('xyz@email_name.com');
        await userEvent.type(email, 'not-an-email');
        await userEvent.click(screen.getByRole('button', { name: /Submit Application/i }));

        expect(await screen.findByText(/Enter a valid email address/)).toBeInTheDocument();
        await userEvent.type(email, '@grand.example');
        expect(screen.queryByText(/Enter a valid email address/)).not.toBeInTheDocument();
    });

    it('completes links typed without https://', async () => {
        serve();
        const body = await fillAndSubmit({ facebook: 'facebook.com/grand' });
        expect(body.facebook_url).toBe('https://facebook.com/grand');
    });
});

import { useCallback, useEffect, useState } from 'react';
import { EntityType } from '../../types';
import {
    addPartnerVertical, getPartnerVerticals, removePartnerVertical, PartnerVertical, VerticalApiError,
} from '../../api/verticals';
import { toast } from '../../components/ui';

// ---------------------------------------------------------------------------
// Self-service verticals (Services & categories section) — GET/POST/DELETE
// /api/v1/partner/verticals/. Approved-partners-only; a mid-onboarding
// partner gets 403 here, which we treat as "not available yet" rather than
// an error. Every add/remove is real and immediate — there is no pending
// "under review" state for this endpoint.
// ---------------------------------------------------------------------------

const KNOWN_ENTITIES: EntityType[] = ['Events', 'Classes', 'Programs', 'Venues'];
const isKnownEntity = (name: string): name is EntityType => (KNOWN_ENTITIES as string[]).includes(name);

interface State {
    loading: boolean;
    available: boolean;
    verticals: PartnerVertical[];
    busy: string | null;
}

export const useVerticalsData = (onEntitiesChanged: (entities: EntityType[]) => void) => {
    const [state, setState] = useState<State>({ loading: true, available: true, verticals: [], busy: null });

    const load = useCallback(async () => {
        setState(s => ({ ...s, loading: true }));
        try {
            const verticals = await getPartnerVerticals();
            setState({ loading: false, available: true, verticals, busy: null });
            onEntitiesChanged(verticals.map(v => v.name).filter(isKnownEntity));
        } catch (err: any) {
            // A 403 here means the partner hasn't been fully approved yet — the
            // section hides itself rather than surfacing an error for a case
            // that isn't actually a failure.
            const notApprovedYet = (err as VerticalApiError)?.status === 403;
            setState({ loading: false, available: !notApprovedYet, verticals: [], busy: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { load(); }, [load]);

    const add = async (category: string) => {
        setState(s => ({ ...s, busy: category }));
        try {
            const added = await addPartnerVertical(category);
            setState(s => {
                const verticals = s.verticals.some(v => v.name === added.name) ? s.verticals : [...s.verticals, added];
                onEntitiesChanged(verticals.map(v => v.name).filter(isKnownEntity));
                return { ...s, busy: null, verticals };
            });
            toast.success(`${category} added — you can create listings for it right away.`);
        } catch (err: any) {
            setState(s => ({ ...s, busy: null }));
            toast.error(err?.message || `Couldn't add ${category}. Please try again.`);
        }
    };

    const remove = async (category: string) => {
        setState(s => ({ ...s, busy: category }));
        try {
            await removePartnerVertical(category);
            setState(s => {
                const verticals = s.verticals.filter(v => v.name !== category);
                onEntitiesChanged(verticals.map(v => v.name).filter(isKnownEntity));
                return { ...s, busy: null, verticals };
            });
            toast.success(`${category} removed.`);
        } catch (err: any) {
            setState(s => ({ ...s, busy: null }));
            const err_ = err as VerticalApiError;
            toast.error(err_?.message || `Couldn't remove ${category}. Please try again.`);
        }
    };

    return { loading: state.loading, available: state.available, verticals: state.verticals, busy: state.busy, add, remove };
};

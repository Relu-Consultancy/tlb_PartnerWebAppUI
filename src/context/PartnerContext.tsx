import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { EntityType } from '../types';
import { DateRangeKey, DEFAULT_DATE_RANGE, isDateRangeKey } from '../constants/dateRange';

interface PartnerContextValue {
    allowedEntities: EntityType[];
    setAllowedEntities: (entities: EntityType[]) => void;
    /** Reporting window chosen in the top bar; drives period-aware figures. */
    dateRange: DateRangeKey;
    setDateRange: (range: DateRangeKey) => void;
}

const DATE_RANGE_STORAGE_KEY = 'dateRange';
const KNOWN_ENTITIES: EntityType[] = ['Events', 'Classes', 'Programs', 'Venues'];

const PartnerContext = createContext<PartnerContextValue>({
    allowedEntities: [],
    setAllowedEntities: () => {},
    dateRange: DEFAULT_DATE_RANGE,
    setDateRange: () => {},
});

export const usePartner = () => useContext(PartnerContext);

export const PartnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // This runs above the screen error boundary, so a corrupt or blocked
    // sessionStorage value must degrade to "no services yet", never throw.
    const [allowedEntities, setAllowedEntitiesState] = useState<EntityType[]>(() => {
        try {
            const parsed = JSON.parse(sessionStorage.getItem('allowedEntities') || '[]');
            return Array.isArray(parsed) ? parsed.filter((e): e is EntityType => KNOWN_ENTITIES.includes(e)) : [];
        } catch {
            return [];
        }
    });

    const [dateRange, setDateRangeState] = useState<DateRangeKey>(() => {
        try {
            const stored = sessionStorage.getItem(DATE_RANGE_STORAGE_KEY);
            return isDateRangeKey(stored) ? stored : DEFAULT_DATE_RANGE;
        } catch {
            return DEFAULT_DATE_RANGE;
        }
    });

    // Stable identities — App's route guard and several effects depend on these.
    const setAllowedEntities = useCallback((entities: EntityType[]) => {
        setAllowedEntitiesState(entities);
        try {
            sessionStorage.setItem('allowedEntities', JSON.stringify(entities));
        } catch {
            /* storage unavailable — state still updates */
        }
    }, []);

    const setDateRange = useCallback((range: DateRangeKey) => {
        setDateRangeState(range);
        try {
            sessionStorage.setItem(DATE_RANGE_STORAGE_KEY, range);
        } catch {
            /* storage unavailable — state still updates */
        }
    }, []);

    const value = useMemo(
        () => ({ allowedEntities, setAllowedEntities, dateRange, setDateRange }),
        [allowedEntities, setAllowedEntities, dateRange, setDateRange]
    );

    return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>;
};

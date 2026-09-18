import React, { createContext, useContext, useState } from 'react';
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

const PartnerContext = createContext<PartnerContextValue>({
  allowedEntities: [],
  setAllowedEntities: () => {},
  dateRange: DEFAULT_DATE_RANGE,
  setDateRange: () => {},
});

export const usePartner = () => useContext(PartnerContext);

export const PartnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allowedEntities, setAllowedEntitiesState] = useState<EntityType[]>(() => {
    const stored = sessionStorage.getItem('allowedEntities');
    return stored ? JSON.parse(stored) : [];
  });

  const [dateRange, setDateRangeState] = useState<DateRangeKey>(() => {
    const stored = sessionStorage.getItem(DATE_RANGE_STORAGE_KEY);
    return isDateRangeKey(stored) ? stored : DEFAULT_DATE_RANGE;
  });

  const setAllowedEntities = (entities: EntityType[]) => {
    setAllowedEntitiesState(entities);
    sessionStorage.setItem('allowedEntities', JSON.stringify(entities));
  };

  const setDateRange = (range: DateRangeKey) => {
    setDateRangeState(range);
    sessionStorage.setItem(DATE_RANGE_STORAGE_KEY, range);
  };

  return (
    <PartnerContext.Provider value={{ allowedEntities, setAllowedEntities, dateRange, setDateRange }}>
      {children}
    </PartnerContext.Provider>
  );
};

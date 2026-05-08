import React, { createContext, useContext, useState } from 'react';
import { EntityType } from '../types';

interface PartnerContextValue {
  allowedEntities: EntityType[];
  setAllowedEntities: (entities: EntityType[]) => void;
}

const PartnerContext = createContext<PartnerContextValue>({
  allowedEntities: [],
  setAllowedEntities: () => {},
});

export const usePartner = () => useContext(PartnerContext);

export const PartnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allowedEntities, setAllowedEntitiesState] = useState<EntityType[]>(() => {
    const stored = sessionStorage.getItem('allowedEntities');
    return stored ? JSON.parse(stored) : [];
  });

  const setAllowedEntities = (entities: EntityType[]) => {
    setAllowedEntitiesState(entities);
    sessionStorage.setItem('allowedEntities', JSON.stringify(entities));
  };

  return (
    <PartnerContext.Provider value={{ allowedEntities, setAllowedEntities }}>
      {children}
    </PartnerContext.Provider>
  );
};

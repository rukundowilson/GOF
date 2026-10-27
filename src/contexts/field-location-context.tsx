import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { FieldLocation } from '@/utils/field-location';

type FieldLocationContextValue = {
  fieldLocation: FieldLocation | null;
  setFieldLocation: Dispatch<SetStateAction<FieldLocation | null>>;
};

const FieldLocationContext = createContext<FieldLocationContextValue | null>(null);

export function FieldLocationProvider({ children }: { children: ReactNode }) {
  const [fieldLocation, setFieldLocation] = useState<FieldLocation | null>(null);

  return (
    <FieldLocationContext.Provider value={{ fieldLocation, setFieldLocation }}>
      {children}
    </FieldLocationContext.Provider>
  );
}

export function useFieldLocation() {
  const context = useContext(FieldLocationContext);
  if (!context) throw new Error('useFieldLocation must be used within FieldLocationProvider');
  return context;
}

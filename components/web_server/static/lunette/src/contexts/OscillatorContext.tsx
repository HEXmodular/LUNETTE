import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { OscillatorConfig } from '@api/oscillatorApi';
import useOscillatorApi from '@api/oscillatorApi';

interface OscillatorContextType {
  oscillators: OscillatorConfig[];
  updateOscillator: (config: OscillatorConfig) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const OscillatorContext = createContext<OscillatorContextType | null>(null);

export const useOscillatorContext = () => {
  const context = useContext(OscillatorContext);
  if (!context) {
    throw new Error('useOscillatorContext must be used within an OscillatorProvider');
  }
  return context;
};

export const OscillatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [oscillators, setOscillators] = useState<OscillatorConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getOscillators, updateOscillator: updateOscillatorApi } = useOscillatorApi();
  const dataFetching = useRef({ oscillators: false });

  const fetchOscillators = useCallback(async () => {
    if (dataFetching.current.oscillators) return;
    
    try {
      dataFetching.current.oscillators = true;
      setIsLoading(true);
      setError(null);
      const data = await getOscillators();
      setOscillators(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch oscillators');
    } finally {
      setIsLoading(false);
    }
  }, [getOscillators]);

  const updateOscillator = useCallback(async (config: OscillatorConfig) => {
    try {
      await updateOscillatorApi(config);
      setOscillators(prev => 
        prev.map(osc => 
          osc.oscillator_id === config.oscillator_id ? config : osc
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update oscillator');
    }
  }, [updateOscillatorApi]);

  useEffect(() => {
    fetchOscillators();
  }, []);

  const value = {
    oscillators,
    updateOscillator,
    isLoading,
    error
  };

  return (
    <OscillatorContext.Provider value={value}>
      {children}
    </OscillatorContext.Provider>
  );
}; 
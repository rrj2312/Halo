import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Transcript {
  time: string;
  text: string;
  threat_level: string;
}

interface JourneyContextType {
  selectedMode: string | null;
  setSelectedMode: (mode: string) => void;
  emergencyContact: { name: string; phone: string };
  setEmergencyContact: (contact: { name: string; phone: string }) => void;
  transcriptHistory: Transcript[];
  addTranscript: (t: Transcript) => void;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '' });
  const [transcriptHistory, setTranscriptHistory] = useState<Transcript[]>([]);

  const addTranscript = (t: Transcript) => {
    setTranscriptHistory(prev => [...prev.slice(-20), t]); // keep last 20
  };

  return (
    <JourneyContext.Provider value={{
      selectedMode, setSelectedMode,
      emergencyContact, setEmergencyContact,
      transcriptHistory, addTranscript
    }}>
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) throw new Error('useJourney must be inside JourneyProvider');
  return context;
}
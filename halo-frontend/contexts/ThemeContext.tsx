import React, { createContext, useContext, useState, ReactNode } from 'react';

export const COLORS = {
  light: {
    background: '#FFF8F8',
    cardBackground: '#FFFFFF',
    cardTint: '#FFE8EC',
    text: '#0D0D0F',
    textSecondary: '#666666',
    border: '#E5E5E5',
  },
  dark: {
    background: '#0D0D0F',
    cardBackground: '#1A1A1C',
    cardTint: '#1A1A1C',
    text: '#FFF8F8',
    textSecondary: '#999999',
    border: '#2A2A2C',
  },
  common: {
    amber: '#F5A623',
    red: '#C0392B',
    redBackground: '#1A0000',
    green: '#27AE60',
    grey: '#C4C4C4',
  },
};

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof COLORS.light & typeof COLORS.common;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const colors = {
    ...COLORS[theme],
    ...COLORS.common,
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

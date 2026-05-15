import React, { createContext, useContext, useState, useRef } from 'react';

interface NavigationContextType {
  lastMainTab: string;
  setLastMainTab: (tab: string) => void;
  navigationHistory: string[];
  pushToHistory: (route: string) => void;
  popFromHistory: () => string | null;
  clearHistory: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [lastMainTab, setLastMainTab] = useState('/(main)/home');
  const historyRef = useRef<string[]>([]);

  const pushToHistory = (route: string) => {
    // Only track main tab routes
    const mainTabs = ['/(main)/home', '/(main)/bookings', '/(main)/book', '/(main)/favorite'];
    if (mainTabs.includes(route)) {
      historyRef.current.push(route);
    }
  };

  const popFromHistory = (): string | null => {
    if (historyRef.current.length > 1) {
      historyRef.current.pop(); // Remove current
      return historyRef.current[historyRef.current.length - 1]; // Return previous
    }
    return null;
  };

  const clearHistory = () => {
    historyRef.current = [];
  };

  return (
    <NavigationContext.Provider
      value={{
        lastMainTab,
        setLastMainTab,
        navigationHistory: historyRef.current,
        pushToHistory,
        popFromHistory,
        clearHistory,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }
  return context;
}

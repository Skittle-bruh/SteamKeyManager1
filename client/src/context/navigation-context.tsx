import React, { createContext, useContext, useState } from "react";

interface NavigationContextType {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState("dashboard");

  console.log('NavigationProvider rendering with activeSection:', activeSection);

  const handleSetActiveSection = (section: string) => {
    console.log('handleSetActiveSection called with:', section);
    setActiveSection(section);
  };

  return (
    <NavigationContext.Provider value={{
      activeSection,
      setActiveSection: handleSetActiveSection
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
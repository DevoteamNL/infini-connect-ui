import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface SettingsContextProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const savedSettings = localStorage.getItem("settings");
const settings = savedSettings && JSON.parse(savedSettings);

const SettingsContext = createContext<SettingsContextProps>({
  darkMode: settings?.darkMode || false,
  toggleDarkMode: () => {},
});

const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [darkMode, setDarkMode] = useState<boolean>(
    settings?.darkMode || false,
  );

  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify({ darkMode }));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevDarkMode) => !prevDarkMode);
  };

  return (
    <SettingsContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </SettingsContext.Provider>
  );
};

const useSettings = (): SettingsContextProps => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export { SettingsProvider, useSettings };

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface Settings {
  darkMode: boolean;
}

interface SettingsContextProps {
  settings: Settings;
  toggleDarkMode: () => void;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(
  undefined,
);

const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>({
    darkMode: false,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem("settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  const toggleDarkMode = () => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      darkMode: !prevSettings.darkMode,
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, toggleDarkMode }}>
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

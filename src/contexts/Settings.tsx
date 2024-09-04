import * as React from "react";
import {
  Context,
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Settings } from "~/types";

interface SettingsApi {
  darkMode: boolean;
  setSetting: (key: keyof Settings, value: any) => void;
}

export const SettingsContext = createContext<Partial<SettingsApi>>(
  {}
) as Context<SettingsApi>;

export default function SettingsProvider({ children }: PropsWithChildren<any>) {
  // const themeConfig = useMemo(() => new ThemeConfig(), []);
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem("settings");

    if (stored) {
      return JSON.parse(stored);
    }

    return {
      darkMode:
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches,
    };
  });

  const setSetting = useCallback(
    (key: keyof Settings, value: any) => {
      const newSetting = {
        ...settings,
        [key]: value,
      };
      setSettings(newSetting);
      localStorage.setItem("settings", JSON.stringify(newSetting));
    },
    [settings]
  );

  useEffect(() => {
    document
      .querySelector("html")
      ?.setAttribute("data-bs-theme", settings.darkMode ? "dark" : "light");
  }, [settings.darkMode]);

  return (
    <SettingsContext.Provider
      value={{
        darkMode: settings.darkMode,
        setSetting,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

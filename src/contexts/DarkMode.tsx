import * as React from "react";
import {
  Context,
  createContext,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThemeConfig } from "bootstrap-darkmode";

interface DarkModeApi {
  darkMode: boolean;
  toggle: () => void;
}

export const DarkModeContext = createContext<Partial<DarkModeApi>>(
  {}
) as Context<DarkModeApi>;
interface DarkModeProviderProps {
  children: ReactNode;
}

export default function DarkModeProvider({ children }: DarkModeProviderProps) {
  const themeConfig = useMemo(() => new ThemeConfig(), []);
  const [darkMode, setDarkMode] = useState(
    () => themeConfig.getTheme() === "dark"
  );

  useEffect(() => {
    themeConfig.setTheme(darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <DarkModeContext.Provider
      value={{
        darkMode,
        toggle: () => setDarkMode((dm) => !dm),
      }}
    >
      {children}
    </DarkModeContext.Provider>
  );
}

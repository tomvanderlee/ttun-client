import {useEffect, useMemo, useState} from "react";
import {ThemeConfig} from "bootstrap-darkmode";

export interface UseDarkMode {
  darkMode: boolean
  toggle: () => void
}

export default function useDarkMode() {
  const themeConfig = useMemo(() => new ThemeConfig(), []);
  const [darkMode, setDarkMode] = useState(() => themeConfig.getTheme() === 'dark')

  useEffect(() => {
    themeConfig.setTheme(darkMode ? 'dark' : 'light');
  }, [darkMode])

  return {
    darkMode,
    toggle: () => setDarkMode(dm => !dm),
  }
}

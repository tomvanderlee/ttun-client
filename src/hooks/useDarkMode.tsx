import {useEffect, useMemo, useState} from "react";
import {ThemeConfig} from "bootstrap-darkmode";

export interface UseDarkMode {
  darkMode: boolean
  toggle: () => void
}

export default function useDarkMode() {

  return {
    darkMode,
    toggle: () => setDarkMode(dm => !dm),
  }
}

import { createContext } from "react";

export const THEME_STORAGE_KEY = "ai-commerce-theme";
export const DARK_THEME = "dark";
export const LIGHT_THEME = "light";

export const ThemeContext = createContext({
  theme: DARK_THEME,
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
  storageKey: THEME_STORAGE_KEY,
});

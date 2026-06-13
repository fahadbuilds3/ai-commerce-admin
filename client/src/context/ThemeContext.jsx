import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DARK_THEME,
  LIGHT_THEME,
  THEME_STORAGE_KEY,
  ThemeContext,
} from "./themeState";

function getSystemTheme() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
  ) {
    return DARK_THEME;
  }

  return LIGHT_THEME;
}

function getInitialTheme() {
  if (typeof window === "undefined") return DARK_THEME;

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === DARK_THEME || savedTheme === LIGHT_THEME) {
      return savedTheme;
    }
  } catch {
    return DARK_THEME;
  }

  return getSystemTheme();
}

function applyTheme(theme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.toggle(DARK_THEME, theme === DARK_THEME);
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    if (nextTheme !== DARK_THEME && nextTheme !== LIGHT_THEME) return;

    setThemeState(nextTheme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Keep the theme active even when localStorage is unavailable.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === DARK_THEME ? LIGHT_THEME : DARK_THEME);
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === DARK_THEME,
      storageKey: THEME_STORAGE_KEY,
    }),
    [setTheme, theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

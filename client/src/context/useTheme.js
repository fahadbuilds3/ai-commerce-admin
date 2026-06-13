import { useContext } from "react";
import { ThemeContext } from "./themeState";

export function useTheme() {
  return useContext(ThemeContext);
}

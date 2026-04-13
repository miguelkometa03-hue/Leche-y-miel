// utils/useTheme.ts
// Hook para acceder al tema activo de la app.
// Úsalo en cualquier pantalla: const C = useTheme();
// Reemplaza todas las referencias a Colors.light.* por C.*

import useAppStore from "@/store/useAppStore";
import { THEMES, type AppTheme } from "@/constants/colors";

export function useTheme() {
  const appTheme = useAppStore((s) => s.appTheme);
  return THEMES[appTheme] ?? THEMES.trigo;
}

export default useTheme;

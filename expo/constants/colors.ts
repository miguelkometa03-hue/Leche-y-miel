// constants/colors.ts
// Sistema de temas dinámico para Pastry-Pro
// 3 temas: Trigo (naranja oscuro), Cacao (chocolate), Nieve (claro)

export type AppTheme = "trigo" | "cacao" | "nieve";

interface ColorPalette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;
  accent: string;
  accentLight: string;
  gold: string;
  goldMuted: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  card: string;
  cardElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderLight: string;
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  error: string;
  errorMuted: string;
  water: string;
  waterMuted: string;
  cream: string;
  creamMuted: string;
  honey: string;
  wheat: string;
  chocolate: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  inputBg: string;
  inputBorder: string;
}

// ── Tema Trigo (original, oscuro con naranja cálido) ─────────────────────────
const trigoTheme: ColorPalette = {
  primary: "#E8922F",
  primaryDark: "#C67A1A",
  primaryLight: "#F5B870",
  primaryMuted: "rgba(232, 146, 47, 0.15)",
  accent: "#1A1A1A",
  accentLight: "#2A2A2A",
  gold: "#FFB830",
  goldMuted: "rgba(255, 184, 48, 0.15)",
  background: "#0D0D0D",
  backgroundSecondary: "#141414",
  backgroundTertiary: "#1E1E1E",
  card: "#1A1A1A",
  cardElevated: "#222222",
  text: "#F5F0E8",
  textSecondary: "#A09888",
  textMuted: "#6B6560",
  textInverse: "#0D0D0D",
  border: "#2A2724",
  borderLight: "#1F1D1A",
  success: "#4ADE80",
  successMuted: "rgba(74, 222, 128, 0.12)",
  warning: "#FBBF24",
  warningMuted: "rgba(251, 191, 36, 0.12)",
  error: "#F87171",
  errorMuted: "rgba(248, 113, 113, 0.12)",
  water: "#60A5FA",
  waterMuted: "rgba(96, 165, 250, 0.12)",
  cream: "#F5E6D3",
  creamMuted: "rgba(245, 230, 211, 0.08)",
  honey: "#D4A574",
  wheat: "#DEB887",
  chocolate: "#5D4037",
  tint: "#E8922F",
  tabIconDefault: "#4A4540",
  tabIconSelected: "#E8922F",
  inputBg: "#252525",
  inputBorder: "#333030",
};

// ── Tema Cacao (oscuro con marrones chocolatosos) ─────────────────────────────
const cacaoTheme: ColorPalette = {
  primary: "#A0522D",        // sienna chocolate
  primaryDark: "#7B3A1E",
  primaryLight: "#CD853F",
  primaryMuted: "rgba(160, 82, 45, 0.18)",
  accent: "#1C1410",
  accentLight: "#2C2018",
  gold: "#DAA520",
  goldMuted: "rgba(218, 165, 32, 0.15)",
  background: "#0A0806",
  backgroundSecondary: "#110E0A",
  backgroundTertiary: "#1A1410",
  card: "#161210",
  cardElevated: "#201A16",
  text: "#F2EAE0",
  textSecondary: "#9E8E7E",
  textMuted: "#6B5E52",
  textInverse: "#0A0806",
  border: "#2C2218",
  borderLight: "#201A14",
  success: "#5EBD7A",
  successMuted: "rgba(94, 189, 122, 0.12)",
  warning: "#E8A825",
  warningMuted: "rgba(232, 168, 37, 0.12)",
  error: "#E06060",
  errorMuted: "rgba(224, 96, 96, 0.12)",
  water: "#5B9BD6",
  waterMuted: "rgba(91, 155, 214, 0.12)",
  cream: "#EDD9C0",
  creamMuted: "rgba(237, 217, 192, 0.08)",
  honey: "#C8955A",
  wheat: "#C8A880",
  chocolate: "#3E2010",
  tint: "#A0522D",
  tabIconDefault: "#4A3C32",
  tabIconSelected: "#A0522D",
  inputBg: "#1E1812",
  inputBorder: "#302418",
};

// ── Tema Nieve (claro, limpio, con azul acero) ────────────────────────────────
const nieveTheme: ColorPalette = {
  primary: "#2E7DD1",        // azul acero profesional
  primaryDark: "#1A5FA8",
  primaryLight: "#5EA4E8",
  primaryMuted: "rgba(46, 125, 209, 0.12)",
  accent: "#F0EDE8",
  accentLight: "#FAF8F5",
  gold: "#D4A030",
  goldMuted: "rgba(212, 160, 48, 0.15)",
  background: "#F4F1ED",
  backgroundSecondary: "#EBE7E2",
  backgroundTertiary: "#E0DBD5",
  card: "#FFFFFF",
  cardElevated: "#FAF8F5",
  text: "#1A1614",
  textSecondary: "#5C5650",
  textMuted: "#8C8580",
  textInverse: "#FFFFFF",
  border: "#D8D2CC",
  borderLight: "#E8E3DE",
  success: "#2E8B4E",
  successMuted: "rgba(46, 139, 78, 0.10)",
  warning: "#C47D10",
  warningMuted: "rgba(196, 125, 16, 0.10)",
  error: "#CC3B3B",
  errorMuted: "rgba(204, 59, 59, 0.10)",
  water: "#2E7DD1",
  waterMuted: "rgba(46, 125, 209, 0.12)",
  cream: "#8B7355",
  creamMuted: "rgba(139, 115, 85, 0.08)",
  honey: "#A0702A",
  wheat: "#8B7050",
  chocolate: "#4A2E14",
  tint: "#2E7DD1",
  tabIconDefault: "#9A948E",
  tabIconSelected: "#2E7DD1",
  inputBg: "#F8F5F2",
  inputBorder: "#CCC8C2",
};

export const THEMES: Record<AppTheme, ColorPalette> = {
  trigo: trigoTheme,
  cacao: cacaoTheme,
  nieve: nieveTheme,
};

export const THEME_META: Record<
  AppTheme,
  { label: string; description: string; preview: string[] }
> = {
  trigo: {
    label: "Trigo",
    description: "Oscuro y cálido, como el horno encendido",
    preview: ["#0D0D0D", "#E8922F", "#F5B870"],
  },
  cacao: {
    label: "Cacao",
    description: "Profundo y chocolatoso, artesanal puro",
    preview: ["#0A0806", "#A0522D", "#CD853F"],
  },
  nieve: {
    label: "Nieve",
    description: "Claro y profesional, para trabajar con claridad",
    preview: ["#F4F1ED", "#2E7DD1", "#5EA4E8"],
  },
};

// ── Colores estáticos (para compatibilidad con código existente) ───────────────
// Se sigue exportando Colors.light para no romper importaciones existentes.
// Para usar el tema dinámico, importa useTheme() desde utils/useTheme.ts
export const Colors = {
  light: trigoTheme,
  dark: trigoTheme,
};

export default Colors;

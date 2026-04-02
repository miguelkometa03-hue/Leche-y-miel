export type CurrencyCode = "COP" | "USD" | "MXN" | "EUR" | "ARS" | "PEN" | "CLP" | "BRL";

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
  locale: string;
}

const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: "USD", symbol: "$", name: "Dólar estadounidense", decimals: 2, locale: "en-US" },
  COP: { code: "COP", symbol: "$", name: "Peso colombiano", decimals: 0, locale: "es-CO" },
  MXN: { code: "MXN", symbol: "$", name: "Peso mexicano", decimals: 2, locale: "es-MX" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", decimals: 2, locale: "es-ES" },
  ARS: { code: "ARS", symbol: "$", name: "Peso argentino", decimals: 2, locale: "es-AR" },
  PEN: { code: "PEN", symbol: "S/", name: "Sol peruano", decimals: 2, locale: "es-PE" },
  CLP: { code: "CLP", symbol: "$", name: "Peso chileno", decimals: 0, locale: "es-CL" },
  BRL: { code: "BRL", symbol: "R$", name: "Real brasileño", decimals: 2, locale: "pt-BR" },
};

export const AVAILABLE_CURRENCIES = Object.values(CURRENCIES);

export function getCurrencyConfig(code: CurrencyCode): CurrencyConfig {
  return CURRENCIES[code] ?? CURRENCIES.USD;
}

export function formatCurrency(amount: number, code: CurrencyCode): string {
  const config = getCurrencyConfig(code);
  const formatted = amount.toFixed(config.decimals);
  return `${config.symbol}${formatted}`;
}

export function formatCurrencyPerKg(code: CurrencyCode): string {
  const config = getCurrencyConfig(code);
  return `${config.symbol}/kg`;
}

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

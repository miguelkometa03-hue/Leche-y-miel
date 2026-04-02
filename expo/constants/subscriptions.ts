import type { SubscriptionPlan, SubscriptionTier } from "@/types";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: "free",
    name: "Básico",
    price: "Gratis",
    period: "",
    features: [
      "Crear hasta 5 fórmulas",
      "Fórmulas públicas solamente",
      "Feed del panadero (leer y publicar)",
      "Plantillas básicas de panadería",
      "Calculadora de formulación",
    ],
  },
  {
    tier: "pro",
    name: "Profesional",
    price: "$9.99",
    period: "/mes",
    highlighted: true,
    features: [
      "Fórmulas ilimitadas",
      "Fórmulas públicas y privadas",
      "Cálculo de costos completo",
      "Margen de ganancia editable",
      "Fichas técnicas profesionales",
      "Exportar e imprimir fichas",
      "Plantillas avanzadas",
      "Historial de cálculos",
      "Perfil profesional completo",
      "Portafolio de trabajos",
    ],
  },
  {
    tier: "premium",
    name: "Empresa",
    price: "$29.99",
    period: "/mes",
    features: [
      "Todo del plan Profesional",
      "Programación de producción",
      "Rutas de trabajo optimizadas",
      "Gestión de inventario completo",
      "Lista de compras automática",
      "Marcas de proveedores",
      "Múltiples usuarios / equipo",
      "Reportes de producción",
      "Soporte prioritario",
      "API de integración",
    ],
  },
];

export const FEATURE_GATES: Record<string, SubscriptionTier> = {
  unlimited_formulas: "pro",
  private_formulas: "pro",
  cost_calculation: "pro",
  profit_margin: "pro",
  export_ficha: "pro",
  advanced_templates: "pro",
  professional_profile: "pro",
  portfolio: "pro",
  production_planning: "premium",
  inventory_management: "premium",
  purchase_lists: "premium",
  supplier_brands: "premium",
  team_management: "premium",
  work_routes: "premium",
  production_reports: "premium",
};

export function canAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  const tierLevel: Record<SubscriptionTier, number> = {
    free: 0,
    pro: 1,
    premium: 2,
  };
  return tierLevel[userTier] >= tierLevel[requiredTier];
}

export function canUseFeature(userTier: SubscriptionTier, feature: string): boolean {
  const required = FEATURE_GATES[feature];
  if (!required) return true;
  return canAccess(userTier, required);
}

export function getTierColor(tier: SubscriptionTier): string {
  switch (tier) {
    case "free": return "#6B6560";
    case "pro": return "#E8922F";
    case "premium": return "#FFB830";
  }
}

export function getTierLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case "free": return "Básico";
    case "pro": return "Profesional";
    case "premium": return "Empresa";
  }
}

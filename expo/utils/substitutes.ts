import type { IngredientSubstitute } from "@/types";

export const INGREDIENT_SUBSTITUTES: IngredientSubstitute[] = [
  {
    original: "Mantequilla",
    substitute: "Margarina",
    ratio: 1.0,
    notes: "Sustitución directa 1:1. La margarina tiene más agua, puede afectar textura.",
    category: "grasas",
  },
  {
    original: "Margarina",
    substitute: "Mantequilla",
    ratio: 1.0,
    notes: "Sustitución directa 1:1. La mantequilla da mejor sabor y color.",
    category: "grasas",
  },
  {
    original: "Mantequilla",
    substitute: "Aceite vegetal",
    ratio: 0.8,
    notes: "Usar 80% del peso de mantequilla. Cambia la textura significativamente.",
    category: "grasas",
  },
  {
    original: "Mantequilla",
    substitute: "Manteca de cerdo",
    ratio: 0.85,
    notes: "Usar 85% del peso. Da una miga más suave pero sin sabor a mantequilla.",
    category: "grasas",
  },
  {
    original: "Levadura fresca",
    substitute: "Levadura seca instantánea",
    ratio: 0.33,
    notes: "Usar 1/3 del peso de levadura fresca. No necesita activación previa.",
    category: "fermentos",
  },
  {
    original: "Levadura seca instantánea",
    substitute: "Levadura fresca",
    ratio: 3.0,
    notes: "Usar 3 veces el peso de levadura seca. Disolver en líquido tibio primero.",
    category: "fermentos",
  },
  {
    original: "Levadura fresca",
    substitute: "Masa madre activa",
    ratio: 5.0,
    notes: "Usar 5x el peso de levadura. Reducir agua de receta un 50% del peso de masa madre. Fermentación más larga.",
    category: "fermentos",
  },
  {
    original: "Masa madre activa",
    substitute: "Levadura fresca",
    ratio: 0.2,
    notes: "Usar 20% del peso de masa madre. Agregar agua para compensar. Menos sabor ácido.",
    category: "fermentos",
  },
  {
    original: "Levadura fresca",
    substitute: "Levadura seca activa",
    ratio: 0.4,
    notes: "Usar 40% del peso. Activar en agua tibia (35°C) con una pizca de azúcar por 10min.",
    category: "fermentos",
  },
  {
    original: "Azúcar",
    substitute: "Miel",
    ratio: 0.75,
    notes: "Usar 75% del peso. Reducir líquidos un 10%. Añade humedad y sabor floral. Dora más rápido.",
    category: "endulzantes",
  },
  {
    original: "Miel",
    substitute: "Azúcar",
    ratio: 1.33,
    notes: "Usar 133% del peso de miel. Agregar un poco más de líquido. Pierde humedad y sabor.",
    category: "endulzantes",
  },
  {
    original: "Azúcar",
    substitute: "Panela/Piloncillo",
    ratio: 1.0,
    notes: "Sustitución 1:1. Rallar finamente. Aporta sabor a caramelo y minerales.",
    category: "endulzantes",
  },
  {
    original: "Azúcar",
    substitute: "Jarabe de agave",
    ratio: 0.67,
    notes: "Usar 67% del peso. Reducir líquidos un 15%. Más dulce que el azúcar.",
    category: "endulzantes",
  },
  {
    original: "Azúcar",
    substitute: "Stevia en polvo",
    ratio: 0.003,
    notes: "Usar 0.3% del peso. La stevia es 300x más dulce. No carameliza ni da volumen.",
    category: "endulzantes",
  },
  {
    original: "Leche entera",
    substitute: "Agua + leche en polvo",
    ratio: 1.0,
    notes: "Mismo volumen de agua + 10% del peso en leche en polvo.",
    category: "liquidos",
  },
  {
    original: "Leche entera",
    substitute: "Leche de almendras",
    ratio: 1.0,
    notes: "Sustitución 1:1. Menos proteína, puede afectar estructura. Apto para intolerantes.",
    category: "liquidos",
  },
  {
    original: "Leche entera",
    substitute: "Leche de avena",
    ratio: 1.0,
    notes: "Sustitución 1:1. Buena alternativa vegana con textura cremosa.",
    category: "liquidos",
  },
  {
    original: "Huevos",
    substitute: "Puré de manzana",
    ratio: 0.65,
    notes: "65g de puré por cada huevo (≈50g). Solo funciona como humectante, no como estructura.",
    category: "huevos",
  },
  {
    original: "Huevos",
    substitute: "Linaza molida + agua",
    ratio: 1.0,
    notes: "1 cda de linaza + 3 cdas de agua por huevo. Dejar reposar 5min. Para estructura.",
    category: "huevos",
  },
  {
    original: "Crema de leche",
    substitute: "Leche evaporada",
    ratio: 1.0,
    notes: "Sustitución 1:1. Menos grasa, textura similar. Ideal para cremas y ganaches.",
    category: "liquidos",
  },
  {
    original: "Crema de leche",
    substitute: "Leche de coco",
    ratio: 1.0,
    notes: "Sustitución 1:1. Aporta sabor tropical. Usar la versión espesa de lata.",
    category: "liquidos",
  },
  {
    original: "Harina de fuerza",
    substitute: "Harina todo uso + gluten vital",
    ratio: 1.0,
    notes: "Mismo peso de harina + 2% de gluten vital de trigo. Mejora la estructura.",
    category: "harinas",
  },
  {
    original: "Harina pastelera",
    substitute: "Harina todo uso + maicena",
    ratio: 1.0,
    notes: "85% harina todo uso + 15% maicena. Tamizar juntas 3 veces.",
    category: "harinas",
  },
  {
    original: "Chocolate 70%",
    substitute: "Cocoa + manteca de cacao + azúcar",
    ratio: 1.0,
    notes: "45% cocoa + 35% manteca de cacao + 20% azúcar del peso original.",
    category: "otros",
  },
  {
    original: "Queso crema",
    substitute: "Ricotta + crema",
    ratio: 1.0,
    notes: "80% ricotta + 20% crema de leche. Procesar hasta suavizar.",
    category: "lacteos",
  },
];

export function findSubstitutes(ingredientName: string): IngredientSubstitute[] {
  const normalizedName = ingredientName.toLowerCase().trim();
  return INGREDIENT_SUBSTITUTES.filter((sub) =>
    sub.original.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(sub.original.toLowerCase())
  );
}

export function findSubstituteFor(
  originalName: string,
  substituteName: string
): IngredientSubstitute | null {
  const normalizedOrig = originalName.toLowerCase().trim();
  const normalizedSub = substituteName.toLowerCase().trim();
  return (
    INGREDIENT_SUBSTITUTES.find(
      (sub) =>
        sub.original.toLowerCase().includes(normalizedOrig) &&
        sub.substitute.toLowerCase().includes(normalizedSub)
    ) ?? null
  );
}

export function calculateSubstituteAmount(
  originalGrams: number,
  ratio: number
): number {
  return Math.round(originalGrams * ratio * 10) / 10;
}

export function getSubstituteCategories(): string[] {
  return [...new Set(INGREDIENT_SUBSTITUTES.map((s) => s.category))];
}

export function getSubstitutesByCategory(category: string): IngredientSubstitute[] {
  return INGREDIENT_SUBSTITUTES.filter((s) => s.category === category);
}

import type { AreaType } from "@/types";

export interface FormulaIngredient {
  id: string;
  name: string;
  percentage: number;
  grams: number;
  isFlour: boolean;
  isLiquid: boolean;
  costPerKg: number;
  locked: "percentage" | "grams" | "none";
}

export interface FormulaResult {
  ingredients: CalculatedIngredient[];
  totalWeight: number;
  flourWeight: number;
  hydration: number;
  totalPercentage: number;
  totalCost: number;
  costPerUnit: number;
  weightPerUnit: number;
}

export interface CalculatedIngredient {
  id: string;
  name: string;
  percentage: number;
  grams: number;
  cost: number;
  isFlour: boolean;
  isLiquid: boolean;
}

export function calculateBakeryFormula(
  ingredients: FormulaIngredient[],
  targetPieces: number,
  targetWeightPerPiece: number
): FormulaResult {
  const totalDesiredWeight = targetPieces * targetWeightPerPiece;
  const totalPercentage = ingredients.reduce((sum, ing) => sum + ing.percentage, 0);

  if (totalPercentage === 0 || ingredients.length === 0) {
    return {
      ingredients: [],
      totalWeight: 0,
      flourWeight: 0,
      hydration: 0,
      totalPercentage: 0,
      totalCost: 0,
      costPerUnit: 0,
      weightPerUnit: 0,
    };
  }

  const flourWeight = (totalDesiredWeight * 100) / totalPercentage;

  const calculated: CalculatedIngredient[] = ingredients.map((ing) => {
    const grams = (ing.percentage / 100) * flourWeight;
    const cost = (grams / 1000) * ing.costPerKg;
    return {
      id: ing.id,
      name: ing.name,
      percentage: ing.percentage,
      grams: Math.round(grams * 10) / 10,
      cost: Math.round(cost * 100) / 100,
      isFlour: ing.isFlour,
      isLiquid: ing.isLiquid,
    };
  });

  const actualTotal = calculated.reduce((sum, c) => sum + c.grams, 0);
  const liquidGrams = calculated
    .filter((c) => c.isLiquid)
    .reduce((sum, c) => sum + c.grams, 0);
  const flourGrams = calculated
    .filter((c) => c.isFlour)
    .reduce((sum, c) => sum + c.grams, 0);
  const hydration = flourGrams > 0 ? Math.round((liquidGrams / flourGrams) * 100) : 0;
  const totalCost = calculated.reduce((sum, c) => sum + c.cost, 0);

  return {
    ingredients: calculated,
    totalWeight: Math.round(actualTotal * 10) / 10,
    flourWeight: Math.round(flourGrams * 10) / 10,
    hydration,
    totalPercentage,
    totalCost: Math.round(totalCost * 100) / 100,
    costPerUnit: targetPieces > 0 ? Math.round((totalCost / targetPieces) * 100) / 100 : 0,
    weightPerUnit: targetPieces > 0 ? Math.round((actualTotal / targetPieces) * 10) / 10 : 0,
  };
}

export function calculatePastryFormula(
  ingredients: FormulaIngredient[],
  targetPieces: number,
  targetWeightPerPiece: number
): FormulaResult {
  const totalDesiredWeight = targetPieces * targetWeightPerPiece;
  const totalPercentage = ingredients.reduce((sum, ing) => sum + ing.percentage, 0);

  if (totalPercentage === 0 || ingredients.length === 0) {
    return {
      ingredients: [],
      totalWeight: 0,
      flourWeight: 0,
      hydration: 0,
      totalPercentage: 0,
      totalCost: 0,
      costPerUnit: 0,
      weightPerUnit: 0,
    };
  }

  const calculated: CalculatedIngredient[] = ingredients.map((ing) => {
    const grams = (ing.percentage / totalPercentage) * totalDesiredWeight;
    const cost = (grams / 1000) * ing.costPerKg;
    return {
      id: ing.id,
      name: ing.name,
      percentage: ing.percentage,
      grams: Math.round(grams * 10) / 10,
      cost: Math.round(cost * 100) / 100,
      isFlour: ing.isFlour,
      isLiquid: ing.isLiquid,
    };
  });

  const actualTotal = calculated.reduce((sum, c) => sum + c.grams, 0);
  const totalCost = calculated.reduce((sum, c) => sum + c.cost, 0);

  return {
    ingredients: calculated,
    totalWeight: Math.round(actualTotal * 10) / 10,
    flourWeight: 0,
    hydration: 0,
    totalPercentage,
    totalCost: Math.round(totalCost * 100) / 100,
    costPerUnit: targetPieces > 0 ? Math.round((totalCost / targetPieces) * 100) / 100 : 0,
    weightPerUnit: targetPieces > 0 ? Math.round((actualTotal / targetPieces) * 10) / 10 : 0,
  };
}

export function calculateFormula(
  area: AreaType,
  ingredients: FormulaIngredient[],
  targetPieces: number,
  targetWeightPerPiece: number
): FormulaResult {
  if (area === "panaderia") {
    return calculateBakeryFormula(ingredients, targetPieces, targetWeightPerPiece);
  }
  return calculatePastryFormula(ingredients, targetPieces, targetWeightPerPiece);
}

export function recalcPercentagesFromGrams(
  ingredients: FormulaIngredient[],
  area: AreaType
): FormulaIngredient[] {
  if (area === "panaderia") {
    const flourGrams = ingredients
      .filter((i) => i.isFlour)
      .reduce((sum, i) => sum + i.grams, 0);
    if (flourGrams === 0) return ingredients;
    return ingredients.map((ing) => ({
      ...ing,
      percentage: Math.round((ing.grams / flourGrams) * 100 * 10) / 10,
    }));
  } else {
    const totalGrams = ingredients.reduce((sum, i) => sum + i.grams, 0);
    if (totalGrams === 0) return ingredients;
    return ingredients.map((ing) => ({
      ...ing,
      percentage: Math.round((ing.grams / totalGrams) * 100 * 10) / 10,
    }));
  }
}

export function createDefaultIngredient(_area: AreaType): FormulaIngredient {
  return {
    id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    percentage: 0,
    grams: 0,
    isFlour: false,
    isLiquid: false,
    costPerKg: 0,
    locked: "none",
  };
}

export function createFlourIngredient(): FormulaIngredient {
  return {
    id: `ing-${Date.now()}-flour`,
    name: "Harina",
    percentage: 100,
    grams: 0,
    isFlour: true,
    isLiquid: false,
    costPerKg: 1.5,
    locked: "none",
  };
}

export function createWaterIngredient(): FormulaIngredient {
  return {
    id: `ing-${Date.now()}-water`,
    name: "Agua",
    percentage: 65,
    grams: 0,
    isFlour: false,
    isLiquid: true,
    costPerKg: 0.01,
    locked: "none",
  };
}

export interface ProcessStep {
  id: string;
  description: string;
  duration: number;
  temperature?: number;
}

export function createDefaultStep(): ProcessStep {
  return {
    id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: "",
    duration: 0,
  };
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "-";
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
  }
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

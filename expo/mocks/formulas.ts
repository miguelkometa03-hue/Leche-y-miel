import type { AreaType } from "@/types";

export interface PrebuiltFormula {
  id: string;
  name: string;
  area: AreaType;
  category: string;
  description: string;
  ingredients: FormulaIngredientDef[];
  steps: FormulaStepDef[];
  hydration: number;
  bakingTemp: number;
  bakingTime: number;
  totalTime: number;
  difficulty: "basico" | "intermedio" | "avanzado";
}

export interface FormulaIngredientDef {
  name: string;
  percentage: number;
  isFlour: boolean;
  isLiquid: boolean;
  costPerKg: number;
  category: string;
}

export interface FormulaStepDef {
  description: string;
  duration: number;
  temperature?: number;
}

export const BREAD_FORMULAS: PrebuiltFormula[] = [
  {
    id: "bread-baguette",
    name: "Baguette Francesa",
    area: "panaderia",
    category: "Panes Clásicos",
    description: "Baguette tradicional con corteza crujiente y miga alveolada",
    hydration: 65,
    bakingTemp: 250,
    bakingTime: 25,
    totalTime: 305,
    difficulty: "intermedio",
    ingredients: [
      { name: "Harina T65", percentage: 100, isFlour: true, isLiquid: false, costPerKg: 1.50, category: "harinas" },
      { name: "Agua", percentage: 65, isFlour: false, isLiquid: true, costPerKg: 0.01, category: "liquidos" },
      { name: "Sal", percentage: 2, isFlour: false, isLiquid: false, costPerKg: 0.80, category: "condimentos" },
      { name: "Levadura fresca", percentage: 1.5, isFlour: false, isLiquid: false, costPerKg: 4.50, category: "fermentos" },
    ],
    steps: [
      { description: "Autólisis: mezclar harina y agua", duration: 30 },
      { description: "Incorporar sal y levadura, amasar en mojadora 8 min vel. 1, 4 min vel. 2", duration: 12 },
      { description: "Reposo en bloque con pliegues cada 30 min", duration: 120, temperature: 24 },
      { description: "División y pre-formado", duration: 5 },
      { description: "Reposo en mesa", duration: 20 },
      { description: "Formado final de baguettes", duration: 10 },
      { description: "Fermentación final en couche", duration: 90, temperature: 24 },
      { description: "Greñado y horneado con vapor", duration: 25, temperature: 250 },
    ],
  },
  {
    id: "bread-frances",
    name: "Pan Francés",
    area: "panaderia",
    category: "Panes Clásicos",
    description: "Pan francés de miga suave, ideal para acompañar",
    hydration: 60,
    bakingTemp: 220,
    bakingTime: 20,
    totalTime: 200,
    difficulty: "basico",
    ingredients: [
      { name: "Harina panadera", percentage: 100, isFlour: true, isLiquid: false, costPerKg: 1.20, category: "harinas" },
      { name: "Agua", percentage: 58, isFlour: false, isLiquid: true, costPerKg: 0.01, category: "liquidos" },
      { name: "Sal", percentage: 2, isFlour: false, isLiquid: false, costPerKg: 0.80, category: "condimentos" },
      { name: "Levadura fresca", percentage: 2.5, isFlour: false, isLiquid: false, costPerKg: 4.50, category: "fermentos" },
      { name: "Azúcar", percentage: 2, isFlour: false, isLiquid: false, costPerKg: 1.10, category: "azucares" },
      { name: "Manteca vegetal", percentage: 3, isFlour: false, isLiquid: false, costPerKg: 3.00, category: "grasas" },
    ],
    steps: [
      { description: "Mezclar ingredientes secos, agregar agua", duration: 5 },
      { description: "Amasado en mojadora: 10 min vel. 1, 5 min vel. 2", duration: 15 },
      { description: "Reposo en bloque", duration: 60, temperature: 26 },
      { description: "División, boleado y reposo intermedio", duration: 15 },
      { description: "Formado", duration: 10 },
      { description: "Fermentación final", duration: 75, temperature: 30 },
      { description: "Horneado con vapor inicial", duration: 20, temperature: 220 },
    ],
  },
  {
    id: "bread-brioche",
    name: "Brioche",
    area: "panaderia",
    category: "Masas Enriquecidas",
    description: "Pan de miga tierna y mantequillosa, ideal para bollería",
    hydration: 55,
    bakingTemp: 175,
    bakingTime: 22,
    totalTime: 720,
    difficulty: "avanzado",
    ingredients: [
      { name: "Harina de fuerza", percentage: 100, isFlour: true, isLiquid: false, costPerKg: 1.80, category: "harinas" },
      { name: "Huevos", percentage: 50, isFlour: false, isLiquid: true, costPerKg: 3.20, category: "huevos" },
      { name: "Mantequilla", percentage: 50, isFlour: false, isLiquid: false, costPerKg: 6.50, category: "grasas" },
      { name: "Azúcar", percentage: 12, isFlour: false, isLiquid: false, costPerKg: 1.10, category: "azucares" },
      { name: "Sal", percentage: 1.8, isFlour: false, isLiquid: false, costPerKg: 0.80, category: "condimentos" },
      { name: "Levadura fresca", percentage: 3, isFlour: false, isLiquid: false, costPerKg: 4.50, category: "fermentos" },
      { name: "Leche", percentage: 5, isFlour: false, isLiquid: true, costPerKg: 1.20, category: "liquidos" },
    ],
    steps: [
      { description: "Mezclar harina, huevos, azúcar, sal y levadura", duration: 5 },
      { description: "Amasar hasta desarrollo del gluten: 12 min vel. 1, 8 min vel. 2", duration: 20 },
      { description: "Incorporar mantequilla fría en cubos poco a poco", duration: 15 },
      { description: "Amasar hasta despegar de paredes", duration: 10 },
      { description: "Fermentación en bloque", duration: 90, temperature: 24 },
      { description: "Desgasificar, cubrir y refrigerar toda la noche", duration: 480, temperature: 4 },
      { description: "Formado y colocar en moldes", duration: 15 },
      { description: "Fermentación final", duration: 90, temperature: 26 },
      { description: "Barnizar con huevo y hornear", duration: 22, temperature: 175 },
    ],
  },
  {
    id: "bread-sourdough",
    name: "Pan de Masa Madre",
    area: "panaderia",
    category: "Masa Madre",
    description: "Pan artesanal con masa madre natural, fermentación larga",
    hydration: 75,
    bakingTemp: 245,
    bakingTime: 40,
    totalTime: 1440,
    difficulty: "avanzado",
    ingredients: [
      { name: "Harina de fuerza", percentage: 80, isFlour: true, isLiquid: false, costPerKg: 1.80, category: "harinas" },
      { name: "Harina integral", percentage: 20, isFlour: true, isLiquid: false, costPerKg: 1.60, category: "harinas" },
      { name: "Agua", percentage: 75, isFlour: false, isLiquid: true, costPerKg: 0.01, category: "liquidos" },
      { name: "Masa madre activa", percentage: 20, isFlour: false, isLiquid: false, costPerKg: 0.50, category: "fermentos" },
      { name: "Sal", percentage: 2, isFlour: false, isLiquid: false, costPerKg: 0.80, category: "condimentos" },
    ],
    steps: [
      { description: "Autólisis: mezclar harinas y agua", duration: 60 },
      { description: "Agregar masa madre y sal, mezclar", duration: 10 },
      { description: "Series de pliegues cada 30 min (4 series)", duration: 120, temperature: 24 },
      { description: "Fermentación en bloque hasta +50% volumen", duration: 180, temperature: 24 },
      { description: "Pre-formado y reposo en mesa", duration: 25 },
      { description: "Formado final, colocar en banneton", duration: 10 },
      { description: "Retardo en frío", duration: 720, temperature: 4 },
      { description: "Hornear en olla de hierro: 20 min tapado + 20 min destapado", duration: 40, temperature: 245 },
    ],
  },
  {
    id: "bread-ciabatta",
    name: "Ciabatta",
    area: "panaderia",
    category: "Panes Clásicos",
    description: "Pan italiano de alta hidratación con miga abierta",
    hydration: 80,
    bakingTemp: 230,
    bakingTime: 22,
    totalTime: 280,
    difficulty: "intermedio",
    ingredients: [
      { name: "Harina de fuerza", percentage: 100, isFlour: true, isLiquid: false, costPerKg: 1.80, category: "harinas" },
      { name: "Agua", percentage: 80, isFlour: false, isLiquid: true, costPerKg: 0.01, category: "liquidos" },
      { name: "Sal", percentage: 2, isFlour: false, isLiquid: false, costPerKg: 0.80, category: "condimentos" },
      { name: "Levadura fresca", percentage: 1, isFlour: false, isLiquid: false, costPerKg: 4.50, category: "fermentos" },
      { name: "Aceite de oliva", percentage: 3, isFlour: false, isLiquid: false, costPerKg: 8.00, category: "grasas" },
    ],
    steps: [
      { description: "Mezclar harina, agua y levadura", duration: 5 },
      { description: "Reposo 20 min, luego agregar sal y aceite", duration: 25 },
      { description: "Pliegues en bowl cada 30 min (3 series)", duration: 90, temperature: 24 },
      { description: "Fermentación en bloque", duration: 90, temperature: 24 },
      { description: "Volcar sobre mesa enharinada, cortar con rasqueta", duration: 10 },
      { description: "Reposo breve", duration: 15 },
      { description: "Estirar suavemente y transferir a horno", duration: 5 },
      { description: "Horneado con vapor", duration: 22, temperature: 230 },
    ],
  },
  {
    id: "bread-croissant",
    name: "Croissant",
    area: "panaderia",
    category: "Masas Laminadas",
    description: "Croissant clásico con laminado de mantequilla",
    hydration: 52,
    bakingTemp: 190,
    bakingTime: 18,
    totalTime: 960,
    difficulty: "avanzado",
    ingredients: [
      { name: "Harina de fuerza", percentage: 100, isFlour: true, isLiquid: false, costPerKg: 1.80, category: "harinas" },
      { name: "Leche", percentage: 48, isFlour: false, isLiquid: true, costPerKg: 1.20, category: "liquidos" },
      { name: "Azúcar", percentage: 10, isFlour: false, isLiquid: false, costPerKg: 1.10, category: "azucares" },
      { name: "Sal", percentage: 1.8, isFlour: false, isLiquid: false, costPerKg: 0.80, category: "condimentos" },
      { name: "Levadura fresca", percentage: 3, isFlour: false, isLiquid: false, costPerKg: 4.50, category: "fermentos" },
      { name: "Mantequilla (masa)", percentage: 8, isFlour: false, isLiquid: false, costPerKg: 6.50, category: "grasas" },
      { name: "Mantequilla (empaste)", percentage: 40, isFlour: false, isLiquid: false, costPerKg: 6.50, category: "grasas" },
    ],
    steps: [
      { description: "Mezclar ingredientes de la masa (excepto mantequilla empaste)", duration: 15 },
      { description: "Amasar hasta desarrollo medio del gluten", duration: 10 },
      { description: "Refrigerar masa en rectángulo", duration: 120, temperature: 4 },
      { description: "Preparar bloque de mantequilla empaste", duration: 10 },
      { description: "Primer giro simple", duration: 15 },
      { description: "Refrigerar 30 min", duration: 30, temperature: 4 },
      { description: "Segundo giro simple", duration: 15 },
      { description: "Refrigerar 30 min", duration: 30, temperature: 4 },
      { description: "Tercer giro simple", duration: 15 },
      { description: "Refrigerar mínimo 2h o toda la noche", duration: 480, temperature: 4 },
      { description: "Estirar, cortar triángulos y formar croissants", duration: 20 },
      { description: "Fermentación final", duration: 150, temperature: 26 },
      { description: "Barnizar con huevo y hornear", duration: 18, temperature: 190 },
    ],
  },
];

export const PASTRY_FORMULAS: PrebuiltFormula[] = [
  {
    id: "pastry-bizcocho",
    name: "Bizcocho Genovés",
    area: "pasteleria",
    category: "Bizcochos",
    description: "Bizcocho base esponjoso, ideal para tartas de capas",
    hydration: 0,
    bakingTemp: 180,
    bakingTime: 30,
    totalTime: 65,
    difficulty: "basico",
    ingredients: [
      { name: "Harina pastelera", percentage: 100, isFlour: true, isLiquid: false, costPerKg: 1.40, category: "harinas" },
      { name: "Huevos", percentage: 167, isFlour: false, isLiquid: true, costPerKg: 3.20, category: "huevos" },
      { name: "Azúcar", percentage: 100, isFlour: false, isLiquid: false, costPerKg: 1.10, category: "azucares" },
      { name: "Mantequilla clarificada", percentage: 33, isFlour: false, isLiquid: false, costPerKg: 7.00, category: "grasas" },
    ],
    steps: [
      { description: "Batir huevos y azúcar a baño maría hasta 40°C", duration: 8, temperature: 40 },
      { description: "Batir en batidora hasta triplicar volumen (punto letra)", duration: 10 },
      { description: "Tamizar e incorporar harina con movimientos envolventes", duration: 5 },
      { description: "Incorporar mantequilla clarificada tibia", duration: 3 },
      { description: "Verter en molde engrasado y enharinado", duration: 2 },
      { description: "Hornear sin abrir el horno los primeros 20 min", duration: 30, temperature: 180 },
      { description: "Desmoldar tibio y enfriar en rejilla", duration: 30 },
    ],
  },
  {
    id: "pastry-crema-pastelera",
    name: "Crema Pastelera",
    area: "pasteleria",
    category: "Cremas",
    description: "Crema base para rellenos, profiteroles y tartas",
    hydration: 0,
    bakingTemp: 0,
    bakingTime: 0,
    totalTime: 75,
    difficulty: "basico",
    ingredients: [
      { name: "Leche entera", percentage: 100, isFlour: false, isLiquid: true, costPerKg: 1.20, category: "liquidos" },
      { name: "Yemas de huevo", percentage: 12, isFlour: false, isLiquid: false, costPerKg: 6.00, category: "huevos" },
      { name: "Azúcar", percentage: 20, isFlour: false, isLiquid: false, costPerKg: 1.10, category: "azucares" },
      { name: "Maicena", percentage: 6, isFlour: true, isLiquid: false, costPerKg: 2.50, category: "harinas" },
      { name: "Vainilla", percentage: 0.5, isFlour: false, isLiquid: false, costPerKg: 40.00, category: "condimentos" },
      { name: "Mantequilla", percentage: 5, isFlour: false, isLiquid: false, costPerKg: 6.50, category: "grasas" },
    ],
    steps: [
      { description: "Hervir leche con mitad del azúcar y vainilla", duration: 8 },
      { description: "Blanquear yemas con resto de azúcar y maicena", duration: 5 },
      { description: "Temperar yemas con leche caliente", duration: 3 },
      { description: "Cocinar a fuego medio sin dejar de mover hasta espesar", duration: 5 },
      { description: "Retirar del fuego, agregar mantequilla", duration: 2 },
      { description: "Cubrir con film al contacto y enfriar", duration: 60, temperature: 4 },
    ],
  },
  {
    id: "pastry-ganache",
    name: "Ganache de Chocolate",
    area: "pasteleria",
    category: "Cremas",
    description: "Ganache versátil para coberturas, rellenos y trufas",
    hydration: 0,
    bakingTemp: 0,
    bakingTime: 0,
    totalTime: 130,
    difficulty: "basico",
    ingredients: [
      { name: "Chocolate 70%", percentage: 100, isFlour: false, isLiquid: false, costPerKg: 12.00, category: "otros" },
      { name: "Crema de leche 35%", percentage: 100, isFlour: false, isLiquid: true, costPerKg: 4.50, category: "liquidos" },
      { name: "Mantequilla", percentage: 10, isFlour: false, isLiquid: false, costPerKg: 6.50, category: "grasas" },
    ],
    steps: [
      { description: "Picar chocolate finamente", duration: 5 },
      { description: "Calentar crema hasta punto de ebullición", duration: 5 },
      { description: "Verter crema sobre chocolate, dejar reposar 1 min", duration: 2 },
      { description: "Emulsionar desde el centro hacia afuera", duration: 5 },
      { description: "Agregar mantequilla a 35°C y mezclar", duration: 3 },
      { description: "Cubrir con film y cristalizar", duration: 120, temperature: 18 },
    ],
  },
  {
    id: "pastry-tarta-queso",
    name: "Tarta de Queso NY",
    area: "pasteleria",
    category: "Tartas",
    description: "Cheesecake estilo New York, cremosa y densa",
    hydration: 0,
    bakingTemp: 160,
    bakingTime: 60,
    totalTime: 360,
    difficulty: "intermedio",
    ingredients: [
      { name: "Queso crema", percentage: 100, isFlour: false, isLiquid: false, costPerKg: 8.00, category: "lacteos" },
      { name: "Azúcar", percentage: 25, isFlour: false, isLiquid: false, costPerKg: 1.10, category: "azucares" },
      { name: "Huevos", percentage: 30, isFlour: false, isLiquid: true, costPerKg: 3.20, category: "huevos" },
      { name: "Crema de leche", percentage: 20, isFlour: false, isLiquid: true, costPerKg: 4.50, category: "liquidos" },
      { name: "Harina", percentage: 3, isFlour: true, isLiquid: false, costPerKg: 1.40, category: "harinas" },
      { name: "Vainilla", percentage: 0.5, isFlour: false, isLiquid: false, costPerKg: 40.00, category: "condimentos" },
      { name: "Galletas (base)", percentage: 20, isFlour: false, isLiquid: false, costPerKg: 3.50, category: "otros" },
      { name: "Mantequilla (base)", percentage: 10, isFlour: false, isLiquid: false, costPerKg: 6.50, category: "grasas" },
    ],
    steps: [
      { description: "Triturar galletas y mezclar con mantequilla derretida", duration: 10 },
      { description: "Cubrir fondo de molde y refrigerar 30 min", duration: 35, temperature: 4 },
      { description: "Batir queso crema hasta suavizar", duration: 5 },
      { description: "Agregar azúcar y batir, luego huevos uno a uno", duration: 10 },
      { description: "Incorporar crema, harina y vainilla", duration: 5 },
      { description: "Verter sobre base y hornear a baño maría", duration: 60, temperature: 160 },
      { description: "Apagar horno y dejar dentro 1h con puerta entreabierta", duration: 60 },
      { description: "Refrigerar mínimo 4h", duration: 240, temperature: 4 },
    ],
  },
  {
    id: "pastry-merengue-suizo",
    name: "Merengue Suizo",
    area: "pasteleria",
    category: "Merengues",
    description: "Merengue estable y sedoso para decoraciones y rellenos",
    hydration: 0,
    bakingTemp: 0,
    bakingTime: 0,
    totalTime: 25,
    difficulty: "basico",
    ingredients: [
      { name: "Claras de huevo", percentage: 100, isFlour: false, isLiquid: true, costPerKg: 5.00, category: "huevos" },
      { name: "Azúcar", percentage: 200, isFlour: false, isLiquid: false, costPerKg: 1.10, category: "azucares" },
    ],
    steps: [
      { description: "Colocar claras y azúcar en bowl a baño maría", duration: 8, temperature: 60 },
      { description: "Mezclar constantemente hasta que azúcar se disuelva (60°C)", duration: 5 },
      { description: "Transferir a batidora y batir a velocidad alta hasta enfriar", duration: 12 },
    ],
  },
  {
    id: "pastry-masa-quebrada",
    name: "Masa Quebrada (Sablée)",
    area: "pasteleria",
    category: "Masas Base",
    description: "Masa arenosa y mantecosa para tartas y tartaletas",
    hydration: 0,
    bakingTemp: 170,
    bakingTime: 20,
    totalTime: 110,
    difficulty: "basico",
    ingredients: [
      { name: "Harina pastelera", percentage: 100, isFlour: true, isLiquid: false, costPerKg: 1.40, category: "harinas" },
      { name: "Mantequilla fría", percentage: 60, isFlour: false, isLiquid: false, costPerKg: 6.50, category: "grasas" },
      { name: "Azúcar glass", percentage: 40, isFlour: false, isLiquid: false, costPerKg: 1.80, category: "azucares" },
      { name: "Yemas", percentage: 20, isFlour: false, isLiquid: true, costPerKg: 6.00, category: "huevos" },
      { name: "Sal", percentage: 0.5, isFlour: false, isLiquid: false, costPerKg: 0.80, category: "condimentos" },
    ],
    steps: [
      { description: "Cremar mantequilla con azúcar glass sin batir en exceso", duration: 5 },
      { description: "Agregar yemas y sal, mezclar brevemente", duration: 3 },
      { description: "Incorporar harina de golpe, mezclar hasta unir (no amasar)", duration: 3 },
      { description: "Envolver en film y refrigerar mínimo 1h", duration: 60, temperature: 4 },
      { description: "Estirar entre papeles encerados a 3mm", duration: 10 },
      { description: "Forrar molde, pinchar con tenedor, refrigerar 15 min", duration: 20, temperature: 4 },
      { description: "Hornear en blanco con peso", duration: 20, temperature: 170 },
    ],
  },
];

export const ALL_FORMULAS = [...BREAD_FORMULAS, ...PASTRY_FORMULAS];

export const BREAD_CATEGORIES = [...new Set(BREAD_FORMULAS.map((f) => f.category))];
export const PASTRY_CATEGORIES = [...new Set(PASTRY_FORMULAS.map((f) => f.category))];

export function getFormulasByArea(area: AreaType): PrebuiltFormula[] {
  return area === "panaderia" ? BREAD_FORMULAS : PASTRY_FORMULAS;
}

export function calculateFormula(
  formula: PrebuiltFormula,
  totalFlourWeight: number
): { name: string; grams: number; percentage: number; cost: number; isFlour: boolean; isLiquid: boolean }[] {
  return formula.ingredients.map((ing) => {
    const grams = (ing.percentage / 100) * totalFlourWeight;
    return {
      name: ing.name,
      grams: Math.round(grams * 10) / 10,
      percentage: ing.percentage,
      cost: (grams / 1000) * ing.costPerKg,
      isFlour: ing.isFlour,
      isLiquid: ing.isLiquid,
    };
  });
}

export function scaleFormulaByTotalWeight(
  formula: PrebuiltFormula,
  desiredTotalWeight: number
): { name: string; grams: number; percentage: number; cost: number; isFlour: boolean; isLiquid: boolean }[] {
  const totalPercentage = formula.ingredients.reduce((acc, ing) => acc + ing.percentage, 0);
  const flourWeight = (desiredTotalWeight / totalPercentage) * 100;
  return calculateFormula(formula, flourWeight);
}

export function getDifficultyLabel(d: string): string {
  switch (d) {
    case "basico": return "Básico";
    case "intermedio": return "Intermedio";
    case "avanzado": return "Avanzado";
    default: return d;
  }
}

export function formatDuration(minutes: number): string {
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

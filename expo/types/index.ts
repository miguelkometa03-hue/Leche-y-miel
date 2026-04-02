export type AreaType = "panaderia" | "pasteleria";

export interface SavedFormula {
  id: string;
  name: string;
  area: AreaType;
  description: string;
  ingredients: SavedIngredient[];
  steps: SavedStep[];
  pieces: number;
  weightPerPiece: number;
  hydration: number;
  totalWeight: number;
  totalCost: number;
  costPerUnit: number;
  isFavorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedIngredient {
  id: string;
  name: string;
  percentage: number;
  grams: number;
  cost: number;
  isFlour: boolean;
  isLiquid: boolean;
  costPerKg: number;
}

export interface SavedStep {
  id: string;
  description: string;
  duration: number;
  temperature?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  specialty?: string;
  location?: string;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  images: string[];
  isHelpRequest: boolean;
  likes: number;
  comments: PostComment[];
  createdAt: string;
}

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

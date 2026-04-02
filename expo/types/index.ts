export type AreaType = "panaderia" | "pasteleria";

export type SubscriptionTier = "free" | "pro" | "premium";

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  specialty?: string;
  location?: string;
  phone?: string;
  website?: string;
  professionalTitle?: string;
  yearsExperience?: number;
  certifications?: string[];
  portfolio?: PortfolioItem[];
  socialLinks?: SocialLink[];
  subscription: SubscriptionTier;
  createdAt: string;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export type ReactionType = "like" | "fire" | "bread" | "star" | "clap";

export interface Reaction {
  type: ReactionType;
  count: number;
  userReacted: boolean;
}

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
  profitMargin: number;
  isFavorite: boolean;
  isPublic: boolean;
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
  authorTitle?: string;
  content: string;
  images: string[];
  isHelpRequest: boolean;
  postType: "trabajo" | "ayuda" | "logro" | "receta";
  reactions: Reaction[];
  comments: PostComment[];
  createdAt: string;
}

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  likes: number;
  createdAt: string;
}

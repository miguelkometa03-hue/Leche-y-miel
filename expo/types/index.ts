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
  followers: string[];
  following: string[];
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
  imageUrl?: string;
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

export interface Notification {
  id: string;
  type: "follow" | "reaction" | "comment" | "mention";
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  message: string;
  targetId?: string;
  read: boolean;
  createdAt: string;
}

export interface ProductionPlanItem {
  id: string;
  formulaId: string;
  formulaName: string;
  area: AreaType;
  date: string;
  pieces: number;
  weightPerPiece: number;
  totalWeight: number;
  totalCost: number;
  status: "pendiente" | "en_proceso" | "completado";
  notes?: string;
  createdAt: string;
}

export interface PriceHistoryEntry {
  id: string;
  ingredientName: string;
  costPerKg: number;
  date: string;
  note?: string;
}

export interface ProductionHistoryEntry {
  id: string;
  formulaId: string;
  formulaName: string;
  date: string;
  pieces: number;
  totalCost: number;
  totalWeight: number;
  revenue?: number;
}

export interface IngredientSubstitute {
  original: string;
  substitute: string;
  ratio: number;
  notes: string;
  category: string;
}

export interface CommunityFormula {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  formula: SavedFormula;
  likes: number;
  downloads: number;
  userLiked: boolean;
  createdAt: string;
}

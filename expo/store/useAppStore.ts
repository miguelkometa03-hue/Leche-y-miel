// store/useAppStore.ts
// Versión actualizada con soporte para:
//   - geminiApiKey: clave de la API de Gemini guardada persistentemente
//   - geminiModel: modelo de Gemini seleccionado por el usuario
//   - appTheme: tema visual de la app (trigo | cacao | nieve)

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  SavedFormula,
  FeedPost,
  UserProfile,
  AreaType,
  SubscriptionTier,
  ReactionType,
  PostComment,
  Reaction,
  Notification,
  ProductionPlanItem,
  PriceHistoryEntry,
  ProductionHistoryEntry,
  CommunityFormula,
} from "@/types";
import type { CurrencyCode } from "@/constants/appConfig";
import type { FormulaIngredient, ProcessStep } from "@/utils/formulaEngine";
import type { AppTheme } from "@/constants/colors";

export interface LabDraft {
  formulaName: string;
  area: AreaType;
  ingredients: FormulaIngredient[];
  pieces: string;
  weightPerPiece: string;
  steps: ProcessStep[];
  editingFormulaId: string | null;
  timestamp: number;
}

// Modelos disponibles de Gemini
export const GEMINI_MODELS = [
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Rápido, gratis)" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Más inteligente)" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Nuevo)" },
] as const;

export type GeminiModelId = typeof GEMINI_MODELS[number]["id"];

function createDefaultReactions(): Reaction[] {
  return [
    { type: "like", count: 0, userReacted: false },
    { type: "fire", count: 0, userReacted: false },
    { type: "bread", count: 0, userReacted: false },
    { type: "clap", count: 0, userReacted: false },
  ];
}

interface AppState {
  // ── Perfil de usuario ──────────────────────────────────────────────────────
  userProfile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;

  // ── Suscripción ────────────────────────────────────────────────────────────
  subscription: SubscriptionTier;
  setSubscription: (tier: SubscriptionTier) => void;

  // ── Moneda ─────────────────────────────────────────────────────────────────
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;

  // ── NUEVO: Configuración de IA ─────────────────────────────────────────────
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  geminiModel: GeminiModelId;
  setGeminiModel: (model: GeminiModelId) => void;

  // ── NUEVO: Tema visual ─────────────────────────────────────────────────────
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;

  // ── Fórmulas ───────────────────────────────────────────────────────────────
  formulas: SavedFormula[];
  addFormula: (formula: SavedFormula) => void;
  updateFormula: (id: string, updates: Partial<SavedFormula>) => void;
  deleteFormula: (id: string) => void;
  duplicateFormula: (id: string) => string;
  toggleFavorite: (id: string) => void;

  // ── Feed / Posts ───────────────────────────────────────────────────────────
  posts: FeedPost[];
  addPost: (post: FeedPost) => void;
  reactToPost: (postId: string, reactionType: ReactionType) => void;
  addComment: (postId: string, comment: PostComment) => void;
  likeComment: (postId: string, commentId: string) => void;

  // ── Estado activo ──────────────────────────────────────────────────────────
  activeArea: AreaType;
  setActiveArea: (area: AreaType) => void;

  labDraft: LabDraft | null;
  setLabDraft: (draft: LabDraft | null) => void;

  // ── Notificaciones ─────────────────────────────────────────────────────────
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // ── Planificador de producción ─────────────────────────────────────────────
  productionPlan: ProductionPlanItem[];
  addProductionItem: (item: ProductionPlanItem) => void;
  updateProductionItem: (id: string, updates: Partial<ProductionPlanItem>) => void;
  deleteProductionItem: (id: string) => void;

  // ── Historial de precios ───────────────────────────────────────────────────
  priceHistory: PriceHistoryEntry[];
  addPriceEntry: (entry: PriceHistoryEntry) => void;

  // ── Historial de producción ────────────────────────────────────────────────
  productionHistory: ProductionHistoryEntry[];
  addProductionHistory: (entry: ProductionHistoryEntry) => void;

  // ── Fórmulas de la comunidad ───────────────────────────────────────────────
  communityFormulas: CommunityFormula[];
  addCommunityFormula: (cf: CommunityFormula) => void;
  likeCommunityFormula: (id: string) => void;
  downloadCommunityFormula: (id: string) => void;

  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;

  user: UserProfile;
  setUser: (user: UserProfile | null) => void;
  likePost: (id: string) => void;
}

const defaultProfile: UserProfile = {
  id: "user-1",
  name: "Panadero",
  email: "user@pastrypro.app",
  avatar: "https://i.pravatar.cc/150?u=juan",
  bio: "Panadero artesanal apasionado por la fermentación natural",
  specialty: "Panadería Artesanal",
  location: "Mi ciudad",
  phone: "",
  website: "",
  professionalTitle: "Maestro Panadero",
  yearsExperience: 5,
  certifications: ["Panadería Artesanal", "Masa Madre"],
  portfolio: [],
  socialLinks: [],
  subscription: "free",
  followers: [],
  following: [],
  createdAt: new Date().toISOString(),
};

const initialFormulas: SavedFormula[] = [
  {
    id: "demo-baguette",
    name: "Baguette Francesa",
    area: "panaderia",
    description: "Baguette tradicional con corteza crujiente y miga alveolada",
    ingredients: [
      { id: "i1", name: "Harina T65", percentage: 100, grams: 594, cost: 0.89, isFlour: true, isLiquid: false, costPerKg: 1.5 },
      { id: "i2", name: "Agua", percentage: 65, grams: 386.1, cost: 0, isFlour: false, isLiquid: true, costPerKg: 0.01 },
      { id: "i3", name: "Sal", percentage: 2, grams: 11.9, cost: 0.01, isFlour: false, isLiquid: false, costPerKg: 0.8 },
      { id: "i4", name: "Levadura fresca", percentage: 1.5, grams: 8.9, cost: 0.04, isFlour: false, isLiquid: false, costPerKg: 4.5 },
    ],
    steps: [
      { id: "s1", description: "Autólisis: mezclar harina y agua", duration: 30 },
      { id: "s2", description: "Incorporar sal y levadura, amasar 12 min", duration: 12 },
      { id: "s3", description: "Reposo en bloque con pliegues cada 30 min", duration: 120, temperature: 24 },
      { id: "s4", description: "División, pre-formado, reposo", duration: 25 },
      { id: "s5", description: "Formado final + fermentación en couche", duration: 90, temperature: 24 },
      { id: "s6", description: "Greñado y horneado con vapor", duration: 25, temperature: 250 },
    ],
    pieces: 4,
    weightPerPiece: 250,
    hydration: 65,
    totalWeight: 1000,
    totalCost: 0.94,
    costPerUnit: 0.24,
    profitMargin: 2.5,
    isFavorite: true,
    isPublic: false,
    tags: ["clásico", "francés"],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const initialPosts: FeedPost[] = [
  {
    id: "p1",
    authorId: "user-2",
    authorName: "María Repostera",
    authorAvatar: "https://i.pravatar.cc/150?u=maria",
    authorTitle: "Chef Pastelera · 8 años",
    content: "¡Mi primera baguette con masa madre! 48h de fermentación fría. La miga quedó increíble 🥖",
    images: [],
    isHelpRequest: false,
    postType: "trabajo",
    reactions: [
      { type: "like", count: 32, userReacted: false },
      { type: "fire", count: 15, userReacted: false },
      { type: "bread", count: 8, userReacted: false },
      { type: "clap", count: 5, userReacted: false },
    ],
    comments: [],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const initialNotifications: Notification[] = [
  {
    id: "n1",
    type: "follow",
    fromUserId: "user-3",
    fromUserName: "Carlos Artesano",
    fromUserAvatar: "https://i.pravatar.cc/150?u=carlos",
    message: "comenzó a seguirte",
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userProfile: defaultProfile,
      updateProfile: (updates) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...updates },
        })),

      subscription: "free" as SubscriptionTier,
      setSubscription: (tier) => set({ subscription: tier }),

      currency: "USD" as CurrencyCode,
      setCurrency: (currency) => set({ currency }),

      // ── Configuración IA ─────────────────────────────────────────────────
      geminiApiKey: "",
      setGeminiApiKey: (key) => set({ geminiApiKey: key.trim() }),

      geminiModel: "gemini-1.5-flash" as GeminiModelId,
      setGeminiModel: (model) => set({ geminiModel: model }),

      // ── Tema ─────────────────────────────────────────────────────────────
      appTheme: "trigo" as AppTheme,
      setAppTheme: (theme) => set({ appTheme: theme }),

      // ── Fórmulas ─────────────────────────────────────────────────────────
      formulas: initialFormulas,
      addFormula: (formula) =>
        set((state) => ({ formulas: [formula, ...state.formulas] })),
      updateFormula: (id, updates) =>
        set((state) => ({
          formulas: state.formulas.map((f) =>
            f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
          ),
        })),
      deleteFormula: (id) =>
        set((state) => ({
          formulas: state.formulas.filter((f) => f.id !== id),
        })),
      duplicateFormula: (id) => {
        const formula = get().formulas.find((f) => f.id === id);
        if (!formula) return "";
        const newId = `formula-${Date.now()}`;
        const duplicate: SavedFormula = {
          ...formula,
          id: newId,
          name: `${formula.name} (copia)`,
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ formulas: [duplicate, ...state.formulas] }));
        return newId;
      },
      toggleFavorite: (id) =>
        set((state) => ({
          formulas: state.formulas.map((f) =>
            f.id === id ? { ...f, isFavorite: !f.isFavorite } : f
          ),
        })),

      posts: initialPosts,
      addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
      reactToPost: (postId, reactionType) =>
        set((state) => ({
          posts: state.posts.map((p) => {
            if (p.id !== postId) return p;
            const reactions = (p.reactions ?? createDefaultReactions()).map((r) => {
              if (r.type !== reactionType) return r;
              return {
                ...r,
                count: r.userReacted ? r.count - 1 : r.count + 1,
                userReacted: !r.userReacted,
              };
            });
            return { ...p, reactions };
          }),
        })),
      addComment: (postId, comment) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
          ),
        })),
      likeComment: (postId, commentId) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === commentId ? { ...c, likes: c.likes + 1 } : c
                  ),
                }
              : p
          ),
        })),

      activeArea: "panaderia",
      setActiveArea: (area) => set({ activeArea: area }),

      labDraft: null,
      setLabDraft: (draft) => set({ labDraft: draft }),

      notifications: initialNotifications,
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      productionPlan: [],
      addProductionItem: (item) =>
        set((state) => ({ productionPlan: [...state.productionPlan, item] })),
      updateProductionItem: (id, updates) =>
        set((state) => ({
          productionPlan: state.productionPlan.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deleteProductionItem: (id) =>
        set((state) => ({
          productionPlan: state.productionPlan.filter((p) => p.id !== id),
        })),

      priceHistory: [],
      addPriceEntry: (entry) =>
        set((state) => ({ priceHistory: [...state.priceHistory, entry] })),

      productionHistory: [],
      addProductionHistory: (entry) =>
        set((state) => ({
          productionHistory: [entry, ...state.productionHistory],
        })),

      communityFormulas: [],
      addCommunityFormula: (cf) =>
        set((state) => ({
          communityFormulas: [cf, ...state.communityFormulas],
        })),
      likeCommunityFormula: (id) =>
        set((state) => ({
          communityFormulas: state.communityFormulas.map((cf) =>
            cf.id === id
              ? {
                  ...cf,
                  likes: cf.userLiked ? cf.likes - 1 : cf.likes + 1,
                  userLiked: !cf.userLiked,
                }
              : cf
          ),
        })),
      downloadCommunityFormula: (id) =>
        set((state) => ({
          communityFormulas: state.communityFormulas.map((cf) =>
            cf.id === id ? { ...cf, downloads: cf.downloads + 1 } : cf
          ),
        })),

      followUser: (userId) =>
        set((state) => {
          const following = state.userProfile.following ?? [];
          if (following.includes(userId)) return state;
          return {
            userProfile: { ...state.userProfile, following: [...following, userId] },
          };
        }),
      unfollowUser: (userId) =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            following: (state.userProfile.following ?? []).filter((id) => id !== userId),
          },
        })),

      get user() {
        return get().userProfile;
      },
      setUser: (user) => {
        if (user) set((state) => ({ userProfile: { ...state.userProfile, ...user } }));
      },
      likePost: (id) => get().reactToPost(id, "like"),
    }),
    {
      name: "pastrypro-v6",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        formulas: state.formulas,
        userProfile: state.userProfile,
        subscription: state.subscription,
        activeArea: state.activeArea,
        currency: state.currency,
        labDraft: state.labDraft,
        posts: state.posts,
        notifications: state.notifications,
        productionPlan: state.productionPlan,
        priceHistory: state.priceHistory,
        productionHistory: state.productionHistory,
        communityFormulas: state.communityFormulas,
        // Nuevos campos persistentes
        geminiApiKey: state.geminiApiKey,
        geminiModel: state.geminiModel,
        appTheme: state.appTheme,
      }),
    }
  )
);

export default useAppStore;

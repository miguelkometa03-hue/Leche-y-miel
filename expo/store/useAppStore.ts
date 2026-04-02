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
} from "@/types";
import type { CurrencyCode } from "@/constants/appConfig";
import type { FormulaIngredient, ProcessStep } from "@/utils/formulaEngine";

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

function createDefaultReactions(): Reaction[] {
  return [
    { type: "like", count: 0, userReacted: false },
    { type: "fire", count: 0, userReacted: false },
    { type: "bread", count: 0, userReacted: false },
    { type: "clap", count: 0, userReacted: false },
  ];
}

interface AppState {
  userProfile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;

  subscription: SubscriptionTier;
  setSubscription: (tier: SubscriptionTier) => void;

  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;

  formulas: SavedFormula[];
  addFormula: (formula: SavedFormula) => void;
  updateFormula: (id: string, updates: Partial<SavedFormula>) => void;
  deleteFormula: (id: string) => void;
  duplicateFormula: (id: string) => string;
  toggleFavorite: (id: string) => void;

  posts: FeedPost[];
  addPost: (post: FeedPost) => void;
  reactToPost: (postId: string, reactionType: ReactionType) => void;
  addComment: (postId: string, comment: PostComment) => void;
  likeComment: (postId: string, commentId: string) => void;

  activeArea: AreaType;
  setActiveArea: (area: AreaType) => void;

  labDraft: LabDraft | null;
  setLabDraft: (draft: LabDraft | null) => void;

  // compat shims
  user: UserProfile;
  setUser: (user: UserProfile | null) => void;
  likePost: (id: string) => void;
}

const defaultProfile: UserProfile = {
  id: "user-1",
  name: "Panadero",
  email: "user@lecheymiel.app",
  avatar: "https://i.pravatar.cc/150?u=juan",
  bio: "Panadero artesanal apasionado por la fermentación natural",
  specialty: "Panadería Artesanal",
  location: "Mi ciudad",
  phone: "",
  website: "",
  professionalTitle: "Maestro Panadero",
  yearsExperience: 5,
  certifications: ["Panadería Artesanal", "Masa Madre"],
  portfolio: [
    {
      id: "p1",
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
      title: "Baguettes artesanales",
      description: "Fermentación de 48h con masa madre",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: "p2",
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=400",
      title: "Pan de masa madre",
      description: "Corteza caramelizada perfecta",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ],
  socialLinks: [],
  subscription: "free",
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
      { id: "s2", description: "Incorporar sal y levadura, amasar 8 min vel. 1, 4 min vel. 2", duration: 12 },
      { id: "s3", description: "Reposo en bloque con pliegues cada 30 min", duration: 120, temperature: 24 },
      { id: "s4", description: "División y pre-formado", duration: 5 },
      { id: "s5", description: "Reposo en mesa", duration: 20 },
      { id: "s6", description: "Formado final de baguettes", duration: 10 },
      { id: "s7", description: "Fermentación final en couche", duration: 90, temperature: 24 },
      { id: "s8", description: "Greñado y horneado con vapor", duration: 25, temperature: 250 },
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
  {
    id: "demo-bizcocho",
    name: "Bizcocho Genovés",
    area: "pasteleria",
    description: "Bizcocho base esponjoso para tartas de capas",
    ingredients: [
      { id: "i1", name: "Harina pastelera", percentage: 100, grams: 250, cost: 0.35, isFlour: true, isLiquid: false, costPerKg: 1.4 },
      { id: "i2", name: "Huevos", percentage: 167, grams: 417.5, cost: 1.34, isFlour: false, isLiquid: true, costPerKg: 3.2 },
      { id: "i3", name: "Azúcar", percentage: 100, grams: 250, cost: 0.28, isFlour: false, isLiquid: false, costPerKg: 1.1 },
      { id: "i4", name: "Mantequilla clarificada", percentage: 33, grams: 82.5, cost: 0.58, isFlour: false, isLiquid: false, costPerKg: 7 },
    ],
    steps: [
      { id: "s1", description: "Batir huevos y azúcar a baño maría hasta 40°C", duration: 8, temperature: 40 },
      { id: "s2", description: "Batir en batidora hasta triplicar volumen (punto letra)", duration: 10 },
      { id: "s3", description: "Tamizar e incorporar harina con movimientos envolventes", duration: 5 },
      { id: "s4", description: "Incorporar mantequilla clarificada tibia", duration: 3 },
      { id: "s5", description: "Verter en molde engrasado y enharinado", duration: 2 },
      { id: "s6", description: "Hornear sin abrir el horno los primeros 20 min", duration: 30, temperature: 180 },
    ],
    pieces: 1,
    weightPerPiece: 1000,
    hydration: 0,
    totalWeight: 1000,
    totalCost: 2.55,
    costPerUnit: 2.55,
    profitMargin: 3.0,
    isFavorite: false,
    isPublic: false,
    tags: ["pastelería", "bizcocho"],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const initialPosts: FeedPost[] = [
  {
    id: "p1",
    authorId: "user-2",
    authorName: "María Repostera",
    authorAvatar: "https://i.pravatar.cc/150?u=maria",
    authorTitle: "Chef Pastelera · 8 años",
    content: "¡Mi primera baguette con masa madre! 48h de fermentación fría. La miga quedó increíble 🍞",
    images: ["https://images.unsplash.com/photo-1597079910443-60c43fc4f729?w=400"],
    isHelpRequest: false,
    postType: "trabajo",
    reactions: [
      { type: "like", count: 32, userReacted: false },
      { type: "fire", count: 15, userReacted: false },
      { type: "bread", count: 8, userReacted: false },
      { type: "clap", count: 5, userReacted: false },
    ],
    comments: [
      {
        id: "c1",
        authorId: "user-3",
        authorName: "Carlos Artesano",
        authorAvatar: "https://i.pravatar.cc/150?u=carlos",
        content: "¡Excelente oven spring! El corte vertical quedó perfecto.",
        likes: 4,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "c1b",
        authorId: "user-4",
        authorName: "Ana Panadera",
        authorAvatar: "https://i.pravatar.cc/150?u=ana",
        content: "¿Cuántas horas en frío? Estoy experimentando con tiempos largos.",
        likes: 2,
        createdAt: new Date(Date.now() - 2400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "p2",
    authorId: "user-3",
    authorName: "Carlos Artesano",
    authorAvatar: "https://i.pravatar.cc/150?u=carlos",
    authorTitle: "Maestro Panadero · 12 años",
    content: "Ayuda: Mi croissant se abre durante el horneado. Uso mantequilla 82% grasa y temp de masa 18°C para el laminado. ¿Qué puede estar pasando? ¿Alguien ha tenido este problema?",
    images: [],
    isHelpRequest: true,
    postType: "ayuda",
    reactions: [
      { type: "like", count: 12, userReacted: false },
      { type: "fire", count: 0, userReacted: false },
      { type: "bread", count: 3, userReacted: false },
      { type: "clap", count: 0, userReacted: false },
    ],
    comments: [
      {
        id: "c2",
        authorId: "user-4",
        authorName: "Ana Panadera",
        authorAvatar: "https://i.pravatar.cc/150?u=ana",
        content: "Revisa el sellado de los bordes al enrollar. También puede ser que la mantequilla esté muy fría y se rompa al estirar.",
        likes: 7,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: "c3",
        authorId: "user-5",
        authorName: "Luis Panadero",
        authorAvatar: "https://i.pravatar.cc/150?u=luis",
        content: "Prueba subir la temperatura del horno los primeros 5 minutos. 210°C y luego baja a 185°C.",
        likes: 3,
        createdAt: new Date(Date.now() - 900000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "p3",
    authorId: "user-4",
    authorName: "Ana Panadera",
    authorAvatar: "https://i.pravatar.cc/150?u=ana",
    authorTitle: "Panadera Artesanal · 6 años",
    content: "¡Logro desbloqueado! Hoy completé mi certificación en panadería artesanal francesa. 6 meses de mucho esfuerzo pero valió cada minuto 🎓✨",
    images: [],
    isHelpRequest: false,
    postType: "logro",
    reactions: [
      { type: "like", count: 45, userReacted: false },
      { type: "fire", count: 22, userReacted: false },
      { type: "clap", count: 30, userReacted: false },
      { type: "bread", count: 10, userReacted: false },
    ],
    comments: [
      {
        id: "c4",
        authorId: "user-2",
        authorName: "María Repostera",
        authorAvatar: "https://i.pravatar.cc/150?u=maria",
        content: "¡Felicidades Ana! Te lo mereces, se nota tu dedicación en cada pan que compartes.",
        likes: 8,
        createdAt: new Date(Date.now() - 600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 28800000).toISOString(),
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

      get user() {
        return get().userProfile;
      },
      setUser: (user) => {
        if (user) set((state) => ({ userProfile: { ...state.userProfile, ...user } }));
      },
      likePost: (id) => get().reactToPost(id, "like"),
    }),
    {
      name: "leche-y-miel-v4",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        formulas: state.formulas,
        userProfile: state.userProfile,
        subscription: state.subscription,
        activeArea: state.activeArea,
        currency: state.currency,
        labDraft: state.labDraft,
        posts: state.posts,
      }),
    }
  )
);

export default useAppStore;

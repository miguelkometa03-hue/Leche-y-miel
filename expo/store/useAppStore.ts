import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  SavedFormula,
  FeedPost,
  User,
  AreaType,
} from "@/types";

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;

  formulas: SavedFormula[];
  addFormula: (formula: SavedFormula) => void;
  updateFormula: (id: string, updates: Partial<SavedFormula>) => void;
  deleteFormula: (id: string) => void;
  duplicateFormula: (id: string) => string;
  toggleFavorite: (id: string) => void;

  posts: FeedPost[];
  addPost: (post: FeedPost) => void;
  likePost: (id: string) => void;
  addComment: (postId: string, comment: FeedPost["comments"][0]) => void;

  activeArea: AreaType;
  setActiveArea: (area: AreaType) => void;
}

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
    isFavorite: true,
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
    isFavorite: false,
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
    content: "¡Mi primera baguette con masa madre! 48h de fermentación fría. La miga quedó increíble.",
    images: ["https://images.unsplash.com/photo-1597079910443-60c43fc4f729?w=400"],
    isHelpRequest: false,
    likes: 47,
    comments: [
      {
        id: "c1",
        authorId: "user-3",
        authorName: "Carlos Artesano",
        content: "¡Excelente oven spring! El corte vertical quedó perfecto.",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "p2",
    authorId: "user-3",
    authorName: "Carlos Artesano",
    authorAvatar: "https://i.pravatar.cc/150?u=carlos",
    content: "Ayuda: Mi croissant se abre durante el horneado. Uso mantequilla 82% y temp 18°C. ¿Qué puede estar pasando?",
    images: [],
    isHelpRequest: true,
    likes: 23,
    comments: [
      {
        id: "c2",
        authorId: "user-4",
        authorName: "Ana Panadera",
        content: "Revisa el sellado de los bordes al enrollar.",
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: {
        id: "user-1",
        name: "Panadero",
        email: "user@lecheymiel.app",
        avatar: "https://i.pravatar.cc/150?u=juan",
        bio: "Panadero artesanal",
        specialty: "Panadería",
        location: "Mi ciudad",
        createdAt: new Date().toISOString(),
      },
      setUser: (user) => set({ user }),

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
      likePost: (id) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, likes: p.likes + 1 } : p
          ),
        })),
      addComment: (postId, comment) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
          ),
        })),

      activeArea: "panaderia",
      setActiveArea: (area) => set({ activeArea: area }),
    }),
    {
      name: "leche-y-miel-v2",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        formulas: state.formulas,
        user: state.user,
        activeArea: state.activeArea,
      }),
    }
  )
);

export default useAppStore;

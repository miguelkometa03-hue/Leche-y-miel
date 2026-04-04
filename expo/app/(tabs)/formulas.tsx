import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search,
  Star,
  Droplets,
  ChevronRight,
  BookOpen,
  Copy,
  Trash2,
  Wheat,
  CakeSlice,
  Scale,
  Edit3,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { impactAsync, notificationAsync } from "@/utils/haptics";
import { showAlert } from "@/utils/alert";

import Colors from "@/constants/colors";
import { formatCurrency } from "@/constants/appConfig";
import useAppStore from "@/store/useAppStore";

type FilterType = "todas" | "panaderia" | "pasteleria" | "favoritas";

export default function FormulasScreen() {
  const router = useRouter();
  const { formulas, toggleFavorite, deleteFormula, duplicateFormula, currency } = useAppStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("todas");

  const filtered = useMemo(() => {
    return formulas.filter((f) => {
      const matchSearch =
        !search ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchFilter =
        filter === "todas" ||
        (filter === "favoritas" ? f.isFavorite : f.area === filter);
      return matchSearch && matchFilter;
    });
  }, [formulas, search, filter]);

  const counts = useMemo(
    () => ({
      todas: formulas.length,
      panaderia: formulas.filter((f) => f.area === "panaderia").length,
      pasteleria: formulas.filter((f) => f.area === "pasteleria").length,
      favoritas: formulas.filter((f) => f.isFavorite).length,
    }),
    [formulas]
  );

  const handleDelete = useCallback(
    (id: string, name: string) => {
      showAlert("Eliminar", `¿Eliminar "${name}"?`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            deleteFormula(id);
            void notificationAsync("Warning");
          },
        },
      ]);
    },
    [deleteFormula]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      void impactAsync("Medium");
      const newId = duplicateFormula(id);
      if (newId) {
        showAlert("Duplicada", "Fórmula copiada exitosamente");
      }
    },
    [duplicateFormula]
  );

  const handleEdit = useCallback(
    (id: string) => {
      void impactAsync("Medium");
      router.push(`/?editId=${id}`);
    },
    [router]
  );

  const filters: { id: FilterType; label: string }[] = [
    { id: "todas", label: "Todas" },
    { id: "panaderia", label: "Pan" },
    { id: "pasteleria", label: "Pastelería" },
    { id: "favoritas", label: "Favoritas" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mis Fórmulas</Text>
          <Text style={styles.subtitle}>{formulas.length} guardadas</Text>
        </View>
        <View style={styles.headerBadge}>
          <BookOpen size={16} color={Colors.light.primary} />
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search size={16} color={Colors.light.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar fórmula..."
          placeholderTextColor={Colors.light.textMuted}
          value={search}
          onChangeText={setSearch}
          testID="search-formulas"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
            onPress={() => setFilter(f.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.id && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
            <View
              style={[
                styles.filterCount,
                filter === f.id && styles.filterCountActive,
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  filter === f.id && styles.filterCountTextActive,
                ]}
              >
                {counts[f.id]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <BookOpen size={36} color={Colors.light.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Sin fórmulas</Text>
            <Text style={styles.emptySubtitle}>
              Usa el laboratorio para crear y guardar fórmulas
            </Text>
          </View>
        ) : (
          filtered.map((formula) => (
            <TouchableOpacity
              key={formula.id}
              style={styles.card}
              onPress={() => router.push(`/ficha/${formula.id}`)}
              activeOpacity={0.7}
            >
              {formula.imageUrl && (
                <Image source={{ uri: formula.imageUrl }} style={styles.cardImage} />
              )}
              <View style={styles.cardTop}>
                <View style={styles.cardTitleRow}>
                  <View
                    style={[
                      styles.areaDot,
                      {
                        backgroundColor:
                          formula.area === "panaderia"
                            ? Colors.light.primary
                            : Colors.light.gold,
                      },
                    ]}
                  />
                  <Text style={styles.cardName} numberOfLines={1}>
                    {formula.name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    void impactAsync("Light");
                    toggleFavorite(formula.id);
                  }}
                  hitSlop={8}
                >
                  <Star
                    size={18}
                    color={
                      formula.isFavorite
                        ? Colors.light.gold
                        : Colors.light.textMuted
                    }
                    fill={formula.isFavorite ? Colors.light.gold : "transparent"}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.cardStats}>
                <View style={styles.cardAreaBadge}>
                  {formula.area === "panaderia" ? (
                    <Wheat size={10} color={Colors.light.primary} />
                  ) : (
                    <CakeSlice size={10} color={Colors.light.gold} />
                  )}
                  <Text
                    style={[
                      styles.cardAreaText,
                      {
                        color:
                          formula.area === "panaderia"
                            ? Colors.light.primary
                            : Colors.light.gold,
                      },
                    ]}
                  >
                    {formula.area === "panaderia" ? "Pan" : "Pastelería"}
                  </Text>
                </View>

                {formula.area === "panaderia" && formula.hydration > 0 && (
                  <View style={styles.cardStat}>
                    <Droplets size={12} color={Colors.light.water} />
                    <Text style={styles.cardStatText}>{formula.hydration}%</Text>
                  </View>
                )}

                <View style={styles.cardStat}>
                  <Scale size={12} color={Colors.light.textMuted} />
                  <Text style={styles.cardStatText}>
                    {formula.pieces}×{formula.weightPerPiece}g
                  </Text>
                </View>

                <Text style={styles.cardIngCount}>
                  {formula.ingredients.length} ing.
                </Text>

                <View style={{ flex: 1 }} />

                <Text style={styles.cardPrice}>
                  {formatCurrency(formula.totalCost, currency)}
                </Text>
                <ChevronRight size={16} color={Colors.light.textMuted} />
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.cardActionBtn}
                  onPress={() => handleEdit(formula.id)}
                  activeOpacity={0.7}
                  hitSlop={4}
                >
                  <Edit3 size={13} color={Colors.light.primary} />
                  <Text style={[styles.cardActionText, { color: Colors.light.primary }]}>
                    Editar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cardActionBtn}
                  onPress={() => handleDuplicate(formula.id)}
                  activeOpacity={0.7}
                  hitSlop={4}
                >
                  <Copy size={13} color={Colors.light.textSecondary} />
                  <Text style={styles.cardActionText}>Duplicar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cardActionBtn}
                  onPress={() => handleDelete(formula.id, formula.name)}
                  activeOpacity={0.7}
                  hitSlop={4}
                >
                  <Trash2 size={13} color={Colors.light.error} />
                  <Text style={[styles.cardActionText, { color: Colors.light.error }]}>
                    Eliminar
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  filtersRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: Colors.light.textInverse,
    fontWeight: "600" as const,
  },
  filterCount: {
    backgroundColor: Colors.light.backgroundTertiary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  filterCountActive: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.light.textMuted,
  },
  filterCountTextActive: {
    color: Colors.light.textInverse,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden" as const,
  },
  cardImage: {
    width: "100%",
    height: 120,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  areaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    flex: 1,
  },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  cardAreaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  cardAreaText: {
    fontSize: 10,
    fontWeight: "600" as const,
  },
  cardStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardStatText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  cardIngCount: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.success,
  },
  cardActions: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cardActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: Colors.light.textSecondary,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textMuted,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});

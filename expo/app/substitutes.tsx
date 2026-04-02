import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  ArrowRightLeft,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useRouter, Stack } from "expo-router";

import Colors from "@/constants/colors";
import {
  INGREDIENT_SUBSTITUTES,
  findSubstitutes,
  calculateSubstituteAmount,
  getSubstituteCategories,
} from "@/utils/substitutes";
import type { IngredientSubstitute } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  grasas: "Grasas",
  fermentos: "Fermentos y Levaduras",
  endulzantes: "Endulzantes",
  liquidos: "Líquidos y Lácteos",
  huevos: "Huevos",
  harinas: "Harinas",
  otros: "Otros",
  lacteos: "Lácteos",
};

export default function SubstitutesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("grasas");
  const [gramsInput, setGramsInput] = useState("");

  const categories = useMemo(() => getSubstituteCategories(), []);

  const filteredBySearch = useMemo(() => {
    if (!search.trim()) return null;
    return findSubstitutes(search);
  }, [search]);

  const gramsNum = parseFloat(gramsInput) || 0;

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategory((prev) => (prev === cat ? null : cat));
  }, []);

  const renderSubstitute = (sub: IngredientSubstitute, idx: number) => {
    const converted = gramsNum > 0 ? calculateSubstituteAmount(gramsNum, sub.ratio) : 0;
    return (
      <View key={`${sub.original}-${sub.substitute}-${idx}`} style={styles.subCard}>
        <View style={styles.subHeader}>
          <View style={styles.subNameRow}>
            <Text style={styles.subOriginal}>{sub.original}</Text>
            <ArrowRightLeft size={14} color={Colors.light.primary} />
            <Text style={styles.subReplacement}>{sub.substitute}</Text>
          </View>
          <View style={styles.ratioBadge}>
            <Text style={styles.ratioText}>×{sub.ratio}</Text>
          </View>
        </View>

        {gramsNum > 0 && (
          <View style={styles.conversionRow}>
            <Text style={styles.conversionLabel}>
              {gramsNum}g de {sub.original}
            </Text>
            <Text style={styles.conversionArrow}>=</Text>
            <Text style={styles.conversionResult}>
              {converted}g de {sub.substitute}
            </Text>
          </View>
        )}

        <View style={styles.notesRow}>
          <Info size={12} color={Colors.light.textMuted} />
          <Text style={styles.notesText}>{sub.notes}</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sustitutos</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={16} color={Colors.light.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ingrediente..."
              placeholderTextColor={Colors.light.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <View style={styles.gramsBar}>
            <Text style={styles.gramsLabel}>Cantidad (g):</Text>
            <TextInput
              style={styles.gramsInput}
              value={gramsInput}
              onChangeText={setGramsInput}
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredBySearch ? (
            <>
              <Text style={styles.resultsTitle}>
                {filteredBySearch.length} sustitutos encontrados
              </Text>
              {filteredBySearch.length === 0 ? (
                <View style={styles.empty}>
                  <ArrowRightLeft size={28} color={Colors.light.textMuted} />
                  <Text style={styles.emptyTitle}>Sin resultados</Text>
                  <Text style={styles.emptySubtitle}>
                    No se encontraron sustitutos para "{search}"
                  </Text>
                </View>
              ) : (
                filteredBySearch.map((sub, idx) => renderSubstitute(sub, idx))
              )}
            </>
          ) : (
            categories.map((cat) => {
              const isExpanded = expandedCategory === cat;
              const items = INGREDIENT_SUBSTITUTES.filter((s) => s.category === cat);
              return (
                <View key={cat} style={styles.categorySection}>
                  <TouchableOpacity
                    style={styles.categoryHeader}
                    onPress={() => toggleCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryTitle}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </Text>
                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryCount}>{items.length}</Text>
                      {isExpanded ? (
                        <ChevronUp size={16} color={Colors.light.textMuted} />
                      ) : (
                        <ChevronDown size={16} color={Colors.light.textMuted} />
                      )}
                    </View>
                  </TouchableOpacity>
                  {isExpanded && items.map((sub, idx) => renderSubstitute(sub, idx))}
                </View>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  searchSection: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
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
  gramsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  gramsLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  gramsInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.primary,
    textAlign: "right",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  resultsTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 6,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  categoryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textMuted,
    backgroundColor: Colors.light.backgroundTertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  subCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  subOriginal: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  subReplacement: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  ratioBadge: {
    backgroundColor: Colors.light.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratioText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  conversionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.successMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  conversionLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  conversionArrow: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.success,
  },
  conversionResult: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.success,
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  notesText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    lineHeight: 17,
    flex: 1,
  },
  empty: {
    alignItems: "center",
    paddingTop: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textMuted,
    textAlign: "center",
  },
});

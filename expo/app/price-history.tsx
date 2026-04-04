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
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  BarChart3,
} from "lucide-react-native";
import { useRouter, Stack } from "expo-router";
import { impactAsync } from "@/utils/haptics";
import { showAlert } from "@/utils/alert";

import Colors from "@/constants/colors";
import { formatCurrency } from "@/constants/appConfig";
import useAppStore from "@/store/useAppStore";
import type { PriceHistoryEntry } from "@/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function PriceHistoryScreen() {
  const router = useRouter();
  const { priceHistory, addPriceEntry, productionHistory, currency } = useAppStore();

  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIngName, setNewIngName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [activeTab, setActiveTab] = useState<"precios" | "produccion">("precios");

  const ingredientNames = useMemo(() => {
    const names = [...new Set(priceHistory.map((e) => e.ingredientName))];
    return names.sort();
  }, [priceHistory]);

  const filteredNames = useMemo(() => {
    if (!search) return ingredientNames;
    return ingredientNames.filter((n) =>
      n.toLowerCase().includes(search.toLowerCase())
    );
  }, [ingredientNames, search]);

  const getIngredientHistory = useCallback(
    (name: string): PriceHistoryEntry[] => {
      return priceHistory
        .filter((e) => e.ingredientName === name)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
    [priceHistory]
  );

  const getPriceTrend = useCallback(
    (name: string): { change: number; direction: "up" | "down" | "stable" } => {
      const history = getIngredientHistory(name);
      if (history.length < 2) return { change: 0, direction: "stable" };
      const last = history[history.length - 1].costPerKg;
      const prev = history[history.length - 2].costPerKg;
      const change = Math.round(((last - prev) / prev) * 10000) / 100;
      return {
        change: Math.abs(change),
        direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
      };
    },
    [getIngredientHistory]
  );

  const handleAddEntry = useCallback(() => {
    if (!newIngName.trim()) {
      showAlert("Error", "Ingresa el nombre del ingrediente");
      return;
    }
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      showAlert("Error", "Ingresa un precio válido");
      return;
    }

    void impactAsync("Medium");
    const entry: PriceHistoryEntry = {
      id: `ph-${Date.now()}`,
      ingredientName: newIngName.trim(),
      costPerKg: price,
      date: new Date().toISOString(),
    };
    addPriceEntry(entry);
    setNewIngName("");
    setNewPrice("");
    setShowAddForm(false);
    showAlert("Registrado", "Precio agregado al historial");
  }, [newIngName, newPrice, addPriceEntry]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historial</Text>
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={18} color={Colors.light.textInverse} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {(["precios", "produccion"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === "precios" ? "Precios" : "Producción"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === "precios" && (
            <>
              {showAddForm && (
                <View style={styles.addForm}>
                  <Text style={styles.addFormTitle}>Registrar precio</Text>
                  <TextInput
                    style={styles.addFormInput}
                    placeholder="Ingrediente (ej: Harina de fuerza)"
                    placeholderTextColor={Colors.light.textMuted}
                    value={newIngName}
                    onChangeText={setNewIngName}
                  />
                  <TextInput
                    style={styles.addFormInput}
                    placeholder="Precio por kg"
                    placeholderTextColor={Colors.light.textMuted}
                    value={newPrice}
                    onChangeText={setNewPrice}
                    keyboardType="decimal-pad"
                  />
                  <View style={styles.addFormActions}>
                    <TouchableOpacity
                      style={styles.addFormCancel}
                      onPress={() => setShowAddForm(false)}
                    >
                      <Text style={styles.addFormCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addFormSubmit} onPress={handleAddEntry}>
                      <Text style={styles.addFormSubmitText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

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

              {filteredNames.map((name) => {
                const history = getIngredientHistory(name);
                const latest = history[history.length - 1];
                const trend = getPriceTrend(name);
                return (
                  <View key={name} style={styles.ingredientCard}>
                    <View style={styles.ingredientHeader}>
                      <Text style={styles.ingredientName}>{name}</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.currentPrice}>
                          {formatCurrency(latest.costPerKg, currency)}/kg
                        </Text>
                        {trend.direction !== "stable" && (
                          <View
                            style={[
                              styles.trendBadge,
                              {
                                backgroundColor:
                                  trend.direction === "up"
                                    ? Colors.light.errorMuted
                                    : Colors.light.successMuted,
                              },
                            ]}
                          >
                            {trend.direction === "up" ? (
                              <TrendingUp size={12} color={Colors.light.error} />
                            ) : (
                              <TrendingDown size={12} color={Colors.light.success} />
                            )}
                            <Text
                              style={[
                                styles.trendText,
                                {
                                  color:
                                    trend.direction === "up"
                                      ? Colors.light.error
                                      : Colors.light.success,
                                },
                              ]}
                            >
                              {trend.change}%
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.historyTimeline}>
                      {history.map((entry, idx) => {
                        const isLast = idx === history.length - 1;
                        const barWidth =
                          history.length > 1
                            ? Math.max(
                                15,
                                Math.min(
                                  100,
                                  (entry.costPerKg /
                                    Math.max(...history.map((h) => h.costPerKg))) *
                                    100
                                )
                              )
                            : 60;
                        return (
                          <View key={entry.id} style={styles.historyRow}>
                            <Text style={styles.historyDate}>
                              {formatDate(entry.date)}
                            </Text>
                            <View style={styles.historyBarWrap}>
                              <View
                                style={[
                                  styles.historyBar,
                                  {
                                    width: `${barWidth}%` as `${number}%`,
                                    backgroundColor: isLast
                                      ? Colors.light.primary
                                      : Colors.light.backgroundTertiary,
                                  },
                                ]}
                              />
                            </View>
                            <Text
                              style={[
                                styles.historyPrice,
                                isLast && { color: Colors.light.primary, fontWeight: "700" as const },
                              ]}
                            >
                              {formatCurrency(entry.costPerKg, currency)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              {filteredNames.length === 0 && (
                <View style={styles.empty}>
                  <BarChart3 size={28} color={Colors.light.textMuted} />
                  <Text style={styles.emptyTitle}>Sin datos</Text>
                  <Text style={styles.emptySubtitle}>
                    Registra precios de tus ingredientes para ver tendencias
                  </Text>
                </View>
              )}
            </>
          )}

          {activeTab === "produccion" && (
            <>
              {productionHistory.length === 0 ? (
                <View style={styles.empty}>
                  <BarChart3 size={28} color={Colors.light.textMuted} />
                  <Text style={styles.emptyTitle}>Sin historial</Text>
                  <Text style={styles.emptySubtitle}>
                    Completa producciones en el planificador para ver el historial
                  </Text>
                </View>
              ) : (
                productionHistory.map((entry) => (
                  <View key={entry.id} style={styles.prodCard}>
                    <View style={styles.prodHeader}>
                      <Text style={styles.prodName}>{entry.formulaName}</Text>
                      <Text style={styles.prodDate}>{formatDate(entry.date)}</Text>
                    </View>
                    <View style={styles.prodStats}>
                      <View style={styles.prodStat}>
                        <Text style={styles.prodStatValue}>{entry.pieces}</Text>
                        <Text style={styles.prodStatLabel}>piezas</Text>
                      </View>
                      <View style={styles.prodStatDivider} />
                      <View style={styles.prodStat}>
                        <Text style={styles.prodStatValue}>
                          {(entry.totalWeight / 1000).toFixed(1)}kg
                        </Text>
                        <Text style={styles.prodStatLabel}>peso</Text>
                      </View>
                      <View style={styles.prodStatDivider} />
                      <View style={styles.prodStat}>
                        <Text style={[styles.prodStatValue, { color: Colors.light.success }]}>
                          {formatCurrency(entry.totalCost, currency)}
                        </Text>
                        <Text style={styles.prodStatLabel}>costo</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </>
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
  addHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Colors.light.card,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.light.textMuted,
  },
  tabTextActive: {
    color: Colors.light.text,
    fontWeight: "600" as const,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  addForm: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  addFormTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  addFormInput: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 10,
  },
  addFormActions: {
    flexDirection: "row",
    gap: 10,
  },
  addFormCancel: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  addFormCancelText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  addFormSubmit: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
  },
  addFormSubmitText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.textInverse,
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
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  ingredientCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  ingredientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currentPrice: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  historyTimeline: {
    gap: 6,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyDate: {
    width: 75,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  historyBarWrap: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.backgroundSecondary,
    overflow: "hidden",
  },
  historyBar: {
    height: "100%",
    borderRadius: 4,
  },
  historyPrice: {
    width: 55,
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "right",
  },
  prodCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  prodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  prodName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    flex: 1,
  },
  prodDate: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  prodStats: {
    flexDirection: "row",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    padding: 10,
  },
  prodStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  prodStatDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  prodStatValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  prodStatLabel: {
    fontSize: 10,
    color: Colors.light.textMuted,
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
    paddingHorizontal: 30,
  },
});

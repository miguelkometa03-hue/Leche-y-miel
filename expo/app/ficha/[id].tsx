import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Star,
  Share2,
  Clock,
  Droplets,
  Thermometer,
  Scale,
  Trash2,
  Copy,
  Edit3,
  Check,
  X,
  Wheat,
  CakeSlice,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import useAppStore from "@/store/useAppStore";
import { formatDuration } from "@/utils/formulaEngine";

export default function FichaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { formulas, toggleFavorite, deleteFormula, duplicateFormula, updateFormula } =
    useAppStore();
  const [activeTab, setActiveTab] = useState<
    "ingredientes" | "proceso" | "costos"
  >("ingredientes");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const formula = useMemo(
    () => formulas.find((f) => f.id === id),
    [formulas, id]
  );

  const handleStartEdit = useCallback(() => {
    if (!formula) return;
    setEditName(formula.name);
    setEditDesc(formula.description);
    setEditing(true);
  }, [formula]);

  const handleSaveEdit = useCallback(() => {
    if (!formula || !editName.trim()) return;
    updateFormula(formula.id, {
      name: editName.trim(),
      description: editDesc.trim(),
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(false);
  }, [formula, editName, editDesc, updateFormula]);

  const handleShare = useCallback(async () => {
    if (!formula) return;
    const ingredientsList = formula.ingredients
      .map((i) => `  ${i.name}: ${i.grams.toFixed(1)}g (${i.percentage}%)`)
      .join("\n");

    const text = `${formula.name}\n${formula.area === "panaderia" ? "Panadería" : "Pastelería"}\n${formula.hydration > 0 ? `Hidratación: ${formula.hydration}%\n` : ""}Piezas: ${formula.pieces} × ${formula.weightPerPiece}g\nPeso total: ${formula.totalWeight.toFixed(0)}g\n\nIngredientes:\n${ingredientsList}\n\nCosto total: $${formula.totalCost.toFixed(2)}\nCosto/pieza: $${formula.costPerUnit.toFixed(2)}\n\n— Leche y Miel`;

    try {
      await Share.share({ message: text, title: formula.name });
    } catch {
      console.log("Share cancelled");
    }
  }, [formula]);

  const handleDelete = useCallback(() => {
    if (!formula) return;
    Alert.alert("Eliminar", `¿Eliminar "${formula.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          deleteFormula(formula.id);
          router.back();
        },
      },
    ]);
  }, [formula, deleteFormula, router]);

  const handleDuplicate = useCallback(() => {
    if (!formula) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newId = duplicateFormula(formula.id);
    if (newId) {
      Alert.alert("Duplicada", "Fórmula copiada. La encontrarás en tus fórmulas.");
    }
  }, [formula, duplicateFormula]);

  if (!formula) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.notFound}>
            <Text style={styles.notFoundText}>Ficha no encontrada</Text>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.backBtnText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const totalTime = formula.steps.reduce((sum, s) => sum + s.duration, 0);
  const suggestedPrice = formula.costPerUnit * 2.5;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.back()}
            >
              <ArrowLeft size={22} color={Colors.light.text} />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              {editing ? (
                <>
                  <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => setEditing(false)}
                  >
                    <X size={18} color={Colors.light.error} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.headerBtn, styles.headerBtnSave]}
                    onPress={handleSaveEdit}
                  >
                    <Check size={18} color={Colors.light.textInverse} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={handleStartEdit}
                  >
                    <Edit3 size={18} color={Colors.light.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={handleShare}
                  >
                    <Share2 size={18} color={Colors.light.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => {
                      void Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Light
                      );
                      toggleFavorite(formula.id);
                    }}
                  >
                    <Star
                      size={18}
                      color={
                        formula.isFavorite
                          ? Colors.light.gold
                          : Colors.light.text
                      }
                      fill={
                        formula.isFavorite ? Colors.light.gold : "transparent"
                      }
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <View style={styles.hero}>
            <View
              style={[
                styles.areaBadge,
                {
                  backgroundColor:
                    formula.area === "panaderia"
                      ? Colors.light.primaryMuted
                      : Colors.light.goldMuted,
                },
              ]}
            >
              {formula.area === "panaderia" ? (
                <Wheat size={12} color={Colors.light.primary} />
              ) : (
                <CakeSlice size={12} color={Colors.light.gold} />
              )}
              <Text
                style={[
                  styles.areaBadgeText,
                  {
                    color:
                      formula.area === "panaderia"
                        ? Colors.light.primary
                        : Colors.light.gold,
                  },
                ]}
              >
                {formula.area === "panaderia" ? "PANADERÍA" : "PASTELERÍA"}
              </Text>
            </View>

            {editing ? (
              <View style={styles.editFields}>
                <TextInput
                  style={styles.editNameInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nombre"
                  placeholderTextColor={Colors.light.textMuted}
                />
                <TextInput
                  style={styles.editDescInput}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  placeholder="Descripción (opcional)"
                  placeholderTextColor={Colors.light.textMuted}
                  multiline
                />
              </View>
            ) : (
              <>
                <Text style={styles.heroName}>{formula.name}</Text>
                {formula.description ? (
                  <Text style={styles.heroDesc}>{formula.description}</Text>
                ) : null}
              </>
            )}

            <View style={styles.heroStats}>
              {formula.area === "panaderia" && formula.hydration > 0 && (
                <>
                  <View style={styles.heroStat}>
                    <Droplets size={16} color={Colors.light.water} />
                    <Text style={styles.heroStatValue}>
                      {formula.hydration}%
                    </Text>
                    <Text style={styles.heroStatLabel}>Hidratación</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                </>
              )}
              <View style={styles.heroStat}>
                <Scale size={16} color={Colors.light.primary} />
                <Text style={styles.heroStatValue}>
                  {formula.pieces}×{formula.weightPerPiece}g
                </Text>
                <Text style={styles.heroStatLabel}>Producción</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Clock size={16} color={Colors.light.textSecondary} />
                <Text style={styles.heroStatValue}>
                  {totalTime > 0 ? formatDuration(totalTime) : "—"}
                </Text>
                <Text style={styles.heroStatLabel}>Tiempo</Text>
              </View>
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={handleDuplicate}
              activeOpacity={0.7}
            >
              <Copy size={16} color={Colors.light.primary} />
              <Text style={styles.quickBtnText}>Duplicar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBtn, styles.quickBtnDanger]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color={Colors.light.error} />
              <Text style={[styles.quickBtnText, { color: Colors.light.error }]}>
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            {(["ingredientes", "proceso", "costos"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "ingredientes" && (
            <View style={styles.section}>
              <View style={styles.card}>
                <View style={styles.tableHead}>
                  <Text style={[styles.tableHeadText, { flex: 1 }]}>
                    Ingrediente
                  </Text>
                  <Text style={[styles.tableHeadText, styles.tRight]}>%</Text>
                  <Text style={[styles.tableHeadText, styles.tRight]}>
                    Gramos
                  </Text>
                  <Text style={[styles.tableHeadText, styles.tRight]}>
                    Costo
                  </Text>
                </View>
                {formula.ingredients.map((item, idx) => (
                  <View
                    key={item.id + String(idx)}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 && styles.tableRowAlt,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ingName}>{item.name}</Text>
                      <Text style={styles.ingType}>
                        {item.isFlour
                          ? "Harina"
                          : item.isLiquid
                          ? "Líquido"
                          : ""}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.tRight,
                        { color: Colors.light.textMuted },
                      ]}
                    >
                      {item.percentage}%
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.tRight,
                        { fontWeight: "600" as const },
                      ]}
                    >
                      {item.grams.toFixed(1)}g
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.tRight,
                        { color: Colors.light.success },
                      ]}
                    >
                      ${item.cost.toFixed(2)}
                    </Text>
                  </View>
                ))}
                <View style={styles.tableTotalRow}>
                  <Text style={[styles.tableTotalText, { flex: 1 }]}>
                    Total
                  </Text>
                  <Text style={[styles.tableTotalText, styles.tRight]} />
                  <Text style={[styles.tableTotalText, styles.tRight]}>
                    {formula.totalWeight.toFixed(0)}g
                  </Text>
                  <Text
                    style={[
                      styles.tableTotalText,
                      styles.tRight,
                      { color: Colors.light.success },
                    ]}
                  >
                    ${formula.totalCost.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === "proceso" && (
            <View style={styles.section}>
              {formula.steps.length === 0 ? (
                <View style={styles.emptySteps}>
                  <Clock size={28} color={Colors.light.textMuted} />
                  <Text style={styles.emptyStepsText}>
                    Sin pasos de proceso registrados
                  </Text>
                </View>
              ) : (
                <View style={styles.card}>
                  {formula.steps.map((step, idx) => (
                    <View key={step.id} style={styles.stepRow}>
                      <View style={styles.stepNum}>
                        <Text style={styles.stepNumText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.stepBody}>
                        <Text style={styles.stepDesc}>
                          {step.description}
                        </Text>
                        <View style={styles.stepMeta}>
                          {step.duration > 0 && (
                            <>
                              <Clock
                                size={12}
                                color={Colors.light.textMuted}
                              />
                              <Text style={styles.stepMetaText}>
                                {formatDuration(step.duration)}
                              </Text>
                            </>
                          )}
                          {step.temperature != null && step.temperature > 0 && (
                            <>
                              <Thermometer
                                size={12}
                                color={Colors.light.warning}
                              />
                              <Text
                                style={[
                                  styles.stepMetaText,
                                  { color: Colors.light.warning },
                                ]}
                              >
                                {step.temperature}°C
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                  {totalTime > 0 && (
                    <View style={styles.totalTimeBar}>
                      <Clock size={14} color={Colors.light.primary} />
                      <Text style={styles.totalTimeText}>
                        Tiempo total: {formatDuration(totalTime)}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {activeTab === "costos" && (
            <View style={styles.section}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>ANÁLISIS DE COSTOS</Text>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Costo ingredientes</Text>
                  <Text style={styles.costValue}>
                    ${formula.totalCost.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Costo por pieza</Text>
                  <Text style={styles.costValue}>
                    ${formula.costPerUnit.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Piezas producidas</Text>
                  <Text style={styles.costValue}>{formula.pieces}</Text>
                </View>
                <View style={styles.costDivider} />
                <View style={styles.costHighlight}>
                  <Text style={styles.costHighlightLabel}>
                    Precio sugerido (×2.5)
                  </Text>
                  <Text style={styles.costHighlightValue}>
                    ${suggestedPrice.toFixed(2)} /pieza
                  </Text>
                </View>
              </View>

              <View style={[styles.card, styles.profitCard]}>
                <Text style={styles.profitLabel}>Ganancia estimada</Text>
                <Text style={styles.profitValue}>
                  $
                  {(
                    suggestedPrice * formula.pieces -
                    formula.totalCost
                  ).toFixed(2)}
                </Text>
                <Text style={styles.profitSub}>
                  por lote de {formula.pieces} piezas
                </Text>
              </View>
            </View>
          )}
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
  scrollContent: {
    paddingBottom: 40,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: Colors.light.textInverse,
    fontWeight: "600" as const,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
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
  headerBtnSave: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  hero: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  areaBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  areaBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
  heroName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },
  editFields: {
    gap: 10,
    marginBottom: 18,
  },
  editNameInput: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  editDescInput: {
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 50,
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  heroStatValue: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  heroStatLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.card,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quickBtnDanger: {
    borderColor: Colors.light.errorMuted,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.primary,
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
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
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.primary,
    letterSpacing: 1,
    marginBottom: 14,
  },
  tableHead: {
    flexDirection: "row",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    marginBottom: 4,
  },
  tableHeadText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.light.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tRight: {
    textAlign: "right",
    width: 58,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  tableRowAlt: {
    backgroundColor: Colors.light.backgroundSecondary,
    marginHorizontal: -18,
    paddingHorizontal: 18,
  },
  tableCell: {
    fontSize: 13,
    color: Colors.light.text,
  },
  ingName: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  ingType: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 1,
  },
  tableTotalRow: {
    flexDirection: "row",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: Colors.light.primary,
  },
  tableTotalText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  emptySteps: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyStepsText: {
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  stepBody: {
    flex: 1,
  },
  stepDesc: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  stepMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepMetaText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginRight: 8,
  },
  totalTimeBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  totalTimeText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.primary,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  costLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  costValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  costDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 6,
  },
  costHighlight: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.light.successMuted,
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginVertical: 8,
  },
  costHighlightLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.success,
  },
  costHighlightValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.success,
  },
  profitCard: {
    backgroundColor: Colors.light.successMuted,
    borderColor: Colors.light.success,
    alignItems: "center",
    paddingVertical: 24,
  },
  profitLabel: {
    fontSize: 13,
    color: Colors.light.success,
    fontWeight: "500" as const,
  },
  profitValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.light.success,
    marginTop: 4,
  },
  profitSub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
});

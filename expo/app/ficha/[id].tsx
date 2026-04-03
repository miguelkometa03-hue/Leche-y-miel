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
  Platform,
  Image,
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
  Printer,
  Camera,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";

import * as ImagePicker from "expo-image-picker";

import Colors from "@/constants/colors";
import { formatCurrency, getCurrencyConfig } from "@/constants/appConfig";
import useAppStore from "@/store/useAppStore";
import { formatDuration, formatDecimal } from "@/utils/formulaEngine";

export default function FichaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { formulas, toggleFavorite, deleteFormula, duplicateFormula, updateFormula, currency } =
    useAppStore();
  const [activeTab, setActiveTab] = useState<
    "ingredientes" | "proceso" | "costos"
  >("ingredientes");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [marginMultiplier, setMarginMultiplier] = useState("");

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

  const handleEditInLab = useCallback(() => {
    if (!formula) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/?editId=${formula.id}`);
  }, [formula, router]);

  const generateShareText = useCallback(() => {
    if (!formula) return "";
    const ingredientsList = formula.ingredients
      .map((i) => `  ${i.name}: ${i.grams.toFixed(1)}g (${formatDecimal(i.percentage)}%)`)
      .join("\n");

    const stepsText = formula.steps.length > 0
      ? "\n\nProceso:\n" + formula.steps.map((s, idx) =>
        `  ${idx + 1}. ${s.description}${s.duration > 0 ? ` (${formatDuration(s.duration)})` : ""}${s.temperature ? ` ${s.temperature}°C` : ""}`
      ).join("\n")
      : "";

    return `${formula.name}\n${formula.area === "panaderia" ? "Panadería" : "Pastelería"}\n${formula.hydration > 0 ? `Hidratación: ${formula.hydration}%\n` : ""}Piezas: ${formula.pieces} × ${formula.weightPerPiece}g\nPeso total: ${formula.totalWeight.toFixed(0)}g\n\nIngredientes:\n${ingredientsList}\n\nCosto total: ${formatCurrency(formula.totalCost, currency)}\nCosto/pieza: ${formatCurrency(formula.costPerUnit, currency)}\nPrecio sugerido (×2.5): ${formatCurrency(formula.costPerUnit * 2.5, currency)}/pieza${stepsText}\n\n— Leche y Miel`;
  }, [formula, currency]);

  const handleShare = useCallback(async () => {
    if (!formula) return;
    const text = generateShareText();
    try {
      await Share.share({ message: text, title: formula.name });
    } catch {
    }
  }, [formula, generateShareText]);

  const generateProfessionalHTML = useCallback(() => {
    if (!formula) return "";
    const cc = getCurrencyConfig(currency);
    const totalTime = formula.steps.reduce((sum, s) => sum + s.duration, 0);
    const margin = formula.profitMargin ?? 2.5;
    const suggestedPrice = formula.costPerUnit * margin;

    const ingredientRows = formula.ingredients
      .map(
        (i) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #2A2724;">${i.name}${i.isFlour ? ' <span style="color:#E8922F;font-size:10px;">HARINA</span>' : i.isLiquid ? ' <span style="color:#60A5FA;font-size:10px;">LÍQUIDO</span>' : ''}</td><td style="padding:8px 12px;border-bottom:1px solid #2A2724;text-align:right;color:#A09888;">${formatDecimal(i.percentage)}%</td><td style="padding:8px 12px;border-bottom:1px solid #2A2724;text-align:right;font-weight:600;">${i.grams.toFixed(1)}g</td><td style="padding:8px 12px;border-bottom:1px solid #2A2724;text-align:right;color:#4ADE80;">${cc.symbol}${i.cost.toFixed(cc.decimals)}</td></tr>`
      )
      .join("");

    const stepsRows = formula.steps
      .map(
        (s, idx) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #2A2724;width:30px;text-align:center;"><span style="background:#E8922F20;color:#E8922F;padding:2px 8px;border-radius:10px;font-weight:700;font-size:12px;">${idx + 1}</span></td><td style="padding:8px 12px;border-bottom:1px solid #2A2724;">${s.description}</td><td style="padding:8px 12px;border-bottom:1px solid #2A2724;text-align:right;color:#A09888;white-space:nowrap;">${s.duration > 0 ? formatDuration(s.duration) : "—"}</td><td style="padding:8px 12px;border-bottom:1px solid #2A2724;text-align:right;color:#FBBF24;white-space:nowrap;">${s.temperature ? s.temperature + "°C" : "—"}</td></tr>`
      )
      .join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${formula.name} - Leche y Miel</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0D0D0D;color:#F5F0E8;padding:24px;max-width:800px;margin:0 auto}h1{font-size:28px;margin-bottom:4px}h2{font-size:14px;color:#E8922F;letter-spacing:1.5px;text-transform:uppercase;margin:24px 0 12px;border-bottom:2px solid #E8922F;padding-bottom:6px}.badge{display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:1px}.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:16px 0}.stat-box{background:#1A1A1A;border:1px solid #2A2724;border-radius:12px;padding:14px;text-align:center}.stat-value{font-size:20px;font-weight:700;color:#F5F0E8}.stat-label{font-size:11px;color:#A09888;margin-top:4px}table{width:100%;border-collapse:collapse;background:#1A1A1A;border:1px solid #2A2724;border-radius:12px;overflow:hidden;margin-bottom:16px}th{padding:10px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#A09888;background:#141414;border-bottom:2px solid #2A2724}.cost-highlight{background:#4ADE8020;border:1px solid #4ADE80;border-radius:12px;padding:16px;text-align:center;margin:16px 0}.cost-highlight .value{font-size:28px;font-weight:700;color:#4ADE80}.cost-highlight .label{font-size:12px;color:#A09888;margin-top:4px}.footer{text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #2A2724;color:#6B6560;font-size:12px}@media print{body{background:#fff;color:#111}table,th,.stat-box{background:#f9f9f9;border-color:#ddd;color:#111}th{background:#eee;color:#666}.badge{border:1px solid #ccc}.cost-highlight{background:#e8ffe8;border-color:#4ADE80}.stat-value,.cost-highlight .value{color:#111}.stat-label,.cost-highlight .label{color:#666}h2{color:#C67A1A}}</style></head><body><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px"><div><span class="badge" style="background:${formula.area === "panaderia" ? "#E8922F20" : "#FFB83020"};color:${formula.area === "panaderia" ? "#E8922F" : "#FFB830"};margin-bottom:8px;">${formula.area === "panaderia" ? "PANADERÍA" : "PASTELERÍA"}</span><h1>${formula.name}</h1>${formula.description ? `<p style="color:#A09888;margin-top:6px;">${formula.description}</p>` : ""}</div><div style="text-align:right;color:#A09888;font-size:12px;"><div>Leche y Miel</div><div style="margin-top:2px;">${new Date().toLocaleDateString()}</div></div></div><div class="stats-grid">${formula.area === "panaderia" && formula.hydration > 0 ? `<div class="stat-box"><div class="stat-value" style="color:#60A5FA;">${formula.hydration}%</div><div class="stat-label">Hidratación</div></div>` : ""}<div class="stat-box"><div class="stat-value">${formula.pieces}×${formula.weightPerPiece}g</div><div class="stat-label">Producción</div></div><div class="stat-box"><div class="stat-value">${(formula.totalWeight / 1000).toFixed(2)}kg</div><div class="stat-label">Peso total</div></div><div class="stat-box"><div class="stat-value">${totalTime > 0 ? formatDuration(totalTime) : "—"}</div><div class="stat-label">Tiempo total</div></div></div><h2>Ingredientes</h2><table><thead><tr><th style="text-align:left;">Ingrediente</th><th style="text-align:right;">%</th><th style="text-align:right;">Gramos</th><th style="text-align:right;">Costo</th></tr></thead><tbody>${ingredientRows}<tr style="background:#E8922F15;font-weight:700;"><td style="padding:10px 12px;">Total</td><td style="padding:10px 12px;text-align:right;">${formatDecimal(formula.ingredients.reduce((s, i) => s + i.percentage, 0))}%</td><td style="padding:10px 12px;text-align:right;">${formula.totalWeight.toFixed(0)}g</td><td style="padding:10px 12px;text-align:right;color:#4ADE80;">${cc.symbol}${formula.totalCost.toFixed(cc.decimals)}</td></tr></tbody></table>${formula.steps.length > 0 ? `<h2>Proceso</h2><table><thead><tr><th style="width:30px;text-align:center;">#</th><th>Descripción</th><th style="text-align:right;">Tiempo</th><th style="text-align:right;">Temp.</th></tr></thead><tbody>${stepsRows}</tbody></table>` : ""}<h2>Análisis de Costos</h2><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;"><div class="stat-box"><div class="stat-value" style="color:#4ADE80;font-size:16px;">${cc.symbol}${formula.totalCost.toFixed(cc.decimals)}</div><div class="stat-label">Costo total</div></div><div class="stat-box"><div class="stat-value" style="color:#4ADE80;font-size:16px;">${cc.symbol}${formula.costPerUnit.toFixed(cc.decimals)}</div><div class="stat-label">Costo/pieza</div></div><div class="stat-box"><div class="stat-value" style="color:#E8922F;font-size:16px;">×${margin.toFixed(1)}</div><div class="stat-label">Margen</div></div></div><div class="cost-highlight"><div class="label">Precio sugerido de venta</div><div class="value">${cc.symbol}${suggestedPrice.toFixed(cc.decimals)} /pieza</div><div class="label" style="margin-top:8px;">Ganancia estimada: ${cc.symbol}${(suggestedPrice * formula.pieces - formula.totalCost).toFixed(cc.decimals)} por lote</div></div><div class="footer">Ficha técnica generada por <strong>Leche y Miel</strong> — Herramienta profesional de formulación</div></body></html>`;
  }, [formula, currency]);

  const handlePrint = useCallback(async () => {
    if (!formula) return;
    if (Platform.OS === "web") {
      const html = generateProfessionalHTML();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 300);
      }
    } else {
      const text = generateShareText();
      try {
        await Share.share({ message: text, title: `Ficha: ${formula.name}` });
      } catch {
      }
    }
  }, [formula, generateShareText, generateProfessionalHTML]);

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

  const handlePickImage = useCallback(async () => {
    if (!formula) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        updateFormula(formula.id, { imageUrl: result.assets[0].uri });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
    }
  }, [formula, updateFormula]);

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
  const currentMargin = marginMultiplier ? parseFloat(marginMultiplier) : (formula.profitMargin ?? 2.5);
  const effectiveMargin = isNaN(currentMargin) || currentMargin <= 0 ? 2.5 : currentMargin;
  const suggestedPrice = formula.costPerUnit * effectiveMargin;

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
                    onPress={handlePrint}
                  >
                    <Printer size={18} color={Colors.light.text} />
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

          {formula.imageUrl && (
            <Image source={{ uri: formula.imageUrl }} style={styles.heroImage} />
          )}

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
              style={[styles.quickBtn, styles.quickBtnPrimary]}
              onPress={handleEditInLab}
              activeOpacity={0.7}
            >
              <Edit3 size={16} color={Colors.light.textInverse} />
              <Text style={[styles.quickBtnText, { color: Colors.light.textInverse }]}>Editar en Lab</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              <Camera size={16} color={Colors.light.primary} />
              <Text style={styles.quickBtnText}>Foto</Text>
            </TouchableOpacity>
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
                      {formatDecimal(item.percentage)}%
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
                      {formatCurrency(item.cost, currency)}
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
                    {formatCurrency(formula.totalCost, currency)}
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
                    {formatCurrency(formula.totalCost, currency)}
                  </Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Costo por pieza</Text>
                  <Text style={styles.costValue}>
                    {formatCurrency(formula.costPerUnit, currency)}
                  </Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Piezas producidas</Text>
                  <Text style={styles.costValue}>{formula.pieces}</Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Costo por kg</Text>
                  <Text style={styles.costValue}>
                    {formula.totalWeight > 0
                      ? formatCurrency((formula.totalCost / formula.totalWeight) * 1000, currency)
                      : "—"}
                  </Text>
                </View>

                <View style={styles.costDivider} />

                <View style={styles.costIngBreakdown}>
                  <Text style={styles.costIngBreakdownTitle}>DESGLOSE POR INGREDIENTE</Text>
                  {formula.ingredients.map((ing, idx) => (
                    <View key={ing.id + String(idx)} style={styles.costIngRow}>
                      <Text style={styles.costIngName} numberOfLines={1}>{ing.name}</Text>
                      <View style={styles.costIngBarWrap}>
                        <View
                          style={[
                            styles.costIngBar,
                            {
                              width: `${formula.totalCost > 0 ? Math.max(4, (ing.cost / formula.totalCost) * 100) : 0}%` as `${number}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.costIngAmount}>
                        {formatCurrency(ing.cost, currency)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.costDivider} />

                <View style={styles.marginSection}>
                  <Text style={styles.marginLabel}>Margen de ganancia</Text>
                  <View style={styles.marginInputRow}>
                    <Text style={styles.marginX}>×</Text>
                    <TextInput
                      style={styles.marginInput}
                      value={marginMultiplier || String(formula.profitMargin ?? 2.5)}
                      onChangeText={(v) => {
                        setMarginMultiplier(v);
                        const parsed = parseFloat(v);
                        if (!isNaN(parsed) && parsed > 0) {
                          updateFormula(formula.id, { profitMargin: parsed });
                        }
                      }}
                      keyboardType="decimal-pad"
                      placeholder="2.5"
                      placeholderTextColor={Colors.light.textMuted}
                    />
                    <Text style={styles.marginHint}>del costo</Text>
                  </View>
                </View>

                <View style={styles.costHighlight}>
                  <Text style={styles.costHighlightLabel}>
                    Precio sugerido (×{effectiveMargin.toFixed(1)})
                  </Text>
                  <Text style={styles.costHighlightValue}>
                    {formatCurrency(suggestedPrice, currency)} /pieza
                  </Text>
                </View>
              </View>

              <View style={[styles.card, styles.profitCard]}>
                <Text style={styles.profitLabel}>Ganancia estimada</Text>
                <Text style={styles.profitValue}>
                  {formatCurrency(
                    suggestedPrice * formula.pieces - formula.totalCost,
                    currency
                  )}
                </Text>
                <Text style={styles.profitSub}>
                  por lote de {formula.pieces} piezas
                </Text>
                <View style={styles.profitBreakdown}>
                  <View style={styles.profitBreakdownItem}>
                    <Text style={styles.profitBreakdownLabel}>Ingreso total</Text>
                    <Text style={styles.profitBreakdownValue}>
                      {formatCurrency(suggestedPrice * formula.pieces, currency)}
                    </Text>
                  </View>
                  <View style={styles.profitBreakdownItem}>
                    <Text style={styles.profitBreakdownLabel}>Costo total</Text>
                    <Text style={[styles.profitBreakdownValue, { color: Colors.light.error }]}>
                      -{formatCurrency(formula.totalCost, currency)}
                    </Text>
                  </View>
                  <View style={styles.profitBreakdownDivider} />
                  <View style={styles.profitBreakdownItem}>
                    <Text style={styles.profitBreakdownLabel}>Margen %</Text>
                    <Text style={styles.profitBreakdownValue}>
                      {formula.totalCost > 0
                        ? Math.round(((suggestedPrice * formula.pieces - formula.totalCost) / (suggestedPrice * formula.pieces)) * 100)
                        : 0}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.shareActions}>
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={handleShare}
                  activeOpacity={0.7}
                >
                  <Share2 size={16} color={Colors.light.textInverse} />
                  <Text style={styles.shareBtnText}>Compartir ficha</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.printBtn}
                  onPress={handlePrint}
                  activeOpacity={0.7}
                >
                  <Printer size={16} color={Colors.light.primary} />
                  <Text style={styles.printBtnText}>Imprimir</Text>
                </TouchableOpacity>
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
  heroImage: {
    width: "100%",
    height: 180,
    marginHorizontal: 0,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  hero: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: -20,
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
  quickBtnPrimary: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  quickBtnDanger: {
    borderColor: Colors.light.errorMuted,
  },
  quickBtnText: {
    fontSize: 12,
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
    width: 60,
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
  profitBreakdown: {
    width: "100%",
    marginTop: 16,
    gap: 6,
  },
  profitBreakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profitBreakdownLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  profitBreakdownValue: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.success,
  },
  profitBreakdownDivider: {
    height: 1,
    backgroundColor: Colors.light.success,
    opacity: 0.3,
    marginVertical: 4,
  },
  costIngBreakdown: {
    gap: 8,
    marginBottom: 4,
  },
  costIngBreakdownTitle: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.light.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  costIngRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  costIngName: {
    width: 90,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  costIngBarWrap: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.backgroundTertiary,
    overflow: "hidden",
  },
  costIngBar: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  costIngAmount: {
    width: 55,
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.text,
    textAlign: "right",
  },
  marginSection: {
    marginBottom: 8,
  },
  marginLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  marginInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  marginX: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  marginInput: {
    width: 70,
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.primary,
    textAlign: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  marginHint: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  shareActions: {
    flexDirection: "row",
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.textInverse,
  },
  printBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.card,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  printBtnText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.primary,
  },
});

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  AppState as RNAppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Wheat,
  CakeSlice,
  Plus,
  Trash2,
  Droplets,
  Scale,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Clock,
  Thermometer,
  FlaskConical,
} from "lucide-react-native";
import { impactAsync, notificationAsync } from "@/utils/haptics";
import { showAlert } from "@/utils/alert";
import { useLocalSearchParams } from "expo-router";

import Colors from "@/constants/colors";
import { formatCurrency, formatCurrencyPerKg } from "@/constants/appConfig";
import useAppStore from "@/store/useAppStore";
import type { AreaType, SavedFormula } from "@/types";
import {
  type FormulaIngredient,
  type ProcessStep,
  calculateFormula,
  createDefaultIngredient,
  createFlourIngredient,
  createWaterIngredient,
  createDefaultStep,
  formatDuration,
  formatDecimal,
  recalcPercentagesFromGrams,
} from "@/utils/formulaEngine";
import { ALL_FORMULAS, type PrebuiltFormula } from "@/mocks/formulas";

export default function CalculatorScreen() {
  const { addFormula, updateFormula, formulas, currency, labDraft, setLabDraft } = useAppStore();
  const params = useLocalSearchParams<{ editId?: string }>();

  const [area, setArea] = useState<AreaType>(labDraft?.area ?? "panaderia");
  const [formulaName, setFormulaName] = useState(labDraft?.formulaName ?? "");
  const [ingredients, setIngredients] = useState<FormulaIngredient[]>(
    labDraft?.ingredients ?? [createFlourIngredient(), createWaterIngredient()]
  );
  const [pieces, setPieces] = useState(labDraft?.pieces ?? "10");
  const [weightPerPiece, setWeightPerPiece] = useState(labDraft?.weightPerPiece ?? "250");
  const [steps, setSteps] = useState<ProcessStep[]>(labDraft?.steps ?? []);
  const [showSteps, setShowSteps] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(labDraft?.editingFormulaId ?? null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const loadFormulaForEdit = useCallback((formula: SavedFormula) => {
    setEditingFormulaId(formula.id);
    setFormulaName(formula.name);
    setArea(formula.area);
    setIngredients(
      formula.ingredients.map((ing) => ({
        id: ing.id,
        name: ing.name,
        percentage: ing.percentage,
        grams: ing.grams,
        isFlour: ing.isFlour,
        isLiquid: ing.isLiquid,
        costPerKg: ing.costPerKg,
        locked: "none" as const,
        inputMode: "percentage" as const,
      }))
    );
    setPieces(String(formula.pieces));
    setWeightPerPiece(String(formula.weightPerPiece));
    setSteps(formula.steps.map((s) => ({ ...s })));
    setShowSteps(formula.steps.length > 0);
  }, []);

  const piecesNum = parseInt(pieces, 10) || 0;
  const weightNum = parseFloat(weightPerPiece) || 0;

  const result = useMemo(() => {
    return calculateFormula(area, ingredients, piecesNum, weightNum);
  }, [area, ingredients, piecesNum, weightNum]);

  useEffect(() => {
    if (params.editId && params.editId !== editingFormulaId) {
      const formula = formulas.find((f) => f.id === params.editId);
      if (formula) {
        loadFormulaForEdit(formula);
      }
    }
  }, [params.editId, editingFormulaId, formulas, loadFormulaForEdit]);

  useEffect(() => {
    const saveDraft = () => {
      setLabDraft({
        formulaName,
        area,
        ingredients,
        pieces,
        weightPerPiece,
        steps,
        editingFormulaId,
        timestamp: Date.now(),
      });
    };

    const sub = RNAppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        saveDraft();
      }
    });

    const interval = setInterval(saveDraft, 30000);

    return () => {
      sub.remove();
      clearInterval(interval);
      saveDraft();
    };
  }, [formulaName, area, ingredients, pieces, weightPerPiece, steps, editingFormulaId, setLabDraft]);

  useEffect(() => {
    if (result.totalWeight > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [result.totalWeight, pulseAnim]);

  const handleAreaSwitch = useCallback((newArea: AreaType) => {
    void impactAsync("Light");
    setArea(newArea);
    if (newArea === "panaderia") {
      setIngredients([createFlourIngredient(), createWaterIngredient()]);
    } else {
      setIngredients([
        { ...createFlourIngredient(), name: "Ingrediente base", percentage: 100 },
      ]);
    }
    setFormulaName("");
    setSteps([]);
    setShowSteps(false);
    setEditingFormulaId(null);
  }, []);

  const handleAddIngredient = useCallback(() => {
    void impactAsync("Light");
    setIngredients((prev) => [...prev, createDefaultIngredient(area)]);
  }, [area]);

  const handleRemoveIngredient = useCallback((id: string) => {
    void impactAsync("Light");
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleUpdateIngredient = useCallback(
    (id: string, field: keyof FormulaIngredient, value: string | boolean) => {
      setIngredients((prev) =>
        prev.map((ing) => {
          if (ing.id !== id) return ing;
          if (field === "percentage") {
            const parsed = parseFloat(value as string);
            return { ...ing, percentage: isNaN(parsed) ? 0 : parsed };
          }
          if (field === "grams") {
            const parsed = parseFloat(value as string);
            return { ...ing, grams: isNaN(parsed) ? 0 : parsed };
          }
          if (field === "costPerKg") {
            const parsed = parseFloat(value as string);
            return { ...ing, costPerKg: isNaN(parsed) ? 0 : parsed };
          }
          if (field === "isFlour" || field === "isLiquid") {
            return { ...ing, [field]: value as boolean };
          }
          if (field === "name") {
            return { ...ing, name: value as string };
          }
          return ing;
        })
      );
    },
    []
  );

  const handleGramsInput = useCallback(
    (id: string, gramsStr: string) => {
      const gramsVal = parseFloat(gramsStr) || 0;
      setIngredients((prev) => {
        const updated = prev.map((ing) =>
          ing.id === id ? { ...ing, grams: gramsVal, inputMode: "grams" as const } : ing
        );
        return recalcPercentagesFromGrams(updated, area);
      });
    },
    [area]
  );

  const handleToggleInputMode = useCallback((id: string) => {
    void impactAsync("Light");
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.id === id
          ? { ...ing, inputMode: ing.inputMode === "percentage" ? "grams" : "percentage" }
          : ing
      )
    );
  }, []);

  const handleToggleFlour = useCallback((id: string) => {
    void impactAsync("Light");
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.id === id ? { ...ing, isFlour: !ing.isFlour, isLiquid: false } : ing
      )
    );
  }, []);

  const handleToggleLiquid = useCallback((id: string) => {
    void impactAsync("Light");
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.id === id ? { ...ing, isLiquid: !ing.isLiquid, isFlour: false } : ing
      )
    );
  }, []);

  const handleAddStep = useCallback(() => {
    setSteps((prev) => [...prev, createDefaultStep()]);
  }, []);

  const handleRemoveStep = useCallback((id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleUpdateStep = useCallback(
    (id: string, field: keyof ProcessStep, value: string) => {
      setSteps((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          if (field === "duration" || field === "temperature") {
            return { ...s, [field]: parseInt(value, 10) || 0 };
          }
          return { ...s, [field]: value };
        })
      );
    },
    []
  );

  const handleReset = useCallback(() => {
    void impactAsync("Medium");
    setFormulaName("");
    setEditingFormulaId(null);
    if (area === "panaderia") {
      setIngredients([createFlourIngredient(), createWaterIngredient()]);
    } else {
      setIngredients([
        { ...createFlourIngredient(), name: "Ingrediente base", percentage: 100 },
      ]);
    }
    setPieces("10");
    setWeightPerPiece("250");
    setSteps([]);
    setShowSteps(false);
    setLabDraft(null);
  }, [area, setLabDraft]);

  const handleSave = useCallback(() => {
    if (!formulaName.trim()) {
      showAlert("Nombre requerido", "Ingresa un nombre para tu fórmula");
      return;
    }
    if (ingredients.length === 0) {
      showAlert("Sin ingredientes", "Agrega al menos un ingrediente");
      return;
    }
    if (result.totalWeight <= 0) {
      showAlert("Sin peso", "Define piezas y peso por pieza");
      return;
    }

    const savedIngredients = result.ingredients.map((ci) => ({
      id: ci.id,
      name: ci.name,
      percentage: ci.percentage,
      grams: ci.grams,
      cost: ci.cost,
      isFlour: ci.isFlour,
      isLiquid: ci.isLiquid,
      costPerKg: ingredients.find((i) => i.id === ci.id)?.costPerKg ?? 0,
    }));

    if (editingFormulaId) {
      updateFormula(editingFormulaId, {
        name: formulaName.trim(),
        area,
        ingredients: savedIngredients,
        steps,
        pieces: piecesNum,
        weightPerPiece: weightNum,
        hydration: result.hydration,
        totalWeight: result.totalWeight,
        totalCost: result.totalCost,
        costPerUnit: result.costPerUnit,
        tags: [area],
      });
      void notificationAsync("Success");
      showAlert("Actualizada", `"${formulaName}" actualizada exitosamente`);
    } else {
      const saved: SavedFormula = {
        id: `formula-${Date.now()}`,
        name: formulaName.trim(),
        area,
        description: "",
        ingredients: savedIngredients,
        steps,
        pieces: piecesNum,
        weightPerPiece: weightNum,
        hydration: result.hydration,
        totalWeight: result.totalWeight,
        totalCost: result.totalCost,
        costPerUnit: result.costPerUnit,
        profitMargin: 2.5,
        isFavorite: false,
        isPublic: false,
        tags: [area],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addFormula(saved);
      void notificationAsync("Success");
      showAlert("Guardada", `"${formulaName}" guardada en tus fórmulas`);
    }

    setLabDraft(null);
    handleReset();
  }, [formulaName, ingredients, result, area, steps, piecesNum, weightNum, addFormula, updateFormula, editingFormulaId, handleReset, setLabDraft]);

  const handleLoadTemplate = useCallback((template: PrebuiltFormula) => {
    void impactAsync("Medium");
    setFormulaName(template.name);
    setArea(template.area);
    setEditingFormulaId(null);
    setIngredients(
      template.ingredients.map((ing, idx) => ({
        id: `tmpl-${Date.now()}-${idx}`,
        name: ing.name,
        percentage: ing.percentage,
        grams: 0,
        isFlour: ing.isFlour,
        isLiquid: ing.isLiquid,
        costPerKg: ing.costPerKg,
        locked: "none" as const,
        inputMode: "percentage" as const,
      }))
    );
    setSteps(
      template.steps.map((s, idx) => ({
        id: `step-${Date.now()}-${idx}`,
        description: s.description,
        duration: s.duration,
        temperature: s.temperature,
      }))
    );
    setShowTemplates(false);
    setShowSteps(true);
  }, []);

  const templates = useMemo(
    () => ALL_FORMULAS.filter((f) => f.area === area),
    [area]
  );

  const currencyLabel = formatCurrencyPerKg(currency);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <FlaskConical size={20} color={Colors.light.primary} />
            <Text style={styles.appName}>
              {editingFormulaId ? "EDITANDO" : "LABORATORIO"}
            </Text>
          </View>
          <View style={styles.topBarActions}>
            <TouchableOpacity
              style={styles.templateBtn}
              onPress={() => setShowTemplates(!showTemplates)}
              activeOpacity={0.7}
            >
              <Text style={styles.templateBtnText}>Plantillas</Text>
              {showTemplates ? (
                <ChevronUp size={14} color={Colors.light.primary} />
              ) : (
                <ChevronDown size={14} color={Colors.light.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <RotateCcw size={16} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {editingFormulaId && (
            <View style={styles.editBanner}>
              <Text style={styles.editBannerText}>
                Editando fórmula existente
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingFormulaId(null);
                  handleReset();
                }}
              >
                <Text style={styles.editBannerCancel}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

          {showTemplates && (
            <View style={styles.templatesPanel}>
              <Text style={styles.templatesPanelTitle}>
                Cargar fórmula base
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.templatesRow}
              >
                {templates.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.templateCard}
                    onPress={() => handleLoadTemplate(t)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.templateCardName} numberOfLines={1}>
                      {t.name}
                    </Text>
                    <Text style={styles.templateCardMeta}>
                      {t.hydration > 0 ? `${t.hydration}% hid.` : t.category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.areaSwitch}>
            <TouchableOpacity
              style={[
                styles.areaSwitchBtn,
                area === "panaderia" && styles.areaSwitchBtnActive,
              ]}
              onPress={() => handleAreaSwitch("panaderia")}
              activeOpacity={0.7}
            >
              <Wheat
                size={18}
                color={
                  area === "panaderia"
                    ? Colors.light.textInverse
                    : Colors.light.textMuted
                }
              />
              <Text
                style={[
                  styles.areaSwitchText,
                  area === "panaderia" && styles.areaSwitchTextActive,
                ]}
              >
                Panadería
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.areaSwitchBtn,
                area === "pasteleria" && styles.areaSwitchBtnActiveGold,
              ]}
              onPress={() => handleAreaSwitch("pasteleria")}
              activeOpacity={0.7}
            >
              <CakeSlice
                size={18}
                color={
                  area === "pasteleria"
                    ? Colors.light.textInverse
                    : Colors.light.textMuted
                }
              />
              <Text
                style={[
                  styles.areaSwitchText,
                  area === "pasteleria" && styles.areaSwitchTextActive,
                ]}
              >
                Pastelería
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              placeholder="Nombre de la fórmula..."
              placeholderTextColor={Colors.light.textMuted}
              value={formulaName}
              onChangeText={setFormulaName}
              testID="formula-name-input"
            />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>FORMULACIÓN</Text>
              <Text style={styles.sectionHint}>
                {area === "panaderia"
                  ? "% panadero (harina = 100%)"
                  : "% proporcional del total"}
              </Text>
            </View>

            <View style={styles.ingTableHeader}>
              <Text style={[styles.ingColHeader, { flex: 1 }]}>
                Ingrediente
              </Text>
              <Text style={[styles.ingColHeader, styles.ingColCenter, { width: 65 }]}>
                % / g
              </Text>
              <Text style={[styles.ingColHeader, styles.ingColCenter, { width: 36 }]}>
                Tipo
              </Text>
              <Text style={[styles.ingColHeader, styles.ingColCenter, { width: 60 }]}>
                {currencyLabel}
              </Text>
              <View style={{ width: 28 }} />
            </View>

            {ingredients.map((ing, idx) => (
              <View key={ing.id} style={[styles.ingRow, idx % 2 === 0 && styles.ingRowAlt]}>
                <TextInput
                  style={[styles.ingNameInput, { flex: 1 }]}
                  value={ing.name}
                  onChangeText={(v) => handleUpdateIngredient(ing.id, "name", v)}
                  placeholder="Nombre"
                  placeholderTextColor={Colors.light.textMuted}
                />
                <View style={styles.dualInputWrap}>
                  <TextInput
                    style={styles.ingNumInput}
                    value={
                      ing.inputMode === "grams"
                        ? (ing.grams > 0 ? formatDecimal(ing.grams) : "")
                        : (ing.percentage > 0 ? formatDecimal(ing.percentage) : "")
                    }
                    onChangeText={(v) => {
                      if (ing.inputMode === "grams") {
                        handleGramsInput(ing.id, v);
                      } else {
                        handleUpdateIngredient(ing.id, "percentage", v);
                      }
                    }}
                    placeholder="0"
                    placeholderTextColor={Colors.light.textMuted}
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity
                    style={styles.modeToggle}
                    onPress={() => handleToggleInputMode(ing.id)}
                    hitSlop={4}
                  >
                    <Text style={styles.modeToggleText}>
                      {ing.inputMode === "grams" ? "g" : "%"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.ingTypeCol}>
                  <TouchableOpacity
                    style={[
                      styles.typeBadge,
                      ing.isFlour && styles.typeBadgeFlour,
                      ing.isLiquid && styles.typeBadgeLiquid,
                    ]}
                    onPress={() => {
                      if (ing.isFlour) {
                        handleToggleFlour(ing.id);
                      } else if (ing.isLiquid) {
                        handleToggleLiquid(ing.id);
                      } else {
                        if (area === "panaderia") {
                          handleToggleFlour(ing.id);
                        }
                      }
                    }}
                    onLongPress={() => {
                      if (area === "panaderia") {
                        handleToggleLiquid(ing.id);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        ing.isFlour && styles.typeBadgeTextFlour,
                        ing.isLiquid && styles.typeBadgeTextLiquid,
                      ]}
                    >
                      {ing.isFlour ? "H" : ing.isLiquid ? "L" : "·"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.ingNumInput, styles.costInput]}
                  value={ing.costPerKg > 0 ? formatDecimal(ing.costPerKg) : ""}
                  onChangeText={(v) =>
                    handleUpdateIngredient(ing.id, "costPerKg", v)
                  }
                  placeholder="0"
                  placeholderTextColor={Colors.light.textMuted}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={styles.ingDeleteBtn}
                  onPress={() => handleRemoveIngredient(ing.id)}
                  hitSlop={6}
                >
                  <Trash2 size={14} color={Colors.light.error} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addIngBtn}
              onPress={handleAddIngredient}
              activeOpacity={0.7}
            >
              <Plus size={16} color={Colors.light.primary} />
              <Text style={styles.addIngText}>Agregar ingrediente</Text>
            </TouchableOpacity>

            {area === "panaderia" && (
              <Text style={styles.typeHint}>
                Toca tipo: H = Harina, L = Líquido. Mantén presionado → Líquido. Toca % / g para cambiar modo de entrada.
              </Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>PARÁMETROS DE PRODUCCIÓN</Text>
            <View style={styles.paramsRow}>
              <View style={styles.paramGroup}>
                <Text style={styles.paramLabel}>Piezas</Text>
                <TextInput
                  style={styles.paramInput}
                  value={pieces}
                  onChangeText={setPieces}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.light.textMuted}
                  testID="pieces-input"
                />
              </View>
              <View style={styles.paramDivider}>
                <Text style={styles.paramX}>×</Text>
              </View>
              <View style={styles.paramGroup}>
                <Text style={styles.paramLabel}>Peso/pieza (g)</Text>
                <TextInput
                  style={styles.paramInput}
                  value={weightPerPiece}
                  onChangeText={setWeightPerPiece}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.light.textMuted}
                  testID="weight-input"
                />
              </View>
              <View style={styles.paramGroup}>
                <Text style={styles.paramLabel}>Total</Text>
                <View style={styles.paramTotal}>
                  <Text style={styles.paramTotalValue}>
                    {result.totalWeight > 0
                      ? `${(result.totalWeight / 1000).toFixed(2)} kg`
                      : "—"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {result.totalWeight > 0 && (
            <Animated.View
              style={[
                styles.sectionCard,
                styles.resultCard,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={styles.sectionTitle}>RESULTADO EN VIVO</Text>

              <View style={styles.statsRow}>
                {area === "panaderia" && (
                  <View style={styles.statBox}>
                    <Droplets size={18} color={Colors.light.water} />
                    <Text style={styles.statValue}>{result.hydration}%</Text>
                    <Text style={styles.statLabel}>Hidratación</Text>
                  </View>
                )}
                <View style={styles.statBox}>
                  <Scale size={18} color={Colors.light.primary} />
                  <Text style={styles.statValue}>
                    {result.weightPerUnit.toFixed(0)}g
                  </Text>
                  <Text style={styles.statLabel}>Por pieza</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statCurrency}>
                    {formatCurrency(result.totalCost, currency)}
                  </Text>
                  <Text style={styles.statLabel}>Costo total</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statCurrency}>
                    {formatCurrency(result.costPerUnit, currency)}
                  </Text>
                  <Text style={styles.statLabel}>Costo/pieza</Text>
                </View>
              </View>

              <View style={styles.resultTable}>
                <View style={styles.resultTableHeader}>
                  <Text style={[styles.rtHead, { flex: 1 }]}>Ingrediente</Text>
                  <Text style={[styles.rtHead, styles.rtRight, { width: 50 }]}>
                    %
                  </Text>
                  <Text style={[styles.rtHead, styles.rtRight, { width: 65 }]}>
                    Gramos
                  </Text>
                  <Text style={[styles.rtHead, styles.rtRight, { width: 60 }]}>
                    Costo
                  </Text>
                </View>
                {result.ingredients.map((ci, idx) => (
                  <View
                    key={ci.id}
                    style={[
                      styles.resultTableRow,
                      idx % 2 === 0 && styles.resultTableRowAlt,
                    ]}
                  >
                    <Text
                      style={[styles.rtCell, { flex: 1 }]}
                      numberOfLines={1}
                    >
                      {ci.name || "Sin nombre"}
                    </Text>
                    <Text
                      style={[
                        styles.rtCell,
                        styles.rtRight,
                        styles.rtMuted,
                        { width: 50 },
                      ]}
                    >
                      {formatDecimal(ci.percentage)}%
                    </Text>
                    <Text
                      style={[
                        styles.rtCell,
                        styles.rtRight,
                        styles.rtBold,
                        { width: 65 },
                      ]}
                    >
                      {ci.grams.toFixed(1)}
                    </Text>
                    <Text
                      style={[
                        styles.rtCell,
                        styles.rtRight,
                        styles.rtGreen,
                        { width: 60 },
                      ]}
                    >
                      {formatCurrency(ci.cost, currency)}
                    </Text>
                  </View>
                ))}
                <View style={styles.resultTableTotal}>
                  <Text style={[styles.rtTotalText, { flex: 1 }]}>Total</Text>
                  <Text style={[styles.rtTotalText, styles.rtRight, { width: 50 }]}>
                    {formatDecimal(result.totalPercentage)}%
                  </Text>
                  <Text style={[styles.rtTotalText, styles.rtRight, { width: 65 }]}>
                    {result.totalWeight.toFixed(0)}g
                  </Text>
                  <Text
                    style={[
                      styles.rtTotalText,
                      styles.rtRight,
                      styles.rtGreen,
                      { width: 60 },
                    ]}
                  >
                    {formatCurrency(result.totalCost, currency)}
                  </Text>
                </View>
              </View>

              <View style={styles.priceSuggestion}>
                <Text style={styles.priceSuggestionLabel}>
                  Precio sugerido (×2.5)
                </Text>
                <Text style={styles.priceSuggestionValue}>
                  {formatCurrency(result.costPerUnit * 2.5, currency)} /pieza
                </Text>
              </View>
            </Animated.View>
          )}

          <TouchableOpacity
            style={styles.stepsToggle}
            onPress={() => {
              setShowSteps(!showSteps);
              if (!showSteps && steps.length === 0) {
                handleAddStep();
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.stepsToggleLeft}>
              <Clock size={16} color={Colors.light.primary} />
              <Text style={styles.stepsToggleText}>
                Proceso ({steps.length} pasos)
              </Text>
            </View>
            {showSteps ? (
              <ChevronUp size={18} color={Colors.light.textMuted} />
            ) : (
              <ChevronDown size={18} color={Colors.light.textMuted} />
            )}
          </TouchableOpacity>

          {showSteps && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>PROCESO</Text>
              {steps.map((step, idx) => (
                <View key={step.id} style={styles.stepEditRow}>
                  <View style={styles.stepNumBadge}>
                    <Text style={styles.stepNumBadgeText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.stepEditFields}>
                    <TextInput
                      style={styles.stepDescInput}
                      value={step.description}
                      onChangeText={(v) =>
                        handleUpdateStep(step.id, "description", v)
                      }
                      placeholder="Descripción del paso..."
                      placeholderTextColor={Colors.light.textMuted}
                      multiline
                    />
                    <View style={styles.stepMetaRow}>
                      <View style={styles.stepMetaInput}>
                        <Clock size={12} color={Colors.light.textMuted} />
                        <TextInput
                          style={styles.stepMetaField}
                          value={step.duration > 0 ? String(step.duration) : ""}
                          onChangeText={(v) =>
                            handleUpdateStep(step.id, "duration", v)
                          }
                          placeholder="min"
                          placeholderTextColor={Colors.light.textMuted}
                          keyboardType="number-pad"
                        />
                      </View>
                      <View style={styles.stepMetaInput}>
                        <Thermometer size={12} color={Colors.light.warning} />
                        <TextInput
                          style={styles.stepMetaField}
                          value={
                            step.temperature && step.temperature > 0
                              ? String(step.temperature)
                              : ""
                          }
                          onChangeText={(v) =>
                            handleUpdateStep(step.id, "temperature", v)
                          }
                          placeholder="°C"
                          placeholderTextColor={Colors.light.textMuted}
                          keyboardType="number-pad"
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveStep(step.id)}
                        hitSlop={6}
                      >
                        <Trash2 size={14} color={Colors.light.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addIngBtn}
                onPress={handleAddStep}
                activeOpacity={0.7}
              >
                <Plus size={16} color={Colors.light.primary} />
                <Text style={styles.addIngText}>Agregar paso</Text>
              </TouchableOpacity>

              {steps.length > 0 && (
                <View style={styles.totalTimeRow}>
                  <Clock size={14} color={Colors.light.textSecondary} />
                  <Text style={styles.totalTimeText}>
                    Tiempo total:{" "}
                    {formatDuration(
                      steps.reduce((sum, s) => sum + s.duration, 0)
                    )}
                  </Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!formulaName.trim() || result.totalWeight <= 0) &&
                styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={!formulaName.trim() || result.totalWeight <= 0}
            testID="save-formula-button"
          >
            <Save size={18} color={Colors.light.textInverse} />
            <Text style={styles.saveButtonText}>
              {editingFormulaId ? "Actualizar fórmula" : "Guardar fórmula"}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appName: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.light.primary,
    letterSpacing: 2,
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  templateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.light.primaryMuted,
    borderRadius: 16,
  },
  templateBtnText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.primary,
  },
  resetBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  editBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.light.warningMuted,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.warning,
  },
  editBannerText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.warning,
  },
  editBannerCancel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.error,
  },
  templatesPanel: {
    marginBottom: 12,
  },
  templatesPanelTitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  templatesRow: {
    gap: 8,
    paddingRight: 16,
  },
  templateCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minWidth: 120,
  },
  templateCardName: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  templateCardMeta: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  areaSwitch: {
    flexDirection: "row",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  areaSwitchBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  areaSwitchBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  areaSwitchBtnActiveGold: {
    backgroundColor: Colors.light.gold,
  },
  areaSwitchText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.textMuted,
  },
  areaSwitchTextActive: {
    color: Colors.light.textInverse,
  },
  nameRow: {
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.primary,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 10,
    color: Colors.light.textMuted,
    fontStyle: "italic",
  },
  ingTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    marginBottom: 4,
    gap: 4,
  },
  ingColHeader: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.light.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ingColCenter: {
    textAlign: "center",
  },
  ingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 4,
  },
  ingRowAlt: {
    backgroundColor: Colors.light.backgroundSecondary,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 0,
  },
  ingNameInput: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: "500" as const,
    paddingVertical: 6,
    paddingHorizontal: 6,
    minHeight: 32,
  },
  dualInputWrap: {
    width: 65,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 6,
    overflow: "hidden",
  },
  ingNumInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: "600" as const,
    textAlign: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 32,
  },
  costInput: {
    width: 60,
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 32,
  },
  modeToggle: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderLeftWidth: 1,
    borderLeftColor: Colors.light.border,
    minHeight: 28,
    justifyContent: "center",
  },
  modeToggleText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  ingTypeCol: {
    width: 36,
    alignItems: "center",
  },
  typeBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadgeFlour: {
    backgroundColor: Colors.light.primaryMuted,
  },
  typeBadgeLiquid: {
    backgroundColor: Colors.light.waterMuted,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.textMuted,
  },
  typeBadgeTextFlour: {
    color: Colors.light.primary,
  },
  typeBadgeTextLiquid: {
    color: Colors.light.water,
  },
  ingDeleteBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  addIngBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderStyle: "dashed",
  },
  addIngText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.light.primary,
  },
  typeHint: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 8,
    fontStyle: "italic",
    textAlign: "center",
  },
  paramsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  paramGroup: {
    flex: 1,
  },
  paramLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.light.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  paramInput: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    textAlign: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  paramDivider: {
    paddingBottom: 14,
  },
  paramX: {
    fontSize: 18,
    fontWeight: "300" as const,
    color: Colors.light.textMuted,
  },
  paramTotal: {
    backgroundColor: Colors.light.primaryMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  paramTotalValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  resultCard: {
    borderColor: Colors.light.primary,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: 70,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.light.textMuted,
    textAlign: "center",
  },
  statCurrency: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.success,
  },
  resultTable: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  resultTableHeader: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.backgroundTertiary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  rtHead: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.light.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rtRight: {
    textAlign: "right",
  },
  resultTableRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  resultTableRowAlt: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  rtCell: {
    fontSize: 13,
    color: Colors.light.text,
  },
  rtMuted: {
    color: Colors.light.textMuted,
    fontSize: 12,
  },
  rtBold: {
    fontWeight: "600" as const,
  },
  rtGreen: {
    color: Colors.light.success,
    fontSize: 12,
  },
  resultTableTotal: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryMuted,
  },
  rtTotalText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  priceSuggestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  priceSuggestionLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  priceSuggestionValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.success,
  },
  stepsToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  stepsToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepsToggleText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  stepEditRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  stepNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  stepNumBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  stepEditFields: {
    flex: 1,
  },
  stepDescInput: {
    fontSize: 13,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 36,
    marginBottom: 6,
  },
  stepMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepMetaInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepMetaField: {
    fontSize: 12,
    color: Colors.light.text,
    width: 40,
    textAlign: "center",
  },
  totalTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: 4,
  },
  totalTimeText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  saveButtonDisabled: {
    opacity: 0.35,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.textInverse,
  },
});

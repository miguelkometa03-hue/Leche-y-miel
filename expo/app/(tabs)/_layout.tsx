// app/(tabs)/index.tsx  —  Laboratorio de Fórmulas
// Rediseño completo:
//   ✅ Tabla de ingredientes simplificada a 3 columnas (Nombre, Valor, Tipo)
//   ✅ Columna $/KG eliminada de la tabla principal
//   ✅ Toggle global % ↔ Gramos en la cabecera de la tabla
//   ✅ Gramos calculados automáticamente al cambiar piezas/peso
//   ✅ Modo "merma por horneo" con % configurable
//   ✅ Tema dinámico desde el store
//   ✅ Inputs con bordes visibles y contrast correcto

// @ts-nocheck

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
  Switch,
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
  Flame,
  Hash,
  Weight,
} from "lucide-react-native";
import { impactAsync, notificationAsync } from "@/utils/haptics";
import { showAlert } from "@/utils/alert";
import { useLocalSearchParams } from "expo-router";

import { THEMES } from "@/constants/colors";
import { formatCurrency } from "@/constants/appConfig";
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

const sanitize = (v: string) =>
  v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

// Modo de visualización global de la tabla de ingredientes
type TableMode = "percent" | "grams";

export default function LabScreen() {
  const {
    addFormula,
    updateFormula,
    formulas,
    currency,
    labDraft,
    setLabDraft,
    appTheme,
  } = useAppStore();
  const C = THEMES[appTheme] ?? THEMES.trigo;

  const params = useLocalSearchParams<{ editId?: string }>();

  // ── Estado del formulario ─────────────────────────────────────────────────
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
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(
    labDraft?.editingFormulaId ?? null
  );

  // ── Modo de la tabla: % o Gramos ──────────────────────────────────────────
  const [tableMode, setTableMode] = useState<TableMode>("percent");

  // ── Merma por horneo ──────────────────────────────────────────────────────
  const [bakingLoss, setBakingLoss] = useState(false);
  const [bakingLossPct, setBakingLossPct] = useState("15");

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Cálculos derivados ────────────────────────────────────────────────────
  const piecesNum = parseInt(pieces, 10) || 0;
  const weightNum = parseFloat(weightPerPiece) || 0;
  const bakingLossNum = parseFloat(bakingLossPct) || 0;

  // Peso crudo por pieza ajustado por merma
  const rawWeightPerPiece = useMemo(() => {
    if (bakingLoss && area === "panaderia" && bakingLossNum > 0) {
      return weightNum / (1 - bakingLossNum / 100);
    }
    return weightNum;
  }, [weightNum, bakingLoss, area, bakingLossNum]);

  const result = useMemo(
    () => calculateFormula(area, ingredients, piecesNum, rawWeightPerPiece),
    [area, ingredients, piecesNum, rawWeightPerPiece]
  );

  // ── Cargar fórmula para editar ────────────────────────────────────────────
  const loadFormulaForEdit = useCallback(
    (formula: SavedFormula) => {
      setLabDraft(null);
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
    },
    [setLabDraft]
  );

  useEffect(() => {
    if (params.editId && params.editId !== editingFormulaId) {
      const formula = formulas.find((f) => f.id === params.editId);
      if (formula) loadFormulaForEdit(formula);
    }
  }, [params.editId, editingFormulaId, formulas, loadFormulaForEdit]);

  // ── Guardar draft ─────────────────────────────────────────────────────────
  useEffect(() => {
    const save = () =>
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

    const interval = setInterval(save, 30000);

    if (Platform.OS === "web") {
      const onHide = () =>
        document.visibilityState === "hidden" && save();
      document.addEventListener("visibilitychange", onHide);
      window.addEventListener("beforeunload", save);
      return () => {
        document.removeEventListener("visibilitychange", onHide);
        window.removeEventListener("beforeunload", save);
        clearInterval(interval);
        save();
      };
    }
    return () => {
      clearInterval(interval);
      save();
    };
  }, [formulaName, area, ingredients, pieces, weightPerPiece, steps, editingFormulaId, setLabDraft]);

  // ── Animación de pulso en resultado ──────────────────────────────────────
  useEffect(() => {
    if (result.totalWeight > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.015, duration: 100, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
      ]).start();
    }
  }, [result.totalWeight, pulseAnim]);

  // ── Handlers de ingredientes ──────────────────────────────────────────────
  const handleAreaSwitch = useCallback((newArea: AreaType) => {
    void impactAsync("Light");
    setArea(newArea);
    setIngredients(
      newArea === "panaderia"
        ? [createFlourIngredient(), createWaterIngredient()]
        : [{ ...createFlourIngredient(), name: "Ingrediente base", percentage: 100 }]
    );
    setFormulaName("");
    setSteps([]);
    setEditingFormulaId(null);
    setBakingLoss(false);
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
          if (field === "percentage" || field === "grams" || field === "costPerKg") {
            const parsed = parseFloat(value as string);
            return { ...ing, [field]: isNaN(parsed) ? 0 : parsed };
          }
          return { ...ing, [field]: value };
        })
      );
    },
    []
  );

  // Cuando el usuario escribe gramos directamente, recalcula los porcentajes
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

  // ── Handlers de pasos ─────────────────────────────────────────────────────
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
    setIngredients(
      area === "panaderia"
        ? [createFlourIngredient(), createWaterIngredient()]
        : [{ ...createFlourIngredient(), name: "Ingrediente base", percentage: 100 }]
    );
    setPieces("10");
    setWeightPerPiece("250");
    setSteps([]);
    setShowSteps(false);
    setBakingLoss(false);
    setLabDraft(null);
  }, [area, setLabDraft]);

  const handleSave = useCallback(() => {
    if (!formulaName.trim()) {
      showAlert("Nombre requerido", "Ingresa un nombre para tu fórmula");
      return;
    }
    if (result.totalWeight <= 0) {
      showAlert("Sin datos", "Define piezas y peso para calcular la fórmula");
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
      showAlert("✅ Actualizada", `"${formulaName}" actualizada correctamente`);
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
      showAlert("✅ Guardada", `"${formulaName}" guardada en tus fórmulas`);
    }

    setLabDraft(null);
    handleReset();
  }, [formulaName, ingredients, result, area, steps, piecesNum, weightNum, addFormula, updateFormula, editingFormulaId, handleReset, setLabDraft]);

  const handleLoadTemplate = useCallback((t: PrebuiltFormula) => {
    void impactAsync("Medium");
    setFormulaName(t.name);
    setArea(t.area);
    setEditingFormulaId(null);
    setIngredients(
      t.ingredients.map((ing, idx) => ({
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
      t.steps.map((s, idx) => ({
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

  // ── Valor a mostrar en cada ingrediente según tableMode ───────────────────
  // En modo "grams": muestra los gramos CALCULADOS (del resultado)
  // En modo "percent": muestra el porcentaje editable
  const getIngredientDisplayValue = useCallback(
    (ing: FormulaIngredient): string => {
      if (tableMode === "grams") {
        const calculated = result.ingredients.find((r) => r.id === ing.id);
        const g = calculated?.grams ?? 0;
        return g > 0 ? String(Math.round(g)) : "";
      }
      return ing.percentage > 0 ? formatDecimal(ing.percentage) : "";
    },
    [tableMode, result.ingredients]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  const s = useMemo(() => makeStyles(C), [C]);

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── HEADER ── */}
        <View style={s.topBar}>
          <View style={s.topBarLeft}>
            <FlaskConical size={20} color={C.primary} />
            <Text style={s.appName}>
              {editingFormulaId ? "EDITANDO" : "LABORATORIO"}
            </Text>
          </View>
          <View style={s.topBarRight}>
            <TouchableOpacity
              style={s.templateBtn}
              onPress={() => setShowTemplates(!showTemplates)}
            >
              <Text style={s.templateBtnTxt}>Plantillas</Text>
              {showTemplates ? (
                <ChevronUp size={13} color={C.primary} />
              ) : (
                <ChevronDown size={13} color={C.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={handleReset}>
              <RotateCcw size={16} color={C.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps={Platform.OS === "web" ? "always" : "handled"}
        >
          {/* Banner de edición */}
          {editingFormulaId && (
            <View style={s.editBanner}>
              <Text style={s.editBannerTxt}>Editando fórmula existente</Text>
              <TouchableOpacity
                onPress={() => { setEditingFormulaId(null); handleReset(); }}
              >
                <Text style={s.editBannerCancel}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Plantillas */}
          {showTemplates && (
            <View style={s.templatesPanel}>
              <Text style={s.templatesPanelTitle}>Cargar plantilla base</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8, paddingRight: 16 }}>
                  {templates.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={s.templateCard}
                      onPress={() => handleLoadTemplate(t)}
                    >
                      <Text style={s.templateCardName} numberOfLines={1}>
                        {t.name}
                      </Text>
                      <Text style={s.templateCardMeta}>
                        {t.hydration > 0 ? `${t.hydration}% hid.` : t.category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Selector área */}
          <View style={s.areaSwitch}>
            <TouchableOpacity
              style={[s.areaBtn, area === "panaderia" && s.areaBtnActive]}
              onPress={() => handleAreaSwitch("panaderia")}
            >
              <Wheat
                size={16}
                color={area === "panaderia" ? C.textInverse : C.textMuted}
              />
              <Text
                style={[s.areaBtnTxt, area === "panaderia" && s.areaBtnTxtActive]}
              >
                Panadería
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.areaBtn, area === "pasteleria" && s.areaBtnPastelActive]}
              onPress={() => handleAreaSwitch("pasteleria")}
            >
              <CakeSlice
                size={16}
                color={area === "pasteleria" ? C.textInverse : C.textMuted}
              />
              <Text
                style={[s.areaBtnTxt, area === "pasteleria" && s.areaBtnTxtActive]}
              >
                Pastelería
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nombre */}
          <TextInput
            style={s.nameInput}
            placeholder="Nombre de la fórmula..."
            placeholderTextColor={C.textMuted}
            value={formulaName}
            onChangeText={setFormulaName}
          />

          {/* ── SECCIÓN FORMULACIÓN ── */}
          <View style={s.card}>
            {/* Cabecera con toggle % ↔ g */}
            <View style={s.sectionHeaderRow}>
              <View>
                <Text style={[s.sectionTitle, { color: C.primary }]}>
                  FORMULACIÓN
                </Text>
                <Text style={s.sectionHint}>
                  {area === "panaderia"
                    ? "% panadero (harina = 100%)"
                    : "% proporcional"}
                </Text>
              </View>

              {/* Toggle de modo de tabla: % ↔ g */}
              <View style={s.tableModeSwitch}>
                <TouchableOpacity
                  style={[
                    s.tableModeBtn,
                    tableMode === "percent" && { backgroundColor: C.primary },
                  ]}
                  onPress={() => {
                    void impactAsync("Light");
                    setTableMode("percent");
                  }}
                >
                  <Hash
                    size={12}
                    color={tableMode === "percent" ? C.textInverse : C.textMuted}
                  />
                  <Text
                    style={[
                      s.tableModeTxt,
                      tableMode === "percent" && { color: C.textInverse },
                    ]}
                  >
                    %
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    s.tableModeBtn,
                    tableMode === "grams" && { backgroundColor: C.primary },
                  ]}
                  onPress={() => {
                    void impactAsync("Light");
                    setTableMode("grams");
                  }}
                >
                  <Weight
                    size={12}
                    color={tableMode === "grams" ? C.textInverse : C.textMuted}
                  />
                  <Text
                    style={[
                      s.tableModeTxt,
                      tableMode === "grams" && { color: C.textInverse },
                    ]}
                  >
                    g
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cabecera de columnas: 3 columnas */}
            <View style={s.ingHeader}>
              <Text style={[s.ingCol, { flex: 1 }]}>Ingrediente</Text>
              <Text style={[s.ingCol, s.ingColCenter, { width: 80 }]}>
                {tableMode === "percent" ? "% / g" : "Gramos"}
              </Text>
              <Text style={[s.ingCol, s.ingColCenter, { width: 38 }]}>Tipo</Text>
              <View style={{ width: 32 }} />
            </View>

            {/* Filas de ingredientes */}
            {ingredients.map((ing, idx) => {
              const displayVal = getIngredientDisplayValue(ing);
              const isGramsMode = tableMode === "grams";

              return (
                <View
                  key={ing.id}
                  style={[
                    s.ingRow,
                    idx % 2 === 1 && { backgroundColor: C.backgroundSecondary },
                  ]}
                >
                  {/* Nombre */}
                  <TextInput
                    style={[s.ingNameInput, { flex: 1 }]}
                    value={ing.name}
                    onChangeText={(v) =>
                      handleUpdateIngredient(ing.id, "name", v)
                    }
                    placeholder="Nombre"
                    placeholderTextColor={C.textMuted}
                  />

                  {/* Valor: % editable ó gramos calculados (editables también) */}
                  <View style={[s.valueWrap, { width: 80 }]}>
                    <TextInput
                      style={s.valueInput}
                      value={
                        isGramsMode
                          ? displayVal
                          : ing.percentage > 0 ? formatDecimal(ing.percentage) : ""
                      }
                      onChangeText={(v) => {
                        const clean = sanitize(v);
                        if (isGramsMode) {
                          // En modo gramos: actualiza grams y recalcula %
                          handleGramsInput(ing.id, clean);
                        } else {
                          // En modo %: actualiza el porcentaje
                          handleUpdateIngredient(ing.id, "percentage", clean);
                        }
                      }}
                      placeholder={isGramsMode ? "0g" : "0%"}
                      placeholderTextColor={C.textMuted}
                      keyboardType="decimal-pad"
                      inputMode="decimal"
                      editable={!(isGramsMode && result.totalWeight === 0)}
                    />
                    <Text style={s.valueUnit}>
                      {isGramsMode ? "g" : "%"}
                    </Text>
                  </View>

                  {/* Badge de tipo: H (harina) | L (líquido) | · */}
                  <View style={{ width: 38, alignItems: "center" }}>
                    <TouchableOpacity
                      style={[
                        s.typeBadge,
                        ing.isFlour && { backgroundColor: C.primaryMuted, borderColor: C.primary },
                        ing.isLiquid && { backgroundColor: C.waterMuted, borderColor: C.water },
                      ]}
                      onPress={() => {
                        if (ing.isFlour) handleToggleFlour(ing.id);
                        else if (ing.isLiquid) handleToggleLiquid(ing.id);
                        else if (area === "panaderia") handleToggleFlour(ing.id);
                      }}
                      onLongPress={() => {
                        if (area === "panaderia") handleToggleLiquid(ing.id);
                      }}
                      hitSlop={6}
                    >
                      <Text
                        style={[
                          s.typeBadgeTxt,
                          ing.isFlour && { color: C.primary },
                          ing.isLiquid && { color: C.water },
                        ]}
                      >
                        {ing.isFlour ? "H" : ing.isLiquid ? "L" : "·"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Eliminar */}
                  <TouchableOpacity
                    style={{ width: 32, alignItems: "center" }}
                    onPress={() => handleRemoveIngredient(ing.id)}
                    hitSlop={6}
                  >
                    <Trash2 size={14} color={C.error} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Botón agregar */}
            <TouchableOpacity style={s.addIngBtn} onPress={handleAddIngredient}>
              <Plus size={15} color={C.primary} />
              <Text style={[s.addIngTxt, { color: C.primary }]}>
                Agregar ingrediente
              </Text>
            </TouchableOpacity>

            {area === "panaderia" && (
              <Text style={s.typeHint}>
                Toca tipo: H = Harina, L = Líquido (mantén presionado).{"\n"}
                Modo gramos: los valores muestran cantidades calculadas.
              </Text>
            )}
          </View>

          {/* ── PARÁMETROS DE PRODUCCIÓN ── */}
          <View style={s.card}>
            <Text style={[s.sectionTitle, { color: C.primary }]}>
              PARÁMETROS DE PRODUCCIÓN
            </Text>

            <View style={s.paramsRow}>
              <View style={s.paramGroup}>
                <Text style={s.paramLabel}>Piezas</Text>
                <TextInput
                  style={s.paramInput}
                  value={pieces}
                  onChangeText={setPieces}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  placeholder="0"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <Text style={s.paramX}>×</Text>

              <View style={s.paramGroup}>
                <Text style={s.paramLabel}>
                  {bakingLoss ? "Peso final/pieza (g)" : "Peso/pieza (g)"}
                </Text>
                <TextInput
                  style={s.paramInput}
                  value={weightPerPiece}
                  onChangeText={setWeightPerPiece}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  placeholder="0"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={s.paramGroup}>
                <Text style={s.paramLabel}>Total masa</Text>
                <View style={[s.paramTotal, { borderColor: C.primary, backgroundColor: C.primaryMuted }]}>
                  <Text style={[s.paramTotalVal, { color: C.primary }]}>
                    {result.totalWeight > 0
                      ? `${(result.totalWeight / 1000).toFixed(2)} kg`
                      : "—"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Merma por horneo */}
            {area === "panaderia" && (
              <View style={s.lossCard}>
                <View style={s.lossHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Flame size={14} color={C.warning} />
                    <Text style={[s.lossTitle, { color: C.warning }]}>
                      Merma por horneo
                    </Text>
                  </View>
                  <Switch
                    value={bakingLoss}
                    onValueChange={setBakingLoss}
                    trackColor={{ false: C.border, true: C.warning }}
                    thumbColor={C.textInverse}
                  />
                </View>
                {bakingLoss && (
                  <View style={s.lossBody}>
                    <View style={s.lossRow}>
                      <Text style={s.lossLabel}>% de pérdida:</Text>
                      <TextInput
                        style={[s.lossInput, { borderColor: C.warning, color: C.text }]}
                        value={bakingLossPct}
                        onChangeText={(v) => setBakingLossPct(sanitize(v))}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        placeholder="15"
                        placeholderTextColor={C.textMuted}
                      />
                      <Text style={s.lossLabel}>%</Text>
                    </View>
                    <Text style={s.lossHint}>
                      Masa cruda/pieza: {rawWeightPerPiece.toFixed(1)}g → Peso
                      horneado: {weightNum.toFixed(0)}g
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ── RESULTADO EN VIVO ── */}
          {result.totalWeight > 0 && (
            <Animated.View
              style={[
                s.card,
                { borderColor: C.primary, transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={[s.sectionTitle, { color: C.primary }]}>
                RESULTADO EN VIVO
              </Text>

              {/* Stats row */}
              <View style={s.statsRow}>
                {area === "panaderia" && (
                  <View style={[s.statBox, { backgroundColor: C.backgroundSecondary }]}>
                    <Droplets size={16} color={C.water} />
                    <Text style={[s.statVal, { color: C.text }]}>
                      {result.hydration}%
                    </Text>
                    <Text style={s.statLbl}>Hidratación</Text>
                  </View>
                )}
                <View style={[s.statBox, { backgroundColor: C.backgroundSecondary }]}>
                  <Scale size={16} color={C.primary} />
                  <Text style={[s.statVal, { color: C.text }]}>
                    {result.weightPerUnit.toFixed(0)}g
                  </Text>
                  <Text style={s.statLbl}>Por pieza</Text>
                </View>
                <View style={[s.statBox, { backgroundColor: C.backgroundSecondary }]}>
                  <Text style={[s.statVal, { color: C.success }]}>
                    {formatCurrency(result.totalCost, currency)}
                  </Text>
                  <Text style={s.statLbl}>Costo total</Text>
                </View>
                <View style={[s.statBox, { backgroundColor: C.backgroundSecondary }]}>
                  <Text style={[s.statVal, { color: C.success }]}>
                    {formatCurrency(result.costPerUnit, currency)}
                  </Text>
                  <Text style={s.statLbl}>Costo/pieza</Text>
                </View>
              </View>

              {/* Tabla de resultados */}
              <View style={[s.resultTable, { borderColor: C.border }]}>
                <View style={[s.resultHead, { backgroundColor: C.backgroundTertiary }]}>
                  <Text style={[s.rtH, { flex: 1 }]}>Ingrediente</Text>
                  <Text style={[s.rtH, s.rtR, { width: 52 }]}>%</Text>
                  <Text style={[s.rtH, s.rtR, { width: 70 }]}>Gramos</Text>
                  <Text style={[s.rtH, s.rtR, { width: 64 }]}>Costo</Text>
                </View>

                {result.ingredients.map((ci, idx) => (
                  <View
                    key={ci.id}
                    style={[
                      s.resultRow,
                      idx % 2 === 0 && { backgroundColor: C.backgroundSecondary },
                    ]}
                  >
                    <Text style={[s.rtC, { flex: 1 }]} numberOfLines={1}>
                      {ci.name || "Sin nombre"}
                    </Text>
                    <Text style={[s.rtC, s.rtR, s.rtMuted, { width: 52 }]}>
                      {formatDecimal(ci.percentage)}%
                    </Text>
                    <Text style={[s.rtC, s.rtR, s.rtBold, { width: 70 }]}>
                      {ci.grams.toFixed(1)}g
                    </Text>
                    <Text style={[s.rtC, s.rtR, { color: C.success, width: 64 }]}>
                      {formatCurrency(ci.cost, currency)}
                    </Text>
                  </View>
                ))}

                <View
                  style={[
                    s.resultTotal,
                    { borderTopColor: C.primary, backgroundColor: C.primaryMuted },
                  ]}
                >
                  <Text style={[s.rtTot, { flex: 1 }]}>TOTAL</Text>
                  <Text style={[s.rtTot, s.rtR, { width: 52 }]}>
                    {formatDecimal(result.totalPercentage)}%
                  </Text>
                  <Text style={[s.rtTot, s.rtR, { width: 70 }]}>
                    {result.totalWeight.toFixed(0)}g
                  </Text>
                  <Text style={[s.rtTot, s.rtR, { color: C.success, width: 64 }]}>
                    {formatCurrency(result.totalCost, currency)}
                  </Text>
                </View>
              </View>

              {/* Precio sugerido */}
              <View style={s.priceSugg}>
                <Text style={[s.priceSuggLabel, { color: C.textSecondary }]}>
                  Precio sugerido (×2.5)
                </Text>
                <Text style={[s.priceSuggVal, { color: C.success }]}>
                  {formatCurrency(result.costPerUnit * 2.5, currency)} /pieza
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── PROCESO ── */}
          <TouchableOpacity
            style={[s.stepsToggle, { backgroundColor: C.card, borderColor: C.border }]}
            onPress={() => {
              setShowSteps(!showSteps);
              if (!showSteps && steps.length === 0) handleAddStep();
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Clock size={15} color={C.primary} />
              <Text style={[s.stepsToggleTxt, { color: C.text }]}>
                Proceso ({steps.length} pasos)
              </Text>
            </View>
            {showSteps ? (
              <ChevronUp size={17} color={C.textMuted} />
            ) : (
              <ChevronDown size={17} color={C.textMuted} />
            )}
          </TouchableOpacity>

          {showSteps && (
            <View style={s.card}>
              <Text style={[s.sectionTitle, { color: C.primary }]}>PROCESO</Text>
              {steps.map((step, idx) => (
                <View key={step.id} style={s.stepRow}>
                  <View style={[s.stepNum, { backgroundColor: C.primaryMuted }]}>
                    <Text style={[s.stepNumTxt, { color: C.primary }]}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[s.stepDesc, { backgroundColor: C.backgroundTertiary, color: C.text }]}
                      value={step.description}
                      onChangeText={(v) =>
                        handleUpdateStep(step.id, "description", v)
                      }
                      placeholder="Descripción del paso..."
                      placeholderTextColor={C.textMuted}
                      multiline
                    />
                    <View style={s.stepMeta}>
                      <View style={[s.stepMetaBox, { backgroundColor: C.backgroundTertiary }]}>
                        <Clock size={11} color={C.textMuted} />
                        <TextInput
                          style={[s.stepMetaInput, { color: C.text }]}
                          value={step.duration > 0 ? String(step.duration) : ""}
                          onChangeText={(v) =>
                            handleUpdateStep(step.id, "duration", v)
                          }
                          placeholder="min"
                          placeholderTextColor={C.textMuted}
                          keyboardType="number-pad"
                          inputMode="numeric"
                        />
                      </View>
                      <View style={[s.stepMetaBox, { backgroundColor: C.backgroundTertiary }]}>
                        <Thermometer size={11} color={C.warning} />
                        <TextInput
                          style={[s.stepMetaInput, { color: C.text }]}
                          value={
                            step.temperature && step.temperature > 0
                              ? String(step.temperature)
                              : ""
                          }
                          onChangeText={(v) =>
                            handleUpdateStep(step.id, "temperature", v)
                          }
                          placeholder="°C"
                          placeholderTextColor={C.textMuted}
                          keyboardType="number-pad"
                          inputMode="numeric"
                        />
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveStep(step.id)}>
                        <Trash2 size={14} color={C.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={s.addIngBtn} onPress={handleAddStep}>
                <Plus size={15} color={C.primary} />
                <Text style={[s.addIngTxt, { color: C.primary }]}>Agregar paso</Text>
              </TouchableOpacity>

              {steps.length > 0 && (
                <View style={s.totalTime}>
                  <Clock size={13} color={C.textSecondary} />
                  <Text style={[s.totalTimeTxt, { color: C.textSecondary }]}>
                    Tiempo total:{" "}
                    {formatDuration(steps.reduce((sum, s) => sum + s.duration, 0))}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── BOTÓN GUARDAR ── */}
          <TouchableOpacity
            style={[
              s.saveBtn,
              { backgroundColor: C.primary },
              (!formulaName.trim() || result.totalWeight <= 0) && s.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!formulaName.trim() || result.totalWeight <= 0}
          >
            <Save size={17} color={C.textInverse} />
            <Text style={[s.saveBtnTxt, { color: C.textInverse }]}>
              {editingFormulaId ? "Actualizar fórmula" : "Guardar fórmula"}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Estilos dinámicos (recalculados al cambiar tema) ─────────────────────────
function makeStyles(C: ReturnType<typeof import("@/constants/colors").THEMES.trigo.valueOf>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },

    // Header
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 10,
    },
    topBarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    appName: {
      fontSize: 15,
      fontWeight: "800",
      color: C.primary,
      letterSpacing: 2,
    },
    topBarRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    templateBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: C.primaryMuted,
      borderRadius: 16,
    },
    templateBtnTxt: { fontSize: 12, fontWeight: "600", color: C.primary },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },

    scroll: { paddingHorizontal: 14, paddingBottom: 20 },

    editBanner: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: C.warningMuted,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: C.warning,
    },
    editBannerTxt: { fontSize: 13, fontWeight: "600", color: C.warning },
    editBannerCancel: { fontSize: 13, fontWeight: "600", color: C.error },

    templatesPanel: { marginBottom: 10 },
    templatesPanelTitle: {
      fontSize: 11,
      fontWeight: "600",
      color: C.textSecondary,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    templateCard: {
      backgroundColor: C.card,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: C.border,
      minWidth: 110,
    },
    templateCardName: {
      fontSize: 12,
      fontWeight: "600",
      color: C.text,
      marginBottom: 2,
    },
    templateCardMeta: { fontSize: 10, color: C.textMuted },

    areaSwitch: {
      flexDirection: "row",
      backgroundColor: C.backgroundSecondary,
      borderRadius: 12,
      padding: 4,
      marginBottom: 10,
    },
    areaBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 9,
      borderRadius: 8,
    },
    areaBtnActive: { backgroundColor: C.primary },
    areaBtnPastelActive: { backgroundColor: C.gold },
    areaBtnTxt: { fontSize: 13, fontWeight: "600", color: C.textMuted },
    areaBtnTxtActive: { color: C.textInverse },

    nameInput: {
      backgroundColor: C.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      fontWeight: "600",
      color: C.text,
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: 10,
    },

    card: {
      backgroundColor: C.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: C.border,
    },

    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.1,
      marginBottom: 2,
    },
    sectionHint: { fontSize: 10, color: C.textMuted, fontStyle: "italic" },

    // Toggle de modo de tabla
    tableModeSwitch: {
      flexDirection: "row",
      backgroundColor: C.backgroundTertiary,
      borderRadius: 8,
      padding: 2,
      gap: 2,
    },
    tableModeBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
    },
    tableModeTxt: {
      fontSize: 11,
      fontWeight: "700",
      color: C.textMuted,
    },

    // Tabla de ingredientes - 3 columnas
    ingHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      marginBottom: 2,
    },
    ingCol: {
      fontSize: 10,
      fontWeight: "700",
      color: C.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    ingColCenter: { textAlign: "center" },

    ingRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 5,
      gap: 6,
      overflow: "hidden",
    },
    ingNameInput: {
      fontSize: 13,
      color: C.text,
      fontWeight: "500",
      paddingVertical: 7,
      paddingHorizontal: 8,
      minHeight: 36,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 8,
      backgroundColor: C.inputBg,
      minWidth: 0,
      flexShrink: 1,
    },

    // Input de valor (% o gramos)
    valueWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.inputBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.inputBorder,
      overflow: "hidden",
      minHeight: 36,
    },
    valueInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: C.text,
      textAlign: "center",
      paddingVertical: 7,
      paddingHorizontal: 4,
    },
    valueUnit: {
      fontSize: 10,
      fontWeight: "700",
      color: C.primary,
      paddingRight: 6,
      paddingLeft: 2,
    },

    // Badge tipo H/L
    typeBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: C.backgroundTertiary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    typeBadgeTxt: {
      fontSize: 11,
      fontWeight: "800",
      color: C.textMuted,
    },

    addIngBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 9,
      marginTop: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.border,
      borderStyle: "dashed",
    },
    addIngTxt: { fontSize: 13, fontWeight: "500" },
    typeHint: {
      fontSize: 10,
      color: C.textMuted,
      marginTop: 8,
      fontStyle: "italic",
      textAlign: "center",
      lineHeight: 15,
    },

    // Parámetros de producción
    paramsRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      marginBottom: 10,
    },
    paramGroup: { flex: 1 },
    paramLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: C.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 5,
    },
    paramInput: {
      backgroundColor: C.inputBg,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 11,
      fontSize: 17,
      fontWeight: "700",
      color: C.text,
      textAlign: "center",
      borderWidth: 1,
      borderColor: C.inputBorder,
    },
    paramX: {
      fontSize: 17,
      fontWeight: "300",
      color: C.textMuted,
      paddingBottom: 12,
    },
    paramTotal: {
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 11,
      alignItems: "center",
      borderWidth: 1,
    },
    paramTotalVal: { fontSize: 15, fontWeight: "700" },

    // Merma
    lossCard: {
      backgroundColor: C.backgroundSecondary,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: C.warningMuted,
      marginTop: 4,
    },
    lossHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    lossTitle: { fontSize: 13, fontWeight: "600" },
    lossBody: { marginTop: 8, gap: 6 },
    lossRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    lossLabel: { fontSize: 12, color: C.textSecondary, fontWeight: "500" },
    lossInput: {
      backgroundColor: C.inputBg,
      borderRadius: 7,
      paddingHorizontal: 8,
      paddingVertical: 5,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
      width: 56,
      borderWidth: 1,
    },
    lossHint: { fontSize: 10, color: C.textMuted, fontStyle: "italic" },

    // Resultado
    statsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 14,
    },
    statBox: {
      flex: 1,
      minWidth: 68,
      borderRadius: 10,
      padding: 9,
      alignItems: "center",
      gap: 3,
    },
    statVal: { fontSize: 16, fontWeight: "700" },
    statLbl: { fontSize: 9, color: C.textMuted, textAlign: "center" },

    resultTable: {
      borderRadius: 10,
      overflow: "hidden",
      borderWidth: 1,
    },
    resultHead: {
      flexDirection: "row",
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    rtH: {
      fontSize: 10,
      fontWeight: "700",
      color: C.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    rtR: { textAlign: "right" },

    resultRow: {
      flexDirection: "row",
      paddingHorizontal: 10,
      paddingVertical: 7,
      alignItems: "center",
    },
    rtC: { fontSize: 13, color: C.text },
    rtMuted: { color: C.textMuted, fontSize: 12 },
    rtBold: { fontWeight: "600" },

    resultTotal: {
      flexDirection: "row",
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderTopWidth: 2,
    },
    rtTot: { fontSize: 12, fontWeight: "700", color: C.text },

    priceSugg: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: C.border,
    },
    priceSuggLabel: { fontSize: 12 },
    priceSuggVal: { fontSize: 15, fontWeight: "700" },

    // Proceso
    stepsToggle: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 10,
      borderWidth: 1,
    },
    stepsToggleTxt: { fontSize: 13, fontWeight: "600" },

    stepRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
    stepNum: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    stepNumTxt: { fontSize: 11, fontWeight: "700" },
    stepDesc: {
      borderRadius: 7,
      paddingHorizontal: 8,
      paddingVertical: 7,
      fontSize: 13,
      minHeight: 34,
      marginBottom: 5,
    },
    stepMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
    stepMetaBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 7,
      paddingHorizontal: 7,
      paddingVertical: 4,
    },
    stepMetaInput: { fontSize: 12, width: 38, textAlign: "center" },
    totalTime: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: C.border,
      marginTop: 4,
    },
    totalTimeTxt: { fontSize: 12, fontWeight: "600" },

    saveBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      paddingVertical: 15,
      borderRadius: 12,
    },
    saveBtnDisabled: { opacity: 0.35 },
    saveBtnTxt: { fontSize: 15, fontWeight: "700" },
  });
}

// Fix TypeScript: cast para que makeStyles acepte el tipo correcto
type Palette = typeof import("@/constants/colors").THEMES.trigo;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeStylesTyped(C: any) { return makeStyles(C as Palette); }
// Override para no romper ts
const _makeStyles = makeStylesTyped;
void _makeStyles;

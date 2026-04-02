import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CalendarDays,
  Plus,
  Trash2,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
  Package,
  Wheat,
  CakeSlice,
  Scale,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { formatCurrency } from "@/constants/appConfig";
import useAppStore from "@/store/useAppStore";
import type { ProductionPlanItem } from "@/types";

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function isToday(dateStr: string): boolean {
  return dateStr === formatDateKey(new Date());
}

export default function PlannerScreen() {
  const {
    formulas,
    productionPlan,
    addProductionItem,
    updateProductionItem,
    deleteProductionItem,
    addProductionHistory,
    currency,
  } = useAppStore();

  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);
  const [planPieces, setPlanPieces] = useState("10");

  const weekDates = useMemo(() => {
    const base = new Date(selectedDate + "T12:00:00");
    const dayOfWeek = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - ((dayOfWeek + 6) % 7));
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(formatDateKey(d));
    }
    return dates;
  }, [selectedDate]);

  const dayItems = useMemo(
    () => productionPlan.filter((p) => p.date === selectedDate),
    [productionPlan, selectedDate]
  );

  const dayTotals = useMemo(() => {
    return {
      pieces: dayItems.reduce((sum, i) => sum + i.pieces, 0),
      weight: dayItems.reduce((sum, i) => sum + i.totalWeight, 0),
      cost: dayItems.reduce((sum, i) => sum + i.totalCost, 0),
    };
  }, [dayItems]);

  const navigateWeek = useCallback((dir: number) => {
    setSelectedDate((prev) => {
      const d = new Date(prev + "T12:00:00");
      d.setDate(d.getDate() + dir * 7);
      return formatDateKey(d);
    });
  }, []);

  const handleAddItem = useCallback(() => {
    if (!selectedFormulaId) {
      Alert.alert("Selecciona una fórmula", "Elige qué producir");
      return;
    }
    const formula = formulas.find((f) => f.id === selectedFormulaId);
    if (!formula) return;

    const pcs = parseInt(planPieces, 10) || 0;
    if (pcs <= 0) {
      Alert.alert("Piezas inválidas", "Ingresa un número de piezas");
      return;
    }

    const scaleFactor = pcs / (formula.pieces || 1);
    const item: ProductionPlanItem = {
      id: `plan-${Date.now()}`,
      formulaId: formula.id,
      formulaName: formula.name,
      area: formula.area,
      date: selectedDate,
      pieces: pcs,
      weightPerPiece: formula.weightPerPiece,
      totalWeight: Math.round(formula.totalWeight * scaleFactor),
      totalCost: Math.round(formula.totalCost * scaleFactor * 100) / 100,
      status: "pendiente",
      createdAt: new Date().toISOString(),
    };

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addProductionItem(item);
    setShowAddForm(false);
    setSelectedFormulaId(null);
    setPlanPieces("10");
  }, [selectedFormulaId, planPieces, formulas, selectedDate, addProductionItem]);

  const handleToggleStatus = useCallback(
    (item: ProductionPlanItem) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextStatus =
        item.status === "pendiente"
          ? "en_proceso"
          : item.status === "en_proceso"
          ? "completado"
          : "pendiente";

      updateProductionItem(item.id, { status: nextStatus });

      if (nextStatus === "completado") {
        addProductionHistory({
          id: `ph-${Date.now()}`,
          formulaId: item.formulaId,
          formulaName: item.formulaName,
          date: item.date,
          pieces: item.pieces,
          totalCost: item.totalCost,
          totalWeight: item.totalWeight,
        });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [updateProductionItem, addProductionHistory]
  );

  const handleDeleteItem = useCallback(
    (id: string) => {
      Alert.alert("Eliminar", "¿Eliminar este item de producción?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteProductionItem(id);
          },
        },
      ]);
    },
    [deleteProductionItem]
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pendiente":
        return { color: Colors.light.warning, label: "Pendiente", bg: Colors.light.warningMuted };
      case "en_proceso":
        return { color: Colors.light.water, label: "En proceso", bg: Colors.light.waterMuted };
      case "completado":
        return { color: Colors.light.success, label: "Completado", bg: Colors.light.successMuted };
      default:
        return { color: Colors.light.textMuted, label: status, bg: Colors.light.backgroundTertiary };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Producción</Text>
          <Text style={styles.subtitle}>Planifica tu día</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddForm(!showAddForm)}
          activeOpacity={0.7}
        >
          <Plus size={20} color={Colors.light.textInverse} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => navigateWeek(-1)} hitSlop={10}>
          <ChevronLeft size={20} color={Colors.light.textSecondary} />
        </TouchableOpacity>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekRow}
        >
          {weekDates.map((d) => {
            const isSelected = d === selectedDate;
            const isTodayDate = isToday(d);
            const dayParts = d.split("-");
            const dayNum = parseInt(dayParts[2], 10);
            const dayName = ["D", "L", "M", "X", "J", "V", "S"][
              new Date(d + "T12:00:00").getDay()
            ];
            const hasItems = productionPlan.some((p) => p.date === d);
            return (
              <TouchableOpacity
                key={d}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isTodayDate && !isSelected && styles.dayCellToday,
                ]}
                onPress={() => setSelectedDate(d)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayName,
                    isSelected && styles.dayNameSelected,
                  ]}
                >
                  {dayName}
                </Text>
                <Text
                  style={[
                    styles.dayNum,
                    isSelected && styles.dayNumSelected,
                  ]}
                >
                  {dayNum}
                </Text>
                {hasItems && <View style={[styles.dayDot, isSelected && styles.dayDotSelected]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity onPress={() => navigateWeek(1)} hitSlop={10}>
          <ChevronRight size={20} color={Colors.light.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.dateLabel}>
        <CalendarDays size={14} color={Colors.light.primary} />
        <Text style={styles.dateLabelText}>{formatDateDisplay(selectedDate)}</Text>
        {isToday(selectedDate) && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>HOY</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>Agregar producción</Text>
            <Text style={styles.addFormLabel}>Fórmula</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.formulaPicker}
            >
              {formulas.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.formulaPickerItem,
                    selectedFormulaId === f.id && styles.formulaPickerItemActive,
                  ]}
                  onPress={() => setSelectedFormulaId(f.id)}
                  activeOpacity={0.7}
                >
                  {f.imageUrl ? (
                    <Image source={{ uri: f.imageUrl }} style={styles.formulaPickerImg} />
                  ) : (
                    <View style={styles.formulaPickerImgFallback}>
                      {f.area === "panaderia" ? (
                        <Wheat size={14} color={Colors.light.primary} />
                      ) : (
                        <CakeSlice size={14} color={Colors.light.gold} />
                      )}
                    </View>
                  )}
                  <Text style={styles.formulaPickerName} numberOfLines={1}>
                    {f.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.addFormLabel}>Piezas a producir</Text>
            <TextInput
              style={styles.addFormInput}
              value={planPieces}
              onChangeText={setPlanPieces}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor={Colors.light.textMuted}
            />

            <View style={styles.addFormActions}>
              <TouchableOpacity
                style={styles.addFormCancel}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.addFormCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addFormSubmit}
                onPress={handleAddItem}
                activeOpacity={0.8}
              >
                <Plus size={16} color={Colors.light.textInverse} />
                <Text style={styles.addFormSubmitText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {dayItems.length > 0 && (
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Package size={14} color={Colors.light.primary} />
              <Text style={styles.summaryValue}>{dayTotals.pieces}</Text>
              <Text style={styles.summaryLabel}>piezas</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Scale size={14} color={Colors.light.textSecondary} />
              <Text style={styles.summaryValue}>
                {(dayTotals.weight / 1000).toFixed(1)}kg
              </Text>
              <Text style={styles.summaryLabel}>total</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValueGreen}>
                {formatCurrency(dayTotals.cost, currency)}
              </Text>
              <Text style={styles.summaryLabel}>costo</Text>
            </View>
          </View>
        )}

        {dayItems.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <CalendarDays size={32} color={Colors.light.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Sin producción</Text>
            <Text style={styles.emptySubtitle}>
              Toca + para planificar la producción de este día
            </Text>
          </View>
        ) : (
          dayItems.map((item) => {
            const statusConfig = getStatusConfig(item.status);
            const formula = formulas.find((f) => f.id === item.formulaId);
            return (
              <View key={item.id} style={styles.planCard}>
                <View style={styles.planCardTop}>
                  <View style={styles.planCardLeft}>
                    {formula?.imageUrl ? (
                      <Image source={{ uri: formula.imageUrl }} style={styles.planCardImg} />
                    ) : (
                      <View style={styles.planCardImgFallback}>
                        {item.area === "panaderia" ? (
                          <Wheat size={18} color={Colors.light.primary} />
                        ) : (
                          <CakeSlice size={18} color={Colors.light.gold} />
                        )}
                      </View>
                    )}
                    <View style={styles.planCardInfo}>
                      <Text style={styles.planCardName} numberOfLines={1}>
                        {item.formulaName}
                      </Text>
                      <Text style={styles.planCardMeta}>
                        {item.pieces} piezas × {item.weightPerPiece}g
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.planCardDelete}
                    onPress={() => handleDeleteItem(item.id)}
                    hitSlop={8}
                  >
                    <Trash2 size={14} color={Colors.light.error} />
                  </TouchableOpacity>
                </View>

                <View style={styles.planCardStats}>
                  <Text style={styles.planCardWeight}>
                    {(item.totalWeight / 1000).toFixed(1)}kg
                  </Text>
                  <Text style={styles.planCardCost}>
                    {formatCurrency(item.totalCost, currency)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: statusConfig.bg }]}
                  onPress={() => handleToggleStatus(item)}
                  activeOpacity={0.7}
                >
                  {item.status === "completado" && (
                    <Check size={14} color={statusConfig.color} />
                  )}
                  {item.status === "en_proceso" && (
                    <Clock size={14} color={statusConfig.color} />
                  )}
                  <Text style={[styles.statusBtnText, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
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
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
  },
  dayCell: {
    width: 42,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
  },
  dayCellSelected: {
    backgroundColor: Colors.light.primary,
  },
  dayCellToday: {
    backgroundColor: Colors.light.primaryMuted,
  },
  dayName: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.light.textMuted,
    marginBottom: 4,
  },
  dayNameSelected: {
    color: Colors.light.textInverse,
  },
  dayNum: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  dayNumSelected: {
    color: Colors.light.textInverse,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.light.primary,
    marginTop: 4,
  },
  dayDotSelected: {
    backgroundColor: Colors.light.textInverse,
  },
  dateLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dateLabelText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  todayBadge: {
    backgroundColor: Colors.light.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.light.primary,
    letterSpacing: 0.5,
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
  addFormLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  formulaPicker: {
    gap: 8,
    paddingBottom: 8,
  },
  formulaPickerItem: {
    alignItems: "center",
    width: 80,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  formulaPickerItemActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryMuted,
  },
  formulaPickerImg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginBottom: 4,
  },
  formulaPickerImgFallback: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  formulaPickerName: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.light.text,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  addFormInput: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
    textAlign: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 12,
  },
  addFormActions: {
    flexDirection: "row",
    gap: 10,
  },
  addFormCancel: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  addFormCancelText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  addFormSubmit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
  },
  addFormSubmitText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.textInverse,
  },
  summaryBar: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  summaryValueGreen: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.success,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.light.textMuted,
  },
  planCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  planCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  planCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  planCardImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  planCardImgFallback: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  planCardInfo: {
    flex: 1,
  },
  planCardName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  planCardMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  planCardDelete: {
    padding: 4,
  },
  planCardStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  planCardWeight: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  planCardCost: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.success,
  },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
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

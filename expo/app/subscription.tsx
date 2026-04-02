import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Crown,
  Check,
  Zap,
  Building2,
  Lock,
} from "lucide-react-native";
import { useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import useAppStore from "@/store/useAppStore";
import { SUBSCRIPTION_PLANS, getTierColor, getTierLabel } from "@/constants/subscriptions";
import type { SubscriptionTier } from "@/types";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { subscription, setSubscription } = useAppStore();

  const handleSelectPlan = useCallback((tier: SubscriptionTier) => {
    if (tier === subscription) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (tier === "free") {
      Alert.alert(
        "Cambiar a Básico",
        "¿Estás seguro de que deseas cambiar al plan gratuito? Perderás acceso a funciones premium.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            onPress: () => {
              setSubscription(tier);
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      `Activar Plan ${getTierLabel(tier)}`,
      "En una versión futura se habilitará el pago real. Por ahora puedes explorar las funciones.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Activar demo",
          onPress: () => {
            setSubscription(tier);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Plan activado", `Ahora tienes acceso al plan ${getTierLabel(tier)}`);
          },
        },
      ]
    );
  }, [subscription, setSubscription]);

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case "free": return Lock;
      case "pro": return Zap;
      case "premium": return Building2;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Planes</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroSection}>
            <Crown size={32} color={Colors.light.gold} />
            <Text style={styles.heroTitle}>Elige tu plan</Text>
            <Text style={styles.heroSubtitle}>
              Desbloquea herramientas profesionales para llevar tu panadería al siguiente nivel
            </Text>
          </View>

          <View style={styles.currentPlan}>
            <Text style={styles.currentPlanLabel}>Plan actual</Text>
            <View style={styles.currentPlanBadge}>
              <Crown size={14} color={getTierColor(subscription)} />
              <Text style={[styles.currentPlanText, { color: getTierColor(subscription) }]}>
                {getTierLabel(subscription)}
              </Text>
            </View>
          </View>

          {SUBSCRIPTION_PLANS.map((plan) => {
            const isActive = subscription === plan.tier;
            const TierIcon = getTierIcon(plan.tier);
            const tierColor = getTierColor(plan.tier);

            return (
              <TouchableOpacity
                key={plan.tier}
                style={[
                  styles.planCard,
                  isActive && styles.planCardActive,
                  plan.highlighted && !isActive && styles.planCardHighlighted,
                ]}
                onPress={() => handleSelectPlan(plan.tier)}
                activeOpacity={0.8}
              >
                {plan.highlighted && !isActive && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MÁS POPULAR</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={[styles.planIcon, { backgroundColor: tierColor + "20" }]}>
                    <TierIcon size={22} color={tierColor} />
                  </View>
                  <View style={styles.planTitleGroup}>
                    <Text style={[styles.planName, isActive && styles.planNameActive]}>
                      {plan.name}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={[styles.planPrice, isActive && styles.planPriceActive]}>
                        {plan.price}
                      </Text>
                      {plan.period ? (
                        <Text style={styles.planPeriod}>{plan.period}</Text>
                      ) : null}
                    </View>
                  </View>
                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Check size={14} color={Colors.light.textInverse} />
                    </View>
                  )}
                </View>

                <View style={styles.featuresList}>
                  {plan.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <Check size={14} color={isActive ? Colors.light.success : tierColor} />
                      <Text style={[styles.featureText, isActive && styles.featureTextActive]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {!isActive && (
                  <View style={[styles.selectBtn, { backgroundColor: tierColor }]}>
                    <Text style={styles.selectBtnText}>
                      {plan.tier === "free" ? "Cambiar a Básico" : `Activar ${plan.name}`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <Text style={styles.disclaimer}>
            Los planes de pago se habilitarán próximamente. Por ahora puedes explorar todas las funciones en modo demo.
          </Text>

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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  currentPlan: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  currentPlanLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  currentPlanBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  currentPlanText: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  planCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  planCardActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryMuted,
  },
  planCardHighlighted: {
    borderColor: Colors.light.gold,
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: Colors.light.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "800" as const,
    color: Colors.light.textInverse,
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  planTitleGroup: {
    flex: 1,
    gap: 2,
  },
  planName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  planNameActive: {
    color: Colors.light.primary,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  planPriceActive: {
    color: Colors.light.primary,
  },
  planPeriod: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  activeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  featuresList: {
    gap: 8,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  featureTextActive: {
    color: Colors.light.text,
  },
  selectBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  selectBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.textInverse,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.light.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 10,
    paddingHorizontal: 20,
  },
});

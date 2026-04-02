import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Settings,
  DollarSign,
  Check,
  Info,
  FlaskConical,
  Crown,
  ChevronRight,
  User,
  MapPin,
  Briefcase,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { AVAILABLE_CURRENCIES, type CurrencyCode } from "@/constants/appConfig";
import { getTierLabel, getTierColor } from "@/constants/subscriptions";
import useAppStore from "@/store/useAppStore";

export default function SettingsScreen() {
  const router = useRouter();
  const { currency, setCurrency, userProfile, subscription } = useAppStore();

  const handleCurrencyChange = useCallback(
    (code: CurrencyCode) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrency(code);
    },
    [setCurrency]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Ajustes</Text>
          <Text style={styles.subtitle}>Configuración de la app</Text>
        </View>
        <View style={styles.headerBadge}>
          <Settings size={16} color={Colors.light.primary} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push("/profile/me" as never)}
          activeOpacity={0.7}
        >
          <View style={styles.profileCardLeft}>
            {userProfile.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileAvatarFallback}>
                <User size={22} color={Colors.light.textInverse} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              {userProfile.professionalTitle && (
                <View style={styles.profileTitleRow}>
                  <Briefcase size={11} color={Colors.light.primary} />
                  <Text style={styles.profileTitle}>{userProfile.professionalTitle}</Text>
                </View>
              )}
              {userProfile.location && (
                <View style={styles.profileTitleRow}>
                  <MapPin size={11} color={Colors.light.textMuted} />
                  <Text style={styles.profileLocation}>{userProfile.location}</Text>
                </View>
              )}
            </View>
          </View>
          <ChevronRight size={18} color={Colors.light.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.subscriptionCard}
          onPress={() => router.push("/subscription" as never)}
          activeOpacity={0.7}
        >
          <View style={styles.subscriptionLeft}>
            <View style={[styles.subscriptionIcon, { backgroundColor: getTierColor(subscription) + "20" }]}>
              <Crown size={20} color={getTierColor(subscription)} />
            </View>
            <View>
              <Text style={styles.subscriptionTitle}>Plan {getTierLabel(subscription)}</Text>
              <Text style={styles.subscriptionSub}>
                {subscription === "free"
                  ? "Actualiza para más funciones"
                  : "Gestiona tu suscripción"}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.light.textMuted} />
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={16} color={Colors.light.primary} />
            <Text style={styles.sectionTitle}>Moneda</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Selecciona la moneda para costos y precios
          </Text>

          <View style={styles.currencyGrid}>
            {AVAILABLE_CURRENCIES.map((c) => {
              const isActive = currency === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.currencyCard,
                    isActive && styles.currencyCardActive,
                  ]}
                  onPress={() => handleCurrencyChange(c.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.currencyTop}>
                    <Text
                      style={[
                        styles.currencySymbol,
                        isActive && styles.currencySymbolActive,
                      ]}
                    >
                      {c.symbol}
                    </Text>
                    {isActive && (
                      <View style={styles.checkBadge}>
                        <Check size={12} color={Colors.light.textInverse} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.currencyCode,
                      isActive && styles.currencyCodeActive,
                    ]}
                  >
                    {c.code}
                  </Text>
                  <Text
                    style={[
                      styles.currencyName,
                      isActive && styles.currencyNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={16} color={Colors.light.primary} />
            <Text style={styles.sectionTitle}>Acerca de</Text>
          </View>

          <View style={styles.aboutCard}>
            <View style={styles.aboutLogo}>
              <FlaskConical size={28} color={Colors.light.primary} />
            </View>
            <Text style={styles.aboutName}>Leche y Miel</Text>
            <Text style={styles.aboutVersion}>v2.0.0</Text>
            <Text style={styles.aboutDesc}>
              Herramienta profesional de formulación para panaderos y pasteleros.
              Calcula, guarda y comparte tus fórmulas con precisión industrial.
            </Text>
          </View>
        </View>

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
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  profileCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  profileAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  profileTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  profileTitle: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: "500" as const,
  },
  profileLocation: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  subscriptionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  subscriptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  subscriptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  subscriptionTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  subscriptionSub: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  sectionDesc: {
    fontSize: 13,
    color: Colors.light.textMuted,
    marginBottom: 14,
    marginLeft: 24,
  },
  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  currencyCard: {
    width: "47%" as const,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  currencyCardActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryMuted,
  },
  currencyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.light.textMuted,
  },
  currencySymbolActive: {
    color: Colors.light.primary,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  currencyCodeActive: {
    color: Colors.light.primary,
  },
  currencyName: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  currencyNameActive: {
    color: Colors.light.textSecondary,
  },
  aboutCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  aboutLogo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.light.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  aboutName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginBottom: 12,
  },
  aboutDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    textAlign: "center",
  },
});

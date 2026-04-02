import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  Heart,
  Download,
  Wheat,
  CakeSlice,
  Droplets,
  Scale,
  User,
} from "lucide-react-native";
import { useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { formatCurrency } from "@/constants/appConfig";
import useAppStore from "@/store/useAppStore";
import type { CommunityFormula, SavedFormula } from "@/types";

export default function CommunityScreen() {
  const router = useRouter();
  const {
    communityFormulas,
    likeCommunityFormula,
    downloadCommunityFormula,
    addFormula,
    currency,
  } = useAppStore();

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<"todas" | "panaderia" | "pasteleria">("todas");

  const filtered = useMemo(() => {
    return communityFormulas.filter((cf) => {
      const matchSearch =
        !search ||
        cf.formula.name.toLowerCase().includes(search.toLowerCase()) ||
        cf.authorName.toLowerCase().includes(search.toLowerCase()) ||
        cf.formula.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchArea =
        areaFilter === "todas" || cf.formula.area === areaFilter;
      return matchSearch && matchArea;
    });
  }, [communityFormulas, search, areaFilter]);

  const handleDownload = useCallback(
    (cf: CommunityFormula) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const newFormula: SavedFormula = {
        ...cf.formula,
        id: `imported-${Date.now()}`,
        name: `${cf.formula.name} (comunidad)`,
        isPublic: false,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addFormula(newFormula);
      downloadCommunityFormula(cf.id);
      Alert.alert("Descargada", `"${cf.formula.name}" se agregó a tus fórmulas`);
    },
    [addFormula, downloadCommunityFormula]
  );

  const handleLike = useCallback(
    (id: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      likeCommunityFormula(id);
    },
    [likeCommunityFormula]
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comunidad</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchBar}>
          <Search size={16} color={Colors.light.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar fórmulas, autores, tags..."
            placeholderTextColor={Colors.light.textMuted}
            value={search}
            onChangeText={setSearch}
            testID="community-search"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {(["todas", "panaderia", "pasteleria"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, areaFilter === f && styles.filterChipActive]}
              onPress={() => setAreaFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, areaFilter === f && styles.filterTextActive]}>
                {f === "todas" ? "Todas" : f === "panaderia" ? "Panadería" : "Pastelería"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Search size={32} color={Colors.light.textMuted} />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptySubtitle}>
                Intenta con otros términos de búsqueda
              </Text>
            </View>
          ) : (
            filtered.map((cf) => (
              <View key={cf.id} style={styles.card}>
                {cf.formula.imageUrl && (
                  <Image source={{ uri: cf.formula.imageUrl }} style={styles.cardImage} />
                )}
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardTitleRow}>
                      <View
                        style={[
                          styles.areaDot,
                          {
                            backgroundColor:
                              cf.formula.area === "panaderia"
                                ? Colors.light.primary
                                : Colors.light.gold,
                          },
                        ]}
                      />
                      <Text style={styles.cardName} numberOfLines={1}>
                        {cf.formula.name}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.authorRow}
                    onPress={() => router.push(`/profile/${cf.authorId}` as never)}
                    activeOpacity={0.7}
                  >
                    {cf.authorAvatar ? (
                      <Image source={{ uri: cf.authorAvatar }} style={styles.authorAvatar} />
                    ) : (
                      <View style={styles.authorAvatarFallback}>
                        <User size={10} color={Colors.light.textInverse} />
                      </View>
                    )}
                    <Text style={styles.authorName}>{cf.authorName}</Text>
                  </TouchableOpacity>

                  {cf.formula.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {cf.formula.description}
                    </Text>
                  ) : null}

                  <View style={styles.cardStats}>
                    {cf.formula.area === "panaderia" ? (
                      <Wheat size={12} color={Colors.light.primary} />
                    ) : (
                      <CakeSlice size={12} color={Colors.light.gold} />
                    )}
                    {cf.formula.hydration > 0 && (
                      <View style={styles.statItem}>
                        <Droplets size={11} color={Colors.light.water} />
                        <Text style={styles.statText}>{cf.formula.hydration}%</Text>
                      </View>
                    )}
                    <View style={styles.statItem}>
                      <Scale size={11} color={Colors.light.textMuted} />
                      <Text style={styles.statText}>
                        {cf.formula.ingredients.length} ing.
                      </Text>
                    </View>
                    <Text style={styles.statCost}>
                      {formatCurrency(cf.formula.totalCost, currency)}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.likeBtn, cf.userLiked && styles.likeBtnActive]}
                      onPress={() => handleLike(cf.id)}
                      activeOpacity={0.7}
                    >
                      <Heart
                        size={16}
                        color={cf.userLiked ? Colors.light.error : Colors.light.textMuted}
                        fill={cf.userLiked ? Colors.light.error : "transparent"}
                      />
                      <Text
                        style={[
                          styles.likeBtnText,
                          cf.userLiked && styles.likeBtnTextActive,
                        ]}
                      >
                        {cf.likes}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.downloadBtn}
                      onPress={() => handleDownload(cf)}
                      activeOpacity={0.7}
                    >
                      <Download size={16} color={Colors.light.textInverse} />
                      <Text style={styles.downloadBtnText}>
                        Descargar ({cf.downloads})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
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
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  cardBody: {
    padding: 16,
  },
  cardTop: {
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  areaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardName: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.light.text,
    flex: 1,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  authorAvatarFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  authorName: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statCost: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.success,
    marginLeft: "auto",
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  likeBtnActive: {
    backgroundColor: Colors.light.errorMuted,
  },
  likeBtnText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  likeBtnTextActive: {
    color: Colors.light.error,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
  },
  downloadBtnText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.textInverse,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textMuted,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});

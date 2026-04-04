import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Phone,
  Globe,
  Mail,
  Award,
  Edit3,
  Check,
  X,
  Crown,
  ChevronRight,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { notificationAsync } from "@/utils/haptics";
import { showAlert } from "@/utils/alert";

import Colors from "@/constants/colors";
import useAppStore from "@/store/useAppStore";
import { getTierLabel, getTierColor } from "@/constants/subscriptions";

export default function ProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userProfile, updateProfile, posts, formulas, subscription } = useAppStore();
  const isOwnProfile = id === "me" || id === userProfile.id;

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: userProfile.name,
    professionalTitle: userProfile.professionalTitle ?? "",
    bio: userProfile.bio ?? "",
    location: userProfile.location ?? "",
    phone: userProfile.phone ?? "",
    website: userProfile.website ?? "",
    specialty: userProfile.specialty ?? "",
    yearsExperience: String(userProfile.yearsExperience ?? 0),
  });

  const profile = isOwnProfile ? userProfile : null;
  const displayName = isOwnProfile ? userProfile.name : "Usuario";
  const displayAvatar = isOwnProfile ? userProfile.avatar : undefined;

  const userPosts = posts.filter(
    (p) => isOwnProfile ? p.authorId === userProfile.id : p.authorId === id
  );
  const userFormulasCount = isOwnProfile ? formulas.length : 0;

  const handleStartEdit = useCallback(() => {
    setEditData({
      name: userProfile.name,
      professionalTitle: userProfile.professionalTitle ?? "",
      bio: userProfile.bio ?? "",
      location: userProfile.location ?? "",
      phone: userProfile.phone ?? "",
      website: userProfile.website ?? "",
      specialty: userProfile.specialty ?? "",
      yearsExperience: String(userProfile.yearsExperience ?? 0),
    });
    setEditing(true);
  }, [userProfile]);

  const handleSaveEdit = useCallback(() => {
    if (!editData.name.trim()) {
      showAlert("Error", "El nombre es requerido");
      return;
    }
    void notificationAsync("Success");
    updateProfile({
      name: editData.name.trim(),
      professionalTitle: editData.professionalTitle.trim() || undefined,
      bio: editData.bio.trim() || undefined,
      location: editData.location.trim() || undefined,
      phone: editData.phone.trim() || undefined,
      website: editData.website.trim() || undefined,
      specialty: editData.specialty.trim() || undefined,
      yearsExperience: parseInt(editData.yearsExperience, 10) || 0,
    });
    setEditing(false);
  }, [editData, updateProfile]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isOwnProfile ? "Mi Perfil" : "Perfil"}
          </Text>
          {isOwnProfile && !editing ? (
            <TouchableOpacity style={styles.headerBtn} onPress={handleStartEdit}>
              <Edit3 size={18} color={Colors.light.text} />
            </TouchableOpacity>
          ) : editing ? (
            <View style={styles.headerEditActions}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => setEditing(false)}>
                <X size={18} color={Colors.light.error} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerBtn, styles.headerBtnSave]}
                onPress={handleSaveEdit}
              >
                <Check size={18} color={Colors.light.textInverse} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileHero}>
            <View style={styles.avatarSection}>
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
                </View>
              )}
              {isOwnProfile && (
                <View style={styles.tierBadge}>
                  <Crown size={10} color={getTierColor(subscription)} />
                  <Text style={[styles.tierText, { color: getTierColor(subscription) }]}>
                    {getTierLabel(subscription)}
                  </Text>
                </View>
              )}
            </View>

            {editing ? (
              <View style={styles.editSection}>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Nombre</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editData.name}
                    onChangeText={(v) => setEditData((prev) => ({ ...prev, name: v }))}
                    placeholder="Tu nombre"
                    placeholderTextColor={Colors.light.textMuted}
                  />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Título profesional</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editData.professionalTitle}
                    onChangeText={(v) => setEditData((prev) => ({ ...prev, professionalTitle: v }))}
                    placeholder="Ej: Maestro Panadero"
                    placeholderTextColor={Colors.light.textMuted}
                  />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Especialidad</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editData.specialty}
                    onChangeText={(v) => setEditData((prev) => ({ ...prev, specialty: v }))}
                    placeholder="Ej: Panadería Artesanal"
                    placeholderTextColor={Colors.light.textMuted}
                  />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Años de experiencia</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editData.yearsExperience}
                    onChangeText={(v) => setEditData((prev) => ({ ...prev, yearsExperience: v }))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.light.textMuted}
                  />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Biografía</Text>
                  <TextInput
                    style={[styles.editInput, styles.editTextarea]}
                    value={editData.bio}
                    onChangeText={(v) => setEditData((prev) => ({ ...prev, bio: v }))}
                    placeholder="Cuéntanos sobre ti..."
                    placeholderTextColor={Colors.light.textMuted}
                    multiline
                  />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Ubicación</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editData.location}
                    onChangeText={(v) => setEditData((prev) => ({ ...prev, location: v }))}
                    placeholder="Ciudad, País"
                    placeholderTextColor={Colors.light.textMuted}
                  />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Teléfono</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editData.phone}
                    onChangeText={(v) => setEditData((prev) => ({ ...prev, phone: v }))}
                    placeholder="+1 234 567 890"
                    placeholderTextColor={Colors.light.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Sitio web</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editData.website}
                    onChangeText={(v) => setEditData((prev) => ({ ...prev, website: v }))}
                    placeholder="https://tu-sitio.com"
                    placeholderTextColor={Colors.light.textMuted}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.profileName}>{displayName}</Text>
                {profile?.professionalTitle && (
                  <View style={styles.titleRow}>
                    <Briefcase size={14} color={Colors.light.primary} />
                    <Text style={styles.profileTitle}>{profile.professionalTitle}</Text>
                    {profile.yearsExperience && profile.yearsExperience > 0 && (
                      <Text style={styles.profileExp}>
                        · {profile.yearsExperience} años
                      </Text>
                    )}
                  </View>
                )}
                {profile?.bio && (
                  <Text style={styles.profileBio}>{profile.bio}</Text>
                )}

                <View style={styles.infoGrid}>
                  {profile?.location && (
                    <View style={styles.infoItem}>
                      <MapPin size={14} color={Colors.light.textMuted} />
                      <Text style={styles.infoText}>{profile.location}</Text>
                    </View>
                  )}
                  {profile?.specialty && (
                    <View style={styles.infoItem}>
                      <Award size={14} color={Colors.light.gold} />
                      <Text style={styles.infoText}>{profile.specialty}</Text>
                    </View>
                  )}
                  {profile?.phone && (
                    <View style={styles.infoItem}>
                      <Phone size={14} color={Colors.light.textMuted} />
                      <Text style={styles.infoText}>{profile.phone}</Text>
                    </View>
                  )}
                  {profile?.email && (
                    <View style={styles.infoItem}>
                      <Mail size={14} color={Colors.light.textMuted} />
                      <Text style={styles.infoText}>{profile.email}</Text>
                    </View>
                  )}
                  {profile?.website && (
                    <View style={styles.infoItem}>
                      <Globe size={14} color={Colors.light.primary} />
                      <Text style={[styles.infoText, { color: Colors.light.primary }]}>
                        {profile.website}
                      </Text>
                    </View>
                  )}
                </View>

                {profile?.certifications && profile.certifications.length > 0 && (
                  <View style={styles.certSection}>
                    <Text style={styles.certTitle}>Certificaciones</Text>
                    <View style={styles.certRow}>
                      {profile.certifications.map((cert, idx) => (
                        <View key={idx} style={styles.certBadge}>
                          <Award size={12} color={Colors.light.gold} />
                          <Text style={styles.certText}>{cert}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {!editing && (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{userFormulasCount}</Text>
                  <Text style={styles.statLabel}>Fórmulas</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{userPosts.length}</Text>
                  <Text style={styles.statLabel}>Publicaciones</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {profile?.yearsExperience ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>Años exp.</Text>
                </View>
              </View>

              {isOwnProfile && (
                <TouchableOpacity
                  style={styles.subscriptionCard}
                  onPress={() => router.push("/subscription" as never)}
                  activeOpacity={0.7}
                >
                  <View style={styles.subscriptionLeft}>
                    <Crown size={20} color={getTierColor(subscription)} />
                    <View>
                      <Text style={styles.subscriptionTitle}>Plan {getTierLabel(subscription)}</Text>
                      <Text style={styles.subscriptionSub}>
                        Gestiona tu suscripción
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={Colors.light.textMuted} />
                </TouchableOpacity>
              )}

              {profile?.portfolio && profile.portfolio.length > 0 && (
                <View style={styles.portfolioSection}>
                  <Text style={styles.sectionTitle}>Portafolio</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.portfolioRow}
                  >
                    {profile.portfolio.map((item) => (
                      <View key={item.id} style={styles.portfolioCard}>
                        <Image source={{ uri: item.imageUrl }} style={styles.portfolioImage} />
                        <Text style={styles.portfolioTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.description && (
                          <Text style={styles.portfolioDesc} numberOfLines={2}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {userPosts.length > 0 && (
                <View style={styles.postsSection}>
                  <Text style={styles.sectionTitle}>
                    Publicaciones recientes
                  </Text>
                  {userPosts.slice(0, 3).map((post) => (
                    <TouchableOpacity
                      key={post.id}
                      style={styles.postPreview}
                      onPress={() => router.push(`/post/${post.id}` as never)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.postPreviewContent} numberOfLines={2}>
                        {post.content}
                      </Text>
                      <View style={styles.postPreviewMeta}>
                        <Text style={styles.postPreviewReactions}>
                          {(post.reactions ?? []).reduce((s, r) => s + r.count, 0)} reacciones
                        </Text>
                        <Text style={styles.postPreviewComments}>
                          {post.comments.length} comentarios
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
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
  headerBtnSave: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  headerEditActions: {
    flexDirection: "row",
    gap: 8,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileHero: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: Colors.light.primary,
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.light.primaryDark,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.light.textInverse,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  tierText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.primary,
  },
  profileExp: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  profileBio: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  infoGrid: {
    width: "100%",
    gap: 8,
    marginTop: 4,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  certSection: {
    width: "100%",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  certTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  certRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  certBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.goldMuted,
  },
  certText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.gold,
  },
  editSection: {
    width: "100%",
    gap: 12,
  },
  editField: {
    gap: 4,
  },
  editLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  editInput: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  editTextarea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  subscriptionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  subscriptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subscriptionTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  subscriptionSub: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 1,
  },
  portfolioSection: {
    marginTop: 20,
    paddingLeft: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  portfolioRow: {
    gap: 12,
    paddingRight: 16,
  },
  portfolioCard: {
    width: 180,
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  portfolioImage: {
    width: "100%",
    height: 130,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  portfolioTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.text,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  portfolioDesc: {
    fontSize: 11,
    color: Colors.light.textMuted,
    paddingHorizontal: 10,
    paddingBottom: 10,
    marginTop: 2,
  },
  postsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  postPreview: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  postPreviewContent: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 19,
    marginBottom: 8,
  },
  postPreviewMeta: {
    flexDirection: "row",
    gap: 12,
  },
  postPreviewReactions: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  postPreviewComments: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
});

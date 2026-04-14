import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Heart,
  MessageCircle,
  Send,
  HelpCircle,
  ImagePlus,
  Award,
  Cookie,
  ChevronRight,
  MapPin,
  Briefcase,
  User,
  Bell,
  Globe,
  ArrowRightLeft,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { impactAsync } from "@/utils/haptics";

import { useTheme } from "@/utils/useTheme";
import useAppStore from "@/store/useAppStore";
import type { FeedPost, ReactionType } from "@/types";

type PostType = "trabajo" | "ayuda" | "logro" | "receta";

const REACTION_CONFIG: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "like", emoji: "❤️", label: "Me gusta" },
  { type: "fire", emoji: "🔥", label: "Fuego" },
  { type: "bread", emoji: "🍞", label: "Pan" },
  { type: "clap", emoji: "👏", label: "Aplauso" },
];

export default function ClubScreen() {
  const router = useRouter();
  const C = useTheme(); // ✅ FIX #4: tema dinámico
  const styles = makeStyles(C);
  const { posts, reactToPost, addPost, userProfile, notifications } = useAppStore();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [newPost, setNewPost] = useState("");
  const [postType, setPostType] = useState<PostType>("trabajo");
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const formatTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const getTypeConfig = (tipo: PostType) => {
    switch (tipo) {
      case "trabajo": return { icon: ImagePlus, color: C.primary, label: "Trabajo" };
      case "ayuda": return { icon: HelpCircle, color: C.warning, label: "Ayuda" };
      case "logro": return { icon: Award, color: C.gold, label: "Logro" };
      case "receta": return { icon: Cookie, color: C.success, label: "Receta" };
    }
  };

  const handlePublish = useCallback(() => {
    if (!newPost.trim()) return;
    void impactAsync("Medium");
    const post: FeedPost = {
      id: `post-${Date.now()}`,
      authorId: userProfile.id,
      authorName: userProfile.name,
      authorAvatar: userProfile.avatar,
      authorTitle: userProfile.professionalTitle
        ? `${userProfile.professionalTitle} · ${userProfile.yearsExperience ?? 0} años`
        : undefined,
      content: newPost.trim(),
      images: [],
      isHelpRequest: postType === "ayuda",
      postType,
      reactions: [
        { type: "like", count: 0, userReacted: false },
        { type: "fire", count: 0, userReacted: false },
        { type: "bread", count: 0, userReacted: false },
        { type: "clap", count: 0, userReacted: false },
      ],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    addPost(post);
    setNewPost("");
  }, [newPost, postType, userProfile, addPost]);

  const handleReaction = useCallback((postId: string, reactionType: ReactionType) => {
    void impactAsync("Light");
    reactToPost(postId, reactionType);
  }, [reactToPost]);

  const toggleReactions = useCallback((postId: string) => {
    void impactAsync("Light");
    if (showReactionsFor === postId) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setShowReactionsFor(null);
      });
    } else {
      setShowReactionsFor(postId);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [showReactionsFor, fadeAnim]);

  const getTotalReactions = (post: FeedPost): number => {
    return (post.reactions ?? []).reduce((sum, r) => sum + r.count, 0);
  };

  const typeOptions: PostType[] = ["trabajo", "ayuda", "logro", "receta"];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Club del Panadero</Text>
            <Text style={styles.subtitle}>Colaboración y comunidad</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => router.push("/notifications" as never)}
              activeOpacity={0.7}
            >
              <Bell size={18} color={C.text} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => router.push("/profile/me" as never)}
              activeOpacity={0.7}
            >
              {userProfile.avatar ? (
                <Image source={{ uri: userProfile.avatar }} style={styles.profileBtnImg} />
              ) : (
                <View style={styles.profileBtnFallback}>
                  <User size={18} color={C.textInverse} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => router.push("/profile/me" as never)}
            activeOpacity={0.7}
          >
            <View style={styles.profileCardLeft}>
              {userProfile.avatar ? (
                <Image source={{ uri: userProfile.avatar }} style={styles.profileCardAvatar} />
              ) : (
                <View style={styles.profileCardAvatarFallback}>
                  <Text style={styles.profileCardAvatarText}>
                    {userProfile.name.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.profileCardInfo}>
                <Text style={styles.profileCardName}>{userProfile.name}</Text>
                {userProfile.professionalTitle && (
                  <View style={styles.profileCardTitleRow}>
                    <Briefcase size={11} color={C.primary} />
                    <Text style={styles.profileCardTitle}>
                      {userProfile.professionalTitle}
                    </Text>
                  </View>
                )}
                {userProfile.location && (
                  <View style={styles.profileCardTitleRow}>
                    <MapPin size={11} color={C.textMuted} />
                    <Text style={styles.profileCardLocation}>
                      {userProfile.location}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <ChevronRight size={18} color={C.textMuted} />
          </TouchableOpacity>

          <View style={styles.quickLinks}>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push("/community" as never)}
              activeOpacity={0.7}
            >
              <Globe size={16} color={C.primary} />
              <Text style={styles.quickLinkText}>Fórmulas públicas</Text>
              <ChevronRight size={14} color={C.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push("/substitutes" as never)}
              activeOpacity={0.7}
            >
              <ArrowRightLeft size={16} color={C.gold} />
              <Text style={styles.quickLinkText}>Sustitutos</Text>
              <ChevronRight size={14} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.composer}>
            <View style={styles.composerTop}>
              {userProfile.avatar ? (
                <Image source={{ uri: userProfile.avatar }} style={styles.composerAvatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {userProfile.name.charAt(0)}
                  </Text>
                </View>
              )}
              <TextInput
                style={styles.composerInput}
                placeholder="Comparte tu trabajo o pide ayuda..."
                placeholderTextColor={C.textMuted}
                value={newPost}
                onChangeText={setNewPost}
                multiline
                testID="club-post-input"
              />
            </View>

            <View style={styles.composerBottom}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typeRow}
              >
                {typeOptions.map((t) => {
                  const config = getTypeConfig(t);
                  const Icon = config.icon;
                  const isActive = postType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeChip,
                        isActive && { backgroundColor: config.color + "20", borderColor: config.color + "40" },
                      ]}
                      onPress={() => setPostType(t)}
                      activeOpacity={0.7}
                    >
                      <Icon
                        size={13}
                        color={isActive ? config.color : C.textMuted}
                      />
                      <Text
                        style={[
                          styles.typeChipText,
                          isActive && { color: config.color },
                        ]}
                      >
                        {config.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                style={[
                  styles.publishBtn,
                  !newPost.trim() && styles.publishBtnDisabled,
                ]}
                onPress={handlePublish}
                disabled={!newPost.trim()}
                activeOpacity={0.8}
              >
                <Send size={14} color={C.textInverse} />
              </TouchableOpacity>
            </View>
          </View>

          {posts.map((post) => {
            const config = getTypeConfig(post.postType ?? (post.isHelpRequest ? "ayuda" : "trabajo"));
            const totalReactions = getTotalReactions(post);
            const isReactionsOpen = showReactionsFor === post.id;

            return (
              <View key={post.id} style={styles.postCard}>
                <TouchableOpacity
                  style={styles.postHeader}
                  onPress={() => router.push(`/profile/${post.authorId}` as never)}
                  activeOpacity={0.7}
                >
                  {post.authorAvatar ? (
                    <Image
                      source={{ uri: post.authorAvatar }}
                      style={styles.postAvatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.postAvatarFallback]}>
                      <Text style={styles.avatarText}>
                        {post.authorName.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.postMeta}>
                    <Text style={styles.postAuthor}>{post.authorName}</Text>
                    {post.authorTitle && (
                      <Text style={styles.postAuthorTitle}>{post.authorTitle}</Text>
                    )}
                    <View style={styles.postTypeRow}>
                      <View
                        style={[
                          styles.postTypeBadge,
                          { backgroundColor: config.color + "15" },
                        ]}
                      >
                        <Text
                          style={[styles.postTypeText, { color: config.color }]}
                        >
                          {config.label}
                        </Text>
                      </View>
                      <Text style={styles.postTime}>
                        {formatTime(post.createdAt)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <Text style={styles.postContent}>{post.content}</Text>

                {post.images && post.images.length > 0 && (
                  <Image
                    source={{ uri: post.images[0] }}
                    style={styles.postImage}
                  />
                )}

                {isReactionsOpen && (
                  <Animated.View style={[styles.reactionBar, { opacity: fadeAnim }]}>
                    {REACTION_CONFIG.map((r) => {
                      const reaction = (post.reactions ?? []).find((pr) => pr.type === r.type);
                      const isActive = reaction?.userReacted ?? false;
                      return (
                        <TouchableOpacity
                          key={r.type}
                          style={[
                            styles.reactionBtn,
                            isActive && styles.reactionBtnActive,
                          ]}
                          onPress={() => handleReaction(post.id, r.type)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                          {(reaction?.count ?? 0) > 0 && (
                            <Text style={[
                              styles.reactionCount,
                              isActive && styles.reactionCountActive,
                            ]}>
                              {reaction?.count}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </Animated.View>
                )}

                <View style={styles.postActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => toggleReactions(post.id)}
                    onLongPress={() => toggleReactions(post.id)}
                    activeOpacity={0.7}
                  >
                    <Heart
                      size={18}
                      color={
                        (post.reactions ?? []).some((r) => r.userReacted)
                          ? C.error
                          : C.textMuted
                      }
                      fill={
                        (post.reactions ?? []).some((r) => r.userReacted)
                          ? C.error
                          : "transparent"
                      }
                    />
                    {totalReactions > 0 && (
                      <Text style={styles.actionText}>{totalReactions}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/post/${post.id}` as never)}
                    activeOpacity={0.7}
                  >
                    <MessageCircle size={18} color={C.textMuted} />
                    {post.comments.length > 0 && (
                      <Text style={styles.actionText}>{post.comments.length}</Text>
                    )}
                  </TouchableOpacity>

                  {post.comments.length > 0 && (
                    <TouchableOpacity
                      style={styles.viewCommentsBtn}
                      onPress={() => router.push(`/post/${post.id}` as never)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewCommentsText}>
                        Ver {post.comments.length} comentario{post.comments.length > 1 ? "s" : ""}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {post.comments.length > 0 && (
                  <TouchableOpacity
                    style={styles.previewComment}
                    onPress={() => router.push(`/post/${post.id}` as never)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.previewCommentAuthor}>
                      {post.comments[post.comments.length - 1].authorName}
                    </Text>
                    <Text style={styles.previewCommentText} numberOfLines={1}>
                      {post.comments[post.comments.length - 1].content}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {posts.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Sin publicaciones</Text>
              <Text style={styles.emptySubtitle}>
                Sé el primero en compartir algo con la comunidad
              </Text>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof import("@/utils/useTheme").useTheme>) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
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
    color: C.text,
  },
  subtitle: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: C.border,
  },
  notifBadge: {
    position: "absolute" as const,
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.error,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: C.textInverse,
  },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden" as const,
    borderWidth: 2,
    borderColor: C.primary,
  },
  profileBtnImg: {
    width: "100%",
    height: "100%",
  },
  profileBtnFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLinks: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 14,
  },
  quickLink: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600" as const,
    color: C.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  profileCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  profileCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileCardAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCardAvatarText: {
    color: C.textInverse,
    fontSize: 18,
    fontWeight: "700" as const,
  },
  profileCardInfo: {
    flex: 1,
    gap: 2,
  },
  profileCardName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: C.text,
  },
  profileCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  profileCardTitle: {
    fontSize: 12,
    color: C.primary,
    fontWeight: "500" as const,
  },
  profileCardLocation: {
    fontSize: 11,
    color: C.textMuted,
  },
  composer: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  composerTop: {
    flexDirection: "row",
    gap: 12,
  },
  composerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: C.textInverse,
    fontSize: 14,
    fontWeight: "700" as const,
  },
  composerInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    minHeight: 36,
    maxHeight: 100,
    textAlignVertical: "top",
  },
  composerBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  typeRow: {
    flexDirection: "row",
    gap: 6,
    paddingRight: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: C.backgroundTertiary,
    borderWidth: 1,
    borderColor: "transparent",
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: C.textMuted,
  },
  publishBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  publishBtnDisabled: {
    opacity: 0.3,
  },
  postCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postAvatarFallback: {
    width: 40,
    height: 40,
  },
  postMeta: {
    flex: 1,
    marginLeft: 10,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: C.text,
  },
  postAuthorTitle: {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 1,
  },
  postTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  postTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  postTypeText: {
    fontSize: 10,
    fontWeight: "700" as const,
  },
  postTime: {
    fontSize: 11,
    color: C.textMuted,
  },
  postContent: {
    fontSize: 14,
    color: C.text,
    lineHeight: 21,
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: C.backgroundTertiary,
  },
  reactionBar: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: C.backgroundSecondary,
    borderRadius: 24,
    alignSelf: "flex-start",
  },
  reactionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: C.backgroundTertiary,
  },
  reactionBtnActive: {
    backgroundColor: C.primaryMuted,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: C.textSecondary,
  },
  reactionCountActive: {
    color: C.primary,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    color: C.textSecondary,
    fontWeight: "600" as const,
  },
  viewCommentsBtn: {
    marginLeft: "auto",
  },
  viewCommentsText: {
    fontSize: 12,
    color: C.primary,
    fontWeight: "500" as const,
  },
  previewComment: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  previewCommentAuthor: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: C.text,
  },
  previewCommentText: {
    fontSize: 12,
    color: C.textSecondary,
    flex: 1,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: C.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
  },
  });
}

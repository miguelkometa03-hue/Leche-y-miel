import { useState } from "react";
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
  Heart,
  MessageCircle,
  Send,
  HelpCircle,
  ImagePlus,
  Award,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import useAppStore from "@/store/useAppStore";
import type { FeedPost } from "@/types";

type PostType = "trabajo" | "ayuda" | "logro";

export default function ClubScreen() {
  const { posts, likePost, addPost, user } = useAppStore();
  const [newPost, setNewPost] = useState("");
  const [postType, setPostType] = useState<PostType>("trabajo");

  const formatTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Ahora";
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const getTypeConfig = (tipo: PostType) => {
    switch (tipo) {
      case "trabajo":
        return { icon: ImagePlus, color: Colors.light.primary, label: "Trabajo" };
      case "ayuda":
        return { icon: HelpCircle, color: Colors.light.warning, label: "Ayuda" };
      case "logro":
        return { icon: Award, color: Colors.light.gold, label: "Logro" };
    }
  };

  const handlePublish = () => {
    if (!newPost.trim()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const post: FeedPost = {
      id: `post-${Date.now()}`,
      authorId: user?.id ?? "user-1",
      authorName: user?.name ?? "Usuario",
      authorAvatar: user?.avatar,
      content: newPost.trim(),
      images: [],
      isHelpRequest: postType === "ayuda",
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    };
    addPost(post);
    setNewPost("");
  };

  const handleLike = (id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likePost(id);
  };

  const typeOptions: PostType[] = ["trabajo", "ayuda", "logro"];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Club del Panadero</Text>
          <Text style={styles.subtitle}>Colaboración y comunidad</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>{posts.length}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.composer}>
          <View style={styles.composerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0) ?? "U"}
              </Text>
            </View>
            <TextInput
              style={styles.composerInput}
              placeholder="Comparte o pide ayuda..."
              placeholderTextColor={Colors.light.textMuted}
              value={newPost}
              onChangeText={setNewPost}
              multiline
            />
          </View>

          <View style={styles.composerBottom}>
            <View style={styles.typeRow}>
              {typeOptions.map((t) => {
                const config = getTypeConfig(t);
                const Icon = config.icon;
                const isActive = postType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeChip,
                      isActive && { backgroundColor: config.color + "20" },
                    ]}
                    onPress={() => setPostType(t)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      size={14}
                      color={isActive ? config.color : Colors.light.textMuted}
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
            </View>
            <TouchableOpacity
              style={[
                styles.publishBtn,
                !newPost.trim() && styles.publishBtnDisabled,
              ]}
              onPress={handlePublish}
              disabled={!newPost.trim()}
              activeOpacity={0.8}
            >
              <Send size={14} color={Colors.light.textInverse} />
            </TouchableOpacity>
          </View>
        </View>

        {posts.map((post) => {
          const tipo: PostType = post.isHelpRequest ? "ayuda" : "trabajo";
          const config = getTypeConfig(tipo);
          return (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
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
              </View>

              <Text style={styles.postContent}>{post.content}</Text>

              {post.images && post.images.length > 0 && (
                <Image
                  source={{ uri: post.images[0] }}
                  style={styles.postImage}
                />
              )}

              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleLike(post.id)}
                  activeOpacity={0.7}
                >
                  <Heart size={16} color={Colors.light.textMuted} />
                  <Text style={styles.actionText}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                  <MessageCircle size={16} color={Colors.light.textMuted} />
                  <Text style={styles.actionText}>{post.comments.length}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {posts.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sin publicaciones</Text>
            <Text style={styles.emptySubtitle}>
              Sé el primero en compartir algo
            </Text>
          </View>
        )}
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
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.success,
  },
  onlineText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  composer: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  composerTop: {
    flexDirection: "row",
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.light.textInverse,
    fontSize: 14,
    fontWeight: "700" as const,
  },
  composerInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 36,
    textAlignVertical: "top",
  },
  composerBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  typeRow: {
    flexDirection: "row",
    gap: 6,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: Colors.light.textMuted,
  },
  publishBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  publishBtnDisabled: {
    opacity: 0.3,
  },
  postCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  postAvatarFallback: {
    width: 36,
    height: 36,
  },
  postMeta: {
    flex: 1,
    marginLeft: 10,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  postTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  postTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  postTypeText: {
    fontSize: 10,
    fontWeight: "600" as const,
  },
  postTime: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  postContent: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  postActions: {
    flexDirection: "row",
    gap: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
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
  },
});

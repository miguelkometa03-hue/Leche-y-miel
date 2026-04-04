import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Send,
  ThumbsUp,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { impactAsync } from "@/utils/haptics";

import Colors from "@/constants/colors";
import useAppStore from "@/store/useAppStore";
import type { ReactionType, PostComment } from "@/types";

const REACTION_CONFIG: { type: ReactionType; emoji: string }[] = [
  { type: "like", emoji: "❤️" },
  { type: "fire", emoji: "🔥" },
  { type: "bread", emoji: "🍞" },
  { type: "clap", emoji: "👏" },
];

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, reactToPost, addComment, likeComment, userProfile } = useAppStore();
  const [commentText, setCommentText] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const post = posts.find((p) => p.id === id);

  const formatTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const handleReaction = useCallback((reactionType: ReactionType) => {
    if (!post) return;
    void impactAsync("Light");
    reactToPost(post.id, reactionType);
  }, [post, reactToPost]);

  const handleComment = useCallback(() => {
    if (!post || !commentText.trim()) return;
    void impactAsync("Medium");
    const comment: PostComment = {
      id: `comment-${Date.now()}`,
      authorId: userProfile.id,
      authorName: userProfile.name,
      authorAvatar: userProfile.avatar,
      content: commentText.trim(),
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    addComment(post.id, comment);
    setCommentText("");
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [post, commentText, userProfile, addComment]);

  const handleLikeComment = useCallback((commentId: string) => {
    if (!post) return;
    void impactAsync("Light");
    likeComment(post.id, commentId);
  }, [post, likeComment]);

  if (!post) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.notFound}>
            <Text style={styles.notFoundText}>Publicación no encontrada</Text>
            <TouchableOpacity style={styles.backBtnFull} onPress={() => router.back()}>
              <Text style={styles.backBtnFullText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const totalReactions = (post.reactions ?? []).reduce((sum, r) => sum + r.count, 0);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
              <ArrowLeft size={22} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Publicación</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.postSection}>
              <TouchableOpacity
                style={styles.authorRow}
                onPress={() => router.push(`/profile/${post.authorId}` as never)}
                activeOpacity={0.7}
              >
                {post.authorAvatar ? (
                  <Image source={{ uri: post.authorAvatar }} style={styles.authorAvatar} />
                ) : (
                  <View style={styles.authorAvatarFallback}>
                    <Text style={styles.authorAvatarText}>{post.authorName.charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{post.authorName}</Text>
                  {post.authorTitle && (
                    <Text style={styles.authorTitle}>{post.authorTitle}</Text>
                  )}
                  <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.postContent}>{post.content}</Text>

              {post.images && post.images.length > 0 && (
                <Image source={{ uri: post.images[0] }} style={styles.postImage} />
              )}

              <View style={styles.reactionsRow}>
                {REACTION_CONFIG.map((r) => {
                  const reaction = (post.reactions ?? []).find((pr) => pr.type === r.type);
                  const isActive = reaction?.userReacted ?? false;
                  const count = reaction?.count ?? 0;
                  return (
                    <TouchableOpacity
                      key={r.type}
                      style={[styles.reactionChip, isActive && styles.reactionChipActive]}
                      onPress={() => handleReaction(r.type)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                      {count > 0 && (
                        <Text style={[styles.reactionCount, isActive && styles.reactionCountActive]}>
                          {count}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.statsDivider}>
                <Text style={styles.statsText}>
                  {totalReactions} reacciones · {post.comments.length} comentarios
                </Text>
              </View>
            </View>

            <View style={styles.commentsSection}>
              <Text style={styles.commentsSectionTitle}>
                Comentarios ({post.comments.length})
              </Text>

              {post.comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    {comment.authorAvatar ? (
                      <Image source={{ uri: comment.authorAvatar }} style={styles.commentAvatar} />
                    ) : (
                      <View style={styles.commentAvatarFallback}>
                        <Text style={styles.commentAvatarText}>
                          {comment.authorName.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                      <Text style={styles.commentTime}>{formatTime(comment.createdAt)}</Text>
                    </View>
                  </View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                  <TouchableOpacity
                    style={styles.commentLikeBtn}
                    onPress={() => handleLikeComment(comment.id)}
                    activeOpacity={0.7}
                  >
                    <ThumbsUp
                      size={13}
                      color={comment.likes > 0 ? Colors.light.primary : Colors.light.textMuted}
                    />
                    {comment.likes > 0 && (
                      <Text style={styles.commentLikeCount}>{comment.likes}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}

              {post.comments.length === 0 && (
                <View style={styles.noComments}>
                  <Text style={styles.noCommentsText}>
                    Sé el primero en comentar
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.commentBar}>
            {userProfile.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={styles.commentBarAvatar} />
            ) : (
              <View style={styles.commentBarAvatarFallback}>
                <Text style={styles.commentBarAvatarText}>
                  {userProfile.name.charAt(0)}
                </Text>
              </View>
            )}
            <TextInput
              style={styles.commentInput}
              placeholder="Escribe un comentario..."
              placeholderTextColor={Colors.light.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              testID="comment-input"
            />
            <TouchableOpacity
              style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
              onPress={handleComment}
              disabled={!commentText.trim()}
              activeOpacity={0.8}
            >
              <Send size={16} color={Colors.light.textInverse} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
  backBtnFull: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnFullText: {
    color: Colors.light.textInverse,
    fontWeight: "600" as const,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
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
    paddingBottom: 20,
  },
  postSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  authorAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  authorAvatarText: {
    color: Colors.light.textInverse,
    fontSize: 18,
    fontWeight: "700" as const,
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  authorTitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  postTime: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 14,
  },
  postImage: {
    width: "100%",
    height: 240,
    borderRadius: 14,
    marginBottom: 14,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  reactionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundTertiary,
    borderWidth: 1,
    borderColor: "transparent",
  },
  reactionChipActive: {
    backgroundColor: Colors.light.primaryMuted,
    borderColor: Colors.light.primary,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  reactionCountActive: {
    color: Colors.light.primary,
  },
  statsDivider: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statsText: {
    fontSize: 13,
    color: Colors.light.textMuted,
    textAlign: "center",
  },
  commentsSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  commentsSectionTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 14,
  },
  commentCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  commentMeta: {
    marginLeft: 10,
    flex: 1,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  commentTime: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 1,
  },
  commentContent: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentLikeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  commentLikeCount: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.primary,
  },
  noComments: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noCommentsText: {
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  commentBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  commentBarAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentBarAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  commentBarAvatarText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.textInverse,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.3,
  },
});

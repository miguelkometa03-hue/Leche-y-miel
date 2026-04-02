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
  ArrowLeft,
  UserPlus,
  Heart,
  MessageCircle,
  AtSign,
  CheckCheck,
} from "lucide-react-native";
import { useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import useAppStore from "@/store/useAppStore";
import type { Notification } from "@/types";

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "follow":
        return { Icon: UserPlus, color: Colors.light.primary };
      case "reaction":
        return { Icon: Heart, color: Colors.light.error };
      case "comment":
        return { Icon: MessageCircle, color: Colors.light.water };
      case "mention":
        return { Icon: AtSign, color: Colors.light.gold };
    }
  };

  const handleTap = useCallback(
    (notification: Notification) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!notification.read) {
        markNotificationRead(notification.id);
      }
      if (notification.targetId) {
        router.push(`/post/${notification.targetId}` as never);
      } else if (notification.type === "follow") {
        router.push(`/profile/${notification.fromUserId}` as never);
      }
    },
    [markNotificationRead, router]
  );

  const handleMarkAll = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markAllNotificationsRead();
  }, [markAllNotificationsRead]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          {unreadCount > 0 ? (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAll}>
              <CheckCheck size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {unreadCount > 0 && (
          <View style={styles.unreadBanner}>
            <Text style={styles.unreadBannerText}>
              {unreadCount} notificación{unreadCount > 1 ? "es" : ""} sin leer
            </Text>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {notifications.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Heart size={28} color={Colors.light.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Sin notificaciones</Text>
              <Text style={styles.emptySubtitle}>
                Aquí verás las interacciones de la comunidad
              </Text>
            </View>
          ) : (
            notifications.map((n) => {
              const { Icon, color } = getIcon(n.type);
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.notifCard, !n.read && styles.notifCardUnread]}
                  onPress={() => handleTap(n)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.notifIcon, { backgroundColor: color + "15" }]}>
                    <Icon size={18} color={color} />
                  </View>
                  <View style={styles.notifBody}>
                    <View style={styles.notifRow}>
                      {n.fromUserAvatar ? (
                        <Image
                          source={{ uri: n.fromUserAvatar }}
                          style={styles.notifAvatar}
                        />
                      ) : (
                        <View style={styles.notifAvatarFallback}>
                          <Text style={styles.notifAvatarText}>
                            {n.fromUserName.charAt(0)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.notifContent}>
                        <Text style={styles.notifText}>
                          <Text style={styles.notifName}>{n.fromUserName}</Text>{" "}
                          {n.message}
                        </Text>
                        <Text style={styles.notifTime}>{formatTime(n.createdAt)}</Text>
                      </View>
                    </View>
                  </View>
                  {!n.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              );
            })
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
  markAllBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBanner: {
    backgroundColor: Colors.light.primaryMuted,
    marginHorizontal: 20,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  unreadBannerText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.primary,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: Colors.light.primaryMuted,
    borderColor: Colors.light.primary,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBody: {
    flex: 1,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notifAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  notifAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  notifAvatarText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.textInverse,
  },
  notifContent: {
    flex: 1,
  },
  notifText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  notifName: {
    fontWeight: "700" as const,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textMuted,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});

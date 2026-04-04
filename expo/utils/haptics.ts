import { Platform } from "react-native";

const noop = async () => {};

type ImpactStyle = "Light" | "Medium" | "Heavy";
type NotificationType = "Success" | "Warning" | "Error";

export const impactAsync = Platform.OS === "web"
  ? noop
  : async (style?: ImpactStyle) => {
      const Haptics = await import("expo-haptics");
      const styleMap: Record<string, typeof Haptics.ImpactFeedbackStyle[keyof typeof Haptics.ImpactFeedbackStyle]> = {
        Light: Haptics.ImpactFeedbackStyle.Light,
        Medium: Haptics.ImpactFeedbackStyle.Medium,
        Heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      await Haptics.impactAsync(style ? styleMap[style] : Haptics.ImpactFeedbackStyle.Medium);
    };

export const notificationAsync = Platform.OS === "web"
  ? noop
  : async (type?: NotificationType) => {
      const Haptics = await import("expo-haptics");
      const typeMap: Record<string, typeof Haptics.NotificationFeedbackType[keyof typeof Haptics.NotificationFeedbackType]> = {
        Success: Haptics.NotificationFeedbackType.Success,
        Warning: Haptics.NotificationFeedbackType.Warning,
        Error: Haptics.NotificationFeedbackType.Error,
      };
      await Haptics.notificationAsync(type ? typeMap[type] : Haptics.NotificationFeedbackType.Success);
    };

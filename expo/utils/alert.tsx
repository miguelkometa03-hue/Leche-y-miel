import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Platform,
  Alert as RNAlert,
} from "react-native";
import Colors from "@/constants/colors";

interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
}

let showAlertFn: ((title: string, message: string, buttons: AlertButton[]) => void) | null = null;

export function showAlert(title: string, message: string, buttons?: AlertButton[]) {
  if (Platform.OS !== "web") {
    RNAlert.alert(
      title,
      message,
      buttons?.map((b) => ({
        text: b.text,
        style: b.style,
        onPress: b.onPress,
      }))
    );
    return;
  }

  if (showAlertFn) {
    showAlertFn(title, message, buttons ?? [{ text: "OK" }]);
  }
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const show = useCallback(
    (title: string, message: string, buttons: AlertButton[]) => {
      setAlert({ visible: true, title, message, buttons });
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [fadeAnim, scaleAnim]
  );

  const hide = useCallback(
    (callback?: () => void) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
        callback?.();
      });
    },
    [fadeAnim, scaleAnim]
  );

  useEffect(() => {
    showAlertFn = show;
    return () => {
      showAlertFn = null;
    };
  }, [show]);

  const handleButtonPress = useCallback(
    (button: AlertButton) => {
      hide(button.onPress);
    },
    [hide]
  );

  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <Modal
        visible={alert.visible}
        transparent
        animationType="none"
        onRequestClose={() => hide()}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={() => hide()}
          />
          <Animated.View
            style={[
              styles.dialog,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.title}>{alert.title}</Text>
            {alert.message ? (
              <Text style={styles.message}>{alert.message}</Text>
            ) : null}
            <View style={styles.buttons}>
              {alert.buttons.map((button, index) => {
                const isDestructive = button.style === "destructive";
                const isCancel = button.style === "cancel";
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      isDestructive && styles.buttonDestructive,
                      isCancel && styles.buttonCancel,
                      alert.buttons.length === 1 && styles.buttonFull,
                    ]}
                    onPress={() => handleButtonPress(button)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isDestructive && styles.buttonTextDestructive,
                        isCancel && styles.buttonTextCancel,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
  },
  buttonFull: {
    flex: 1,
  },
  buttonDestructive: {
    backgroundColor: Colors.light.error,
  },
  buttonCancel: {
    backgroundColor: Colors.light.backgroundTertiary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.textInverse,
  },
  buttonTextDestructive: {
    color: Colors.light.textInverse,
  },
  buttonTextCancel: {
    color: Colors.light.textSecondary,
  },
});

// app/(tabs)/_layout.tsx
// ✅ FIX #1 CRÍTICO: Archivo reconstruido como TabLayout correcto.
// El archivo anterior contenía LabScreen (sobrescritura accidental).
// 4 tabs visibles. Planner y Club ocultos pero accesibles via router.push().

import { Tabs } from "expo-router";
import { FlaskConical, BookOpen, Bot, Settings } from "lucide-react-native";
import { StyleSheet, View, Platform } from "react-native";
import useAppStore from "@/store/useAppStore";
import { THEMES } from "@/constants/colors";

export default function TabLayout() {
  const appTheme = useAppStore((s) => s.appTheme);
  const C = THEMES[appTheme] ?? THEMES.trigo;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopWidth: 1,
          borderTopColor: C.border,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "web" ? 58 : 62,
          paddingBottom: Platform.OS === "web" ? 4 : 8,
        },
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Laboratorio",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: C.primaryMuted }]}>
              <FlaskConical size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="formulas"
        options={{
          title: "Fórmulas",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: C.primaryMuted }]}>
              <BookOpen size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="agent"
        options={{
          title: "Agente IA",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: C.primaryMuted, borderWidth: 1, borderColor: C.primary + "50" }]}>
              <Bot size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: C.primaryMuted }]}>
              <Settings size={22} color={color} />
            </View>
          ),
        }}
      />
      {/* Rutas ocultas de la barra — accesibles vía router.push() */}
      <Tabs.Screen name="planner" options={{ href: null, title: "Producción" }} />
      <Tabs.Screen name="club" options={{ href: null, title: "Club" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.2 },
  tabItem: { paddingTop: 4 },
  iconWrap: { width: 40, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 10 },
});

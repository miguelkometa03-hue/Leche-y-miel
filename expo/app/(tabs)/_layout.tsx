import { Tabs } from "expo-router";
import { Calculator, BookOpen, Users } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Calcular",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Calculator size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="formulas"
        options={{
          title: "Fórmulas",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <BookOpen size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="club"
        options={{
          title: "Club",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Users size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
  tabItem: {
    paddingTop: 4,
  },
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: Colors.light.primaryMuted,
  },
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

import Colors from "@/constants/colors";
import { AlertProvider } from "@/utils/alert";

if (typeof window === 'undefined' || !('document' in globalThis)) {
  if (typeof window === 'undefined' || !('document' in globalThis)) {
  void SplashScreen.preventAutoHideAsync();
}
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Atrás",
        headerStyle: { backgroundColor: Colors.light.background },
        headerTitleStyle: { color: Colors.light.text, fontWeight: "600" },
        headerTintColor: Colors.light.primary,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="ficha/[id]"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="post/[id]"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="profile/[id]"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="subscription"
        options={{
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="community"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="substitutes"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="price-history"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void (async () => {
      try { try { await SplashScreen.hideAsync(); } catch (_) {} } catch (_) {}
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AlertProvider>
          <StatusBar style="auto" />
          <RootLayoutNav />
        </AlertProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

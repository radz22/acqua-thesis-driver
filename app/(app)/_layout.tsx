import { Platform } from "react-native";
import { Stack } from "expo-router/stack";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AppLayout() {
  return (
    <AuthGuard>
      <Stack
        screenOptions={{
          headerShown: Platform.OS !== "web",
          contentStyle: { backgroundColor: Platform.OS === "web" ? "#fafafa" : "#ffffff" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Home" }} />
      </Stack>
    </AuthGuard>
  );
}

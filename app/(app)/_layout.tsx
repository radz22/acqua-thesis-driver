import { Platform } from "react-native";
import { Stack } from "expo-router/stack";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AssignedBookingsProvider } from "@/components/app/assigned-bookings-context";

export default function AppLayout() {
  return (
    <AuthGuard>
      <AssignedBookingsProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Platform.OS === "web" ? "#fafafa" : "#ffffff" },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="order/[id]"
            options={{
              headerShown: Platform.OS !== "web",
              title: "Order",
            }}
          />
        </Stack>
      </AssignedBookingsProvider>
    </AuthGuard>
  );
}

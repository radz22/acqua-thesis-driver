import { Platform } from "react-native";
import { Stack } from "expo-router/stack";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AssignedBookingsProvider } from "@/components/app/assigned-bookings-context";
import { MessagingProvider } from "@/components/app/messaging-context";
import { RealtimeProvider, useRealtime } from "@/components/app/realtime-context";

function AuthenticatedApp() {
  const { socket } = useRealtime();

  return (
    <AssignedBookingsProvider>
      <MessagingProvider socket={socket}>
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
          <Stack.Screen
            name="chat/[id]"
            options={{
              headerShown: false,
              title: "Chat",
            }}
          />
        </Stack>
      </MessagingProvider>
    </AssignedBookingsProvider>
  );
}

export default function AppLayout() {
  return (
    <AuthGuard>
      <RealtimeProvider>
        <AuthenticatedApp />
      </RealtimeProvider>
    </AuthGuard>
  );
}

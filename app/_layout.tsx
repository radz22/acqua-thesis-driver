import "@/src/global.css";
import { Stack } from "expo-router/stack";
import { Toaster } from "@/components/ui/toast";

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <Toaster />
    </>
  );
}

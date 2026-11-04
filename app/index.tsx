import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAppSession } from "@/hooks/use-session";
import { View, ActivityIndicator } from "@/src/tw";

export default function IndexRedirect() {
  const { isAuthenticated, isLoading } = useAppSession();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace("/(app)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator className="text-neutral-500" />
    </View>
  );
}

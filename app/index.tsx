import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAppSession } from "@/hooks/use-session";
import { View, ActivityIndicator } from "@/src/tw";

export default function IndexRedirect() {
  const { isAuthenticated, isLoading, emailVerified, user } = useAppSession();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && !emailVerified) {
      router.replace({
        pathname: "/(auth)/verify-email",
        params: {
          email: user?.email ?? "",
          purpose: "email-verification",
        },
      });
      return;
    }

    if (isAuthenticated) {
      router.replace("/(app)");
      return;
    }

    router.replace("/(auth)/login");
  }, [isLoading, isAuthenticated, emailVerified, user?.email, router]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator className="text-ink-muted" />
    </View>
  );
}

import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAppSession } from "@/hooks/use-session";
import { View, Text, ActivityIndicator } from "@/src/tw";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { APP_ROLE } from "@/constants";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAppSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator className="text-neutral-500" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (role !== APP_ROLE) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <View className="w-full max-w-sm gap-6">
          <View className="gap-2">
            <Text className="text-center text-2xl font-bold text-neutral-900">
              Access Denied
            </Text>
            <Text className="text-center text-base text-neutral-500">
              This app is for <Text className="font-semibold text-neutral-900">{APP_ROLE}</Text>{" "}
              users. You are signed in as{" "}
              <Text className="font-semibold text-neutral-900">{role ?? "unknown"}</Text>.
            </Text>
          </View>
          <Button
            title="Sign Out"
            variant="secondary"
            onPress={() => {
              void signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.replace("/(auth)/login");
                  },
                },
              });
            }}
          />
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

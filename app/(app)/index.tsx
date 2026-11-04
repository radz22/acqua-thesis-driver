import { useRouter } from "expo-router";
import { View, Text } from "@/src/tw";
import { Button } from "@/components/ui/button";
import { AppScreenLayout } from "@/components/app/app-screen-layout";
import { useAppSession } from "@/hooks/use-session";
import { signOut } from "@/lib/auth-client";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAppSession();

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace("/(auth)/login");
        },
      },
    });
  }

  return (
    <AppScreenLayout>
      <View className="gap-2">
        <Text className="text-2xl font-bold text-neutral-900">
          Hello, {user?.name ?? "User"}
        </Text>
        <Text className="text-base text-neutral-500">{user?.email}</Text>
      </View>

      <View className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 gap-3">
        <Text className="text-sm font-semibold text-neutral-700">Your Account</Text>
        <View className="gap-1">
          <Text className="text-sm text-neutral-500">
            Name: <Text className="text-neutral-900">{user?.name}</Text>
          </Text>
          <Text className="text-sm text-neutral-500">
            Email: <Text className="text-neutral-900">{user?.email}</Text>
          </Text>
          <Text className="text-sm text-neutral-500">
            Role: <Text className="text-neutral-900">{user?.role ?? "N/A"}</Text>
          </Text>
        </View>
      </View>

      <Button title="Sign Out" onPress={handleSignOut} variant="secondary" />
    </AppScreenLayout>
  );
}

import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, View } from "@/src/tw";
import { Button } from "@/components/ui/button";
import { useAppSession } from "@/hooks/use-session";
import { signOut } from "@/lib/auth-client";
import { toast } from "@/components/ui/toast";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAppSession();

  async function handleSignOut() {
    const { error } = await signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out.");
          router.replace("/(auth)/login");
        },
      },
    });

    if (error) {
      toast.error("Could not sign out. Try again.");
    }
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-6 pb-8">
      <View style={{ height: insets.top + 16 }} />
      <View className="gap-8">
        <View className="gap-2">
          <Text className="text-[28px] font-bold tracking-tight text-ink">Account</Text>
          <Text className="text-base text-ink-muted">{user?.email}</Text>
        </View>

        <View className="rounded-2xl border border-line bg-surface p-5 gap-3">
          <Text className="text-sm font-semibold text-ink">Your profile</Text>
          <View className="gap-1">
            <Text className="text-sm text-ink-muted">
              Name: <Text className="text-ink">{user?.name}</Text>
            </Text>
            <Text className="text-sm text-ink-muted">
              Email: <Text className="text-ink">{user?.email}</Text>
            </Text>
            <Text className="text-sm text-ink-muted">
              Role: <Text className="text-ink">{user?.role ?? "N/A"}</Text>
            </Text>
          </View>
        </View>

        <Button title="Sign Out" onPress={() => void handleSignOut()} variant="secondary" />
      </View>
    </ScrollView>
  );
}

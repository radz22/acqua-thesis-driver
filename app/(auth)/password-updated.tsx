import { useRouter } from "expo-router";
import { View } from "@/src/tw";
import { Button } from "@/components/ui/button";
import { CheckMark } from "@/components/ui/check-mark";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { AUTH_HERO_OTP } from "@/constants/assets";

export default function PasswordUpdatedScreen() {
  const router = useRouter();

  return (
    <AuthFormLayout
      hero={AUTH_HERO_OTP}
      title="Password Updated"
      subtitle="Your password has been successfully changed"
    >
      <View className="items-center gap-6">
        <View className="h-20 w-20 items-center justify-center rounded-full border-4 border-accent bg-brand">
          <CheckMark className="h-5 w-3 border-b-[3px] border-r-[3px] border-white" />
        </View>
        <Button title="Next" onPress={() => router.replace("/(auth)/login")} />
      </View>
    </AuthFormLayout>
  );
}

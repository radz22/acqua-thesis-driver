import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View, Text, Pressable } from "@/src/tw";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, isUserNotFound } from "@/lib/auth-errors";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth-schemas";
import { AUTH_HERO_OTP } from "@/constants/assets";
import { toast } from "@/components/ui/toast";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit({ email }: ForgotPasswordValues) {
    const { error: resetError } = await authClient.emailOtp.requestPasswordReset({
      email,
    });

    if (resetError) {
      const message = authErrorMessage(resetError, "Could not send a reset code. Try again.");
      toast.error(message);
      if (isUserNotFound(resetError)) {
        setError("email", { message });
      }
      return;
    }

    toast.success("We sent a reset code to your email.");
    router.replace({
      pathname: "/(auth)/verify-email",
      params: { email, purpose: "forget-password" },
    });
  }

  return (
    <AuthFormLayout
      hero={AUTH_HERO_OTP}
      title="Forgot password?"
      subtitle="We'll send a 6-digit reset code to this email"
    >
      <View className="gap-5">
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              label="Email address"
              placeholder="you@example.com"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              error={fieldState.error?.message}
            />
          )}
        />

        <Button title="Send code" onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} />

        <Pressable className="min-h-11 justify-center" onPress={() => router.back()}>
          <Text className="text-center text-sm text-ink-muted">
            Remember your password? <Text className="font-semibold text-ink">Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </AuthFormLayout>
  );
}

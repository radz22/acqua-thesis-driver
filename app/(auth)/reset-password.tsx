import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View, Text, Pressable } from "@/src/tw";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, needsNewOtp } from "@/lib/auth-errors";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/auth-schemas";
import { clearResetDraft, getResetDraft } from "@/lib/auth-flow";
import { AUTH_HERO_OTP } from "@/constants/assets";
import { toast } from "@/components/ui/toast";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const draft = getResetDraft();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit({ password }: ResetPasswordValues) {
    if (!draft) {
      toast.error("This reset session expired. Request a new code.");
      return;
    }

    const { error: resetError } = await authClient.emailOtp.resetPassword({
      email: draft.email,
      otp: draft.otp,
      password,
    });

    if (resetError) {
      const message = authErrorMessage(resetError, "Could not update your password.");
      toast.error(message);
      if (needsNewOtp(resetError)) {
        clearResetDraft();
        router.replace({
          pathname: "/(auth)/forgot-password",
        });
      }
      return;
    }

    clearResetDraft();
    toast.success("Password updated.");
    router.replace("/(auth)/password-updated");
  }

  return (
    <AuthFormLayout
      hero={AUTH_HERO_OTP}
      title="Set a new password"
      subtitle="Choose a password you have not used on AquaBest before"
    >
      <View className="gap-5">
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Input
              label="New password"
              placeholder="Enter new password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Input
              label="Confirm password"
              placeholder="Confirm new password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              error={fieldState.error?.message}
            />
          )}
        />

        <Button
          title="Update password"
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          disabled={!draft}
        />

        <Pressable
          className="min-h-11 justify-center"
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text className="text-center text-sm text-ink-muted">
            Back to <Text className="font-semibold text-ink">Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </AuthFormLayout>
  );
}

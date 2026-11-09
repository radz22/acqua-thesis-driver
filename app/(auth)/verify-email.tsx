import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View, Text, Pressable } from "@/src/tw";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { otpSchema, type OtpValues } from "@/lib/auth-schemas";
import { setResetDraft, type OtpPurpose } from "@/lib/auth-flow";
import { AUTH_HERO_OTP } from "@/constants/assets";

const RESEND_SECONDS = 60;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; purpose?: string }>();
  const email = (params.email ?? "").trim();
  const purpose: OtpPurpose =
    params.purpose === "forget-password" ? "forget-password" : "email-verification";

  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const otp = watch("otp");
  const formError = errors.otp?.message ?? errors.root?.message;
  const isBusy = isSubmitting || isResending;

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function onSubmit({ otp: code }: OtpValues) {
    if (!email) {
      setError("root", { message: "Missing email. Go back and try again." });
      return;
    }

    if (purpose === "forget-password") {
      setResetDraft({ email, otp: code });
      router.replace("/(auth)/reset-password");
      return;
    }

    const { error: verifyError } = await authClient.emailOtp.verifyEmail({
      email,
      otp: code,
    });

    if (verifyError) {
      setError("otp", { message: authErrorMessage(verifyError, "Could not verify that code.") });
      return;
    }

    router.replace("/(app)");
  }

  async function handleResend() {
    if (secondsLeft > 0 || !email || isBusy) return;
    clearErrors();
    setIsResending(true);

    const { error: resendError } =
      purpose === "forget-password"
        ? await authClient.emailOtp.requestPasswordReset({ email })
        : await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "email-verification",
          });

    setIsResending(false);

    if (resendError) {
      setError("root", { message: authErrorMessage(resendError, "Could not resend the code.") });
      return;
    }

    setSecondsLeft(RESEND_SECONDS);
  }

  const timerLabel = `00:${String(secondsLeft).padStart(2, "0")}s`;

  return (
    <AuthFormLayout
      hero={AUTH_HERO_OTP}
      title="Check your Email"
      subtitle={
        <>
          Enter the unique code we sent to{" "}
          <Text className="font-semibold text-ink">{email || "your email"}</Text> below
        </>
      }
    >
      <View className="gap-6">
        <Controller
          control={control}
          name="otp"
          render={({ field, fieldState }) => (
            <OtpInput
              value={field.value}
              onChange={field.onChange}
              error={Boolean(fieldState.error || errors.root)}
            />
          )}
        />

        {formError ? (
          <View className="rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-danger">{formError}</Text>
          </View>
        ) : null}

        <Pressable
          className="min-h-11 items-center justify-center"
          onPress={() => void handleResend()}
          disabled={secondsLeft > 0 || isBusy}
        >
          <Text className="text-center text-sm text-ink-muted">
            Didn&apos;t receive it?{" "}
            <Text className={secondsLeft > 0 ? "font-semibold text-ink-muted" : "font-semibold text-ink"}>
              Send Again
            </Text>
          </Text>
          <Text className="mt-1 text-center text-sm text-ink-muted">Resend {timerLabel}</Text>
        </Pressable>

        <Button
          title="Next"
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          disabled={otp.length !== 6 || isResending}
        />
      </View>
    </AuthFormLayout>
  );
}

import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View, Text, Pressable } from "@/src/tw";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, needsNewOtp } from "@/lib/auth-errors";
import { otpSchema, type OtpValues } from "@/lib/auth-schemas";
import { setResetDraft, type OtpPurpose } from "@/lib/auth-flow";
import { AUTH_HERO_OTP } from "@/constants/assets";
import { toast } from "@/components/ui/toast";

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
    formState: { isSubmitting },
  } = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const otp = watch("otp");
  const isBusy = isSubmitting || isResending;

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function onSubmit({ otp: code }: OtpValues) {
    if (!email) {
      toast.error("Missing email. Go back and try again.");
      return;
    }

    const { error: verifyError } =
      purpose === "forget-password"
        ? await authClient.emailOtp.checkVerificationOtp({
            email,
            otp: code,
            type: "forget-password",
          })
        : await authClient.emailOtp.verifyEmail({
            email,
            otp: code,
          });

    if (verifyError) {
      const message = authErrorMessage(verifyError, "Could not verify that code.");
      toast.error(message);
      setError("otp", { message });
      if (needsNewOtp(verifyError)) {
        setSecondsLeft(0);
      }
      return;
    }

    if (purpose === "forget-password") {
      setResetDraft({ email, otp: code });
      router.replace("/(auth)/reset-password");
      return;
    }

    toast.success("Email verified.");
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
      toast.error(authErrorMessage(resendError, "Could not resend the code."));
      return;
    }

    toast.success("A new code is on the way.");
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
            <View className="gap-2">
              <OtpInput
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  if (fieldState.error) {
                    clearErrors("otp");
                  }
                }}
                error={Boolean(fieldState.error)}
              />
              {fieldState.error?.message ? (
                <Text className="text-center text-sm text-danger">{fieldState.error.message}</Text>
              ) : null}
            </View>
          )}
        />

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

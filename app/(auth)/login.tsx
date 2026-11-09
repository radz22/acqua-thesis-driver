import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View, Text, Pressable } from "@/src/tw";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckMark } from "@/components/ui/check-mark";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { authClient, signIn } from "@/lib/auth-client";
import { authErrorMessage, isEmailNotVerified } from "@/lib/auth-errors";
import { loginSchema, type LoginValues } from "@/lib/auth-schemas";
import { AUTH_HERO_LOGIN } from "@/constants/assets";

export default function LoginScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  async function onSubmit({ email, password, rememberMe }: LoginValues) {
    const { error: signInError } = await signIn.email({
      email,
      password,
      rememberMe,
    });

    if (signInError) {
      if (isEmailNotVerified(signInError)) {
        await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "email-verification",
        });
        router.replace({
          pathname: "/(auth)/verify-email",
          params: { email, purpose: "email-verification" },
        });
        return;
      }
      setError("root", { message: authErrorMessage(signInError, "Sign in failed. Try again.") });
      return;
    }

    router.replace("/(app)");
  }

  return (
    <AuthFormLayout
      hero={AUTH_HERO_LOGIN}
      title="Driver sign in"
      subtitle="Enter your details below to log back into your driver account"
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
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Input
              label="Password"
              placeholder="Enter your password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              error={fieldState.error?.message}
            />
          )}
        />

        <View className="flex-row items-center justify-between">
          <Controller
            control={control}
            name="rememberMe"
            render={({ field }) => (
              <Pressable
                className="min-h-11 flex-row items-center gap-2"
                onPress={() => field.onChange(!field.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: field.value }}
              >
                <View
                  className={`h-5 w-5 items-center justify-center rounded border ${
                    field.value ? "border-brand bg-brand" : "border-line bg-white"
                  }`}
                >
                  {field.value ? <CheckMark /> : null}
                </View>
                <Text className="text-sm text-ink">Remember me</Text>
              </Pressable>
            )}
          />
          <Pressable
            className="min-h-11 justify-center"
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text className="text-sm font-medium text-ink">Forgot password?</Text>
          </Pressable>
        </View>

        {errors.root?.message ? (
          <View className="rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-danger">{errors.root.message}</Text>
          </View>
        ) : null}

        <Button
          title="Let's Start"
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
        />
      </View>
    </AuthFormLayout>
  );
}

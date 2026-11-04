import { useState } from "react";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { View, Text, Pressable } from "@/src/tw";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleRequestReset() {
    setError("");
    setIsLoading(true);

    const redirectTo = Linking.createURL("/(auth)/reset-password");

    const { error: resetError } = await authClient.requestPasswordReset({
      email,
      redirectTo,
    });

    setIsLoading(false);

    if (resetError) {
      setError(resetError.message ?? "Failed to send reset email. Please try again.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <AuthFormLayout>
        <View className="gap-6">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-neutral-900">Check your email</Text>
            <Text className="text-base text-neutral-500">
              We sent a password reset link to {email}. Click the link in the email to reset
              your password.
            </Text>
          </View>

          <Pressable onPress={() => router.replace("/(auth)/login")}>
            <Text className="text-center text-sm font-semibold text-neutral-900">
              Back to Sign In
            </Text>
          </Pressable>
        </View>
      </AuthFormLayout>
    );
  }

  return (
    <AuthFormLayout>
      <View className="gap-8">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-neutral-900">Forgot password?</Text>
          <Text className="text-base text-neutral-500">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </Text>
        </View>

        <View className="gap-4">
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {error ? (
          <View className="rounded-lg bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        <View className="gap-3">
          <Button title="Send Reset Link" onPress={handleRequestReset} isLoading={isLoading} />

          <Pressable onPress={() => router.back()}>
            <Text className="text-center text-sm text-neutral-500">
              Remember your password?{" "}
              <Text className="font-semibold text-neutral-900">Sign In</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthFormLayout>
  );
}

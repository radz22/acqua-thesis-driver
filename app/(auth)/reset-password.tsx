import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, Pressable } from "@/src/tw";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token, error: tokenError } = useLocalSearchParams<{
    token?: string;
    error?: string;
  }>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(tokenError === "INVALID_TOKEN" ? "This reset link is invalid or has expired." : "");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleResetPassword() {
    setError("");

    if (!token) {
      setError("Missing reset token. Please request a new reset link.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    const { error: resetError } = await authClient.resetPassword({
      newPassword,
      token,
    });

    setIsLoading(false);

    if (resetError) {
      setError(resetError.message ?? "Failed to reset password. Please try again.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <AuthFormLayout>
        <View className="gap-6">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-neutral-900">Password reset</Text>
            <Text className="text-base text-neutral-500">
              Your password has been successfully reset. You can now sign in with your new
              password.
            </Text>
          </View>

          <Button title="Sign In" onPress={() => router.replace("/(auth)/login")} />
        </View>
      </AuthFormLayout>
    );
  }

  return (
    <AuthFormLayout>
      <View className="gap-8">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-neutral-900">Reset password</Text>
          <Text className="text-base text-neutral-500">Enter your new password below.</Text>
        </View>

        <View className="gap-4">
          <Input
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <Input
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        {error ? (
          <View className="rounded-lg bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        <View className="gap-3">
          <Button
            title="Reset Password"
            onPress={handleResetPassword}
            isLoading={isLoading}
            disabled={!token}
          />

          <Pressable onPress={() => router.replace("/(auth)/login")}>
            <Text className="text-center text-sm text-neutral-500">
              Back to{" "}
              <Text className="font-semibold text-neutral-900">Sign In</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthFormLayout>
  );
}

import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, Pressable } from "@/src/tw";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { signIn } from "@/lib/auth-client";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn() {
    setError("");
    setIsLoading(true);

    const { error: signInError } = await signIn.email({
      email,
      password,
    });

    setIsLoading(false);

    if (signInError) {
      setError(signInError.message ?? "Sign in failed. Please try again.");
      return;
    }

    router.replace("/(app)");
  }

  return (
    <AuthFormLayout>
      <View className="gap-8">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-neutral-900">Welcome back</Text>
          <Text className="text-base text-neutral-500">
            Sign in to your account to continue
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
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {error ? (
          <View className="rounded-lg bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        <View className="gap-3">
          <Button title="Sign In" onPress={handleSignIn} isLoading={isLoading} />

          <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
            <Text className="text-center text-sm text-neutral-500">Forgot password?</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text className="text-center text-sm text-neutral-500">
              Don&apos;t have an account?{" "}
              <Text className="font-semibold text-neutral-900">Sign Up</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthFormLayout>
  );
}

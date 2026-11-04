import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, Pressable } from "@/src/tw";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { signUp } from "@/lib/auth-client";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignUp() {
    setError("");
    setIsLoading(true);

    const { error: signUpError } = await signUp.email({
      name,
      email,
      password,
    });

    setIsLoading(false);

    if (signUpError) {
      setError(signUpError.message ?? "Sign up failed. Please try again.");
      return;
    }

    router.replace("/(app)");
  }

  return (
    <AuthFormLayout>
      <View className="gap-8">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-neutral-900">Create account</Text>
          <Text className="text-base text-neutral-500">Sign up to get started</Text>
        </View>

        <View className="gap-4">
          <Input
            label="Name"
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
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
            placeholder="Choose a password"
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
          <Button title="Create Account" onPress={handleSignUp} isLoading={isLoading} />

          <Pressable onPress={() => router.back()}>
            <Text className="text-center text-sm text-neutral-500">
              Already have an account?{" "}
              <Text className="font-semibold text-neutral-900">Sign In</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthFormLayout>
  );
}

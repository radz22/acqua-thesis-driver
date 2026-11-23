import { useState } from "react";
import { View, Text, TextInput, Pressable } from "@/src/tw";
import type { TextInputProps } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "@/constants/colors";

type InputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  keyboardType?: TextInputProps["keyboardType"];
  error?: string;
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
};

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  secureTextEntry,
  autoCapitalize = "none",
  keyboardType,
  error,
  autoComplete,
  textContentType,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = Boolean(secureTextEntry);

  const borderClasses = error
    ? "border-danger"
    : isFocused
      ? "border-brand"
      : "border-line";

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <View className="relative">
        <TextInput
          className={`w-full min-h-12 rounded-2xl border bg-white py-3 pl-4 text-base text-ink ${
            isPasswordField ? "pr-12" : "pr-4"
          } ${borderClasses}`}
          placeholder={placeholder}
          placeholderTextColor="#8A8A8A"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPasswordField && !isPasswordVisible}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
          selectionColor="#7EF0FF"
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
        />
        {isPasswordField ? (
          <Pressable
            className="absolute inset-y-0 right-0 w-12 items-center justify-center will-change-pressable"
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.inkMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}

import { useState } from "react";
import { View, Text, TextInput } from "@/src/tw";
import type { TextInputProps } from "react-native";

type InputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  keyboardType?: TextInputProps["keyboardType"];
  error?: string;
};

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = "none",
  keyboardType,
  error,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderClasses = error
    ? "border-red-500"
    : isFocused
      ? "border-neutral-900"
      : "border-neutral-300";

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-neutral-700">{label}</Text>
      <TextInput
        className={`w-full rounded-xl border bg-white px-4 py-3 text-base text-neutral-900 ${borderClasses}`}
        placeholder={placeholder}
        placeholderTextColor="#a3a3a3"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}

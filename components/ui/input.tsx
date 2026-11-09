import { useState } from "react";
import { View, Text, TextInput } from "@/src/tw";
import type { TextInputProps } from "react-native";

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

  const borderClasses = error
    ? "border-danger"
    : isFocused
      ? "border-brand"
      : "border-line";

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <TextInput
        className={`w-full min-h-12 rounded-2xl border bg-white px-4 py-3 text-base text-ink ${borderClasses}`}
        placeholder={placeholder}
        placeholderTextColor="#8A8A8A"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
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
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}

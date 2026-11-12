import { useRef } from "react";
import { TextInput as RNTextInput } from "react-native";
import { View } from "@/src/tw";

const OTP_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
};

export function OtpInput({ value, onChange, error = false }: OtpInputProps) {
  const refs = useRef<Array<RNTextInput | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? "");

  function setDigit(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    if (cleaned.length > 1) {
      const next = cleaned.slice(0, OTP_LENGTH);
      onChange(next);
      refs.current[Math.min(next.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned;
    onChange(nextDigits.join("").slice(0, OTP_LENGTH));

    if (cleaned && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const nextDigits = [...digits];
      nextDigits[index - 1] = "";
      onChange(nextDigits.join(""));
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <View className="flex-row justify-between">
      {digits.map((digit, index) => (
        <RNTextInput
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          style={{
            height: 52,
            width: 44,
            flexGrow: 0,
            flexShrink: 0,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: error ? "#B42318" : digit ? "#222222" : "#E5E5E5",
            textAlign: "center",
            fontSize: 20,
            fontWeight: "600",
            color: "#222222",
          }}
          // @ts-expect-error web input size keeps cells from stretching
          size={1}
          value={digit}
          onChangeText={(text) => setDigit(index, text)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={index === 0 ? OTP_LENGTH : 1}
          selectTextOnFocus
          selectionColor="#7EF0FF"
          accessibilityLabel={`Digit ${index + 1} of ${OTP_LENGTH}`}
        />
      ))}
    </View>
  );
}

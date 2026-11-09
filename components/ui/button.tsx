import { Pressable, Text, ActivityIndicator } from "@/src/tw";

type ButtonProps = {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

export function Button({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = "primary",
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  const baseClasses =
    "w-full min-h-12 py-3.5 px-6 rounded-2xl items-center justify-center flex-row gap-2";
  const variantClasses =
    variant === "primary"
      ? isDisabled
        ? "bg-[#B3B3B3]"
        : "bg-brand active:bg-black"
      : isDisabled
        ? "bg-canvas border border-line"
        : "bg-white border border-line active:bg-canvas";

  const textClasses =
    variant === "primary"
      ? "text-white text-base font-semibold"
      : isDisabled
        ? "text-ink-muted/50 text-base font-semibold"
        : "text-ink text-base font-semibold";

  return (
    <Pressable
      className={`${baseClasses} ${variantClasses}`}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator className={variant === "primary" ? "text-white" : "text-ink-muted"} />
      ) : (
        <Text className={textClasses}>{title}</Text>
      )}
    </Pressable>
  );
}

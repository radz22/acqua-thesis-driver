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

  const baseClasses = "w-full py-3.5 px-6 rounded-xl items-center justify-center flex-row gap-2";
  const variantClasses =
    variant === "primary"
      ? isDisabled
        ? "bg-neutral-300"
        : "bg-neutral-900 active:bg-neutral-700"
      : isDisabled
        ? "bg-neutral-100 border border-neutral-200"
        : "bg-white border border-neutral-300 active:bg-neutral-50";

  const textClasses =
    variant === "primary"
      ? "text-white text-base font-semibold"
      : isDisabled
        ? "text-neutral-400 text-base font-semibold"
        : "text-neutral-900 text-base font-semibold";

  return (
    <Pressable
      className={`${baseClasses} ${variantClasses}`}
      onPress={onPress}
      disabled={isDisabled}
    >
      {isLoading ? (
        <ActivityIndicator className={variant === "primary" ? "text-white" : "text-neutral-500"} />
      ) : (
        <Text className={textClasses}>{title}</Text>
      )}
    </Pressable>
  );
}

import { View } from "@/src/tw";

type CheckMarkProps = {
  className?: string;
};

export function CheckMark({ className = "border-white" }: CheckMarkProps) {
  return (
    <View
      className={`h-2.5 w-1.5 border-b-2 border-r-2 ${className}`}
      style={{ transform: [{ rotate: "45deg" }], marginTop: -2 }}
    />
  );
}

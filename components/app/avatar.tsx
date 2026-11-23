import { Text, View } from "@/src/tw";
import { Image } from "@/src/tw/image";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

export function Avatar({
  name,
  image,
  size = 44,
}: {
  name: string;
  image: string | null;
  size?: number;
}) {
  if (image) {
    return (
      <Image
        source={{ uri: image }}
        className="rounded-full bg-line"
        style={{ width: size, height: size }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      className="items-center justify-center rounded-full bg-line"
      style={{ width: size, height: size }}
    >
      <Text className="text-sm font-semibold text-ink">{initials(name)}</Text>
    </View>
  );
}

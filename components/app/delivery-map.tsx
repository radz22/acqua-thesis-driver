import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "@/src/tw";
import { colors } from "@/constants/colors";

export function DeliveryMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  return (
    <View className="flex-1 items-center justify-center bg-brand px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-accent/20">
        <Ionicons name="location" size={36} color={colors.accent} />
      </View>
      <Text className="mt-4 text-center text-lg font-bold text-white">Map on iOS and Android</Text>
      <Text className="mt-2 max-w-sm text-center text-sm leading-5 text-white/70">
        Delivery map tiles run in the mobile app. Coordinates: {latitude.toFixed(5)},{" "}
        {longitude.toFixed(5)}
      </Text>
    </View>
  );
}

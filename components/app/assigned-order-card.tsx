import { Pressable, Text, View } from "@/src/tw";
import { BOOKING_STATUS_LABEL, type Booking } from "@/lib/bookings";
import { formatWhen } from "@/lib/format-when";
import { formatPeso } from "@/constants/pricing";

export function AssignedOrderCard({
  booking,
  onPress,
}: {
  booking: Booking;
  onPress: () => void;
}) {
  const gallonLabel = booking.gallons === 1 ? "gallon" : "gallons";
  const isReady = booking.status === "READY_TO_DELIVER";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="rounded-2xl border border-line bg-white p-4 active:opacity-80"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-ink">{booking.customerName}</Text>
          <Text className="mt-1 text-sm leading-5 text-ink-muted">{booking.address}</Text>
          <Text className="mt-1 text-sm text-ink-muted">
            {booking.gallons} {gallonLabel}
          </Text>
        </View>
        <View className={`rounded-full px-2.5 py-1 ${isReady ? "bg-accent" : "bg-line"}`}>
          <Text className={`text-xs font-semibold ${isReady ? "text-white" : "text-ink"}`}>
            {BOOKING_STATUS_LABEL[booking.status]}
          </Text>
        </View>
      </View>
      <View className="mt-3 flex-row items-baseline justify-between gap-3">
        <Text className="text-xs text-ink-muted">{formatWhen(Date.parse(booking.createdAt))}</Text>
        <Text className="text-base font-bold text-ink">{formatPeso(booking.total)}</Text>
      </View>
    </Pressable>
  );
}

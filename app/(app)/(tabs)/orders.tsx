import { useCallback, useMemo } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/src/tw";
import { AssignedOrderCard } from "@/components/app/assigned-order-card";
import { useAssignedBookings } from "@/components/app/assigned-bookings-context";
import { type BookingStatus } from "@/lib/bookings";

const STATUS_ORDER: BookingStatus[] = [
  "READY_TO_DELIVER",
  "CONFIRMED",
  "PENDING",
  "CANCELLED",
];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookings, status, reload } = useAssignedBookings();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const grouped = useMemo(() => {
    const byStatus = new Map<BookingStatus, typeof bookings>();
    for (const booking of bookings) {
      const rows = byStatus.get(booking.status) ?? [];
      rows.push(booking);
      byStatus.set(booking.status, rows);
    }
    return STATUS_ORDER.flatMap((key) => byStatus.get(key) ?? []);
  }, [bookings]);

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-6 pb-8">
      <View style={{ height: insets.top + 16 }} />
      <Text className="text-[28px] font-bold tracking-tight text-ink">Assigned orders</Text>
      <Text className="mt-2 text-base text-ink-muted">
        Deliveries assigned to you. New assignments appear automatically.
      </Text>

      {status === "loading" ? (
        <Text className="mt-8 text-base text-ink-muted">Loading assigned orders…</Text>
      ) : null}

      {status === "error" ? (
        <View className="mt-8 gap-3">
          <Text className="text-base text-ink-muted">Could not load assigned orders.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void reload();
            }}
            className="self-start rounded-full bg-accent px-4 py-2"
          >
            <Text className="text-sm font-semibold text-white">Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {status === "ready" && grouped.length === 0 ? (
        <Text className="mt-8 text-base text-ink-muted">No assigned orders yet.</Text>
      ) : null}

      {status === "ready" ? (
        <View className="mt-8 gap-3">
          {grouped.map((booking) => (
            <AssignedOrderCard
              key={booking.id}
              booking={booking}
              onPress={() => {
                router.push(`/order/${booking.id}`);
              }}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

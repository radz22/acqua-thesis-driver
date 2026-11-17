import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/src/tw";
import { Button } from "@/components/ui/button";
import { DeliveryMap } from "@/components/app/delivery-map";
import { useAssignedBookings } from "@/components/app/assigned-bookings-context";
import {
  BOOKING_STATUS_LABEL,
  getDriverBooking,
  type Booking,
} from "@/lib/bookings";
import { formatWhen } from "@/lib/format-when";
import { formatPeso } from "@/constants/pricing";
import { hasValidCoordinates, navigateToStop } from "@/lib/navigation";

export default function OrderDetailsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { bookings } = useAssignedBookings();
  const cached = bookings.find((booking) => booking.id === id);
  const [booking, setBooking] = useState<Booking | null>(cached ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    cached ? "ready" : "loading",
  );

  const load = useCallback(() => {
    if (!id) {
      setStatus("error");
      return;
    }
    setStatus(cached ? "ready" : "loading");
    void getDriverBooking(id)
      .then((result) => {
        setBooking(result);
        setStatus("ready");
      })
      .catch(() => {
        if (!cached) setStatus("error");
      });
  }, [cached, id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!booking) return;
    navigation.setOptions({ title: booking.customerName });
  }, [booking, navigation]);

  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-base text-ink-muted">Loading order…</Text>
      </View>
    );
  }

  if (status === "error" || !booking) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-base text-ink-muted">
          This order is not assigned to you, or it could not be loaded.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={load}
          className="mt-4 rounded-full bg-accent px-4 py-2"
        >
          <Text className="text-sm font-semibold text-white">Try again</Text>
        </Pressable>
      </View>
    );
  }

  const showMap = hasValidCoordinates(booking);

  return (
    <View className="flex-1 bg-white">
      {showMap ? (
        <View className="h-64">
          <DeliveryMap latitude={booking.latitude} longitude={booking.longitude} />
        </View>
      ) : null}
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-8 pt-6">
        {Platform.OS === "web" ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              router.back();
            }}
            className="mb-4 self-start"
          >
            <Text className="text-sm font-semibold text-accent">Back</Text>
          </Pressable>
        ) : null}
        <Text className="text-[28px] font-bold tracking-tight text-ink">{booking.customerName}</Text>
        <Text className="mt-1 text-base text-ink-muted">{booking.customerEmail}</Text>
        <Text className="mt-4 text-base leading-6 text-ink">{booking.address}</Text>
        <Text className="mt-3 text-sm text-ink-muted">
          {booking.gallons} {booking.gallons === 1 ? "gallon" : "gallons"} · {formatPeso(booking.total)}
        </Text>
        <Text className="mt-2 text-sm font-semibold text-ink">
          {BOOKING_STATUS_LABEL[booking.status]}
        </Text>
        <Text className="mt-2 text-xs text-ink-muted">{formatWhen(Date.parse(booking.createdAt))}</Text>
        <View className="mt-6">
          <Button
            title="Navigate"
            onPress={() => {
              void navigateToStop(booking);
            }}
          />
        </View>
        <View style={{ height: insets.bottom }} />
      </ScrollView>
    </View>
  );
}

import { useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/src/tw";
import { Button } from "@/components/ui/button";
import { AssignedOrderCard } from "@/components/app/assigned-order-card";
import { useAssignedBookings } from "@/components/app/assigned-bookings-context";
import { useAppSession } from "@/hooks/use-session";
import { hasValidCoordinates, navigateAllStops } from "@/lib/navigation";

const PREVIEW_COUNT = 3;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAppSession();
  const { bookings, status, reload } = useAssignedBookings();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const readyBookings = bookings.filter((booking) => booking.status === "READY_TO_DELIVER");
  const preview = readyBookings.slice(0, PREVIEW_COUNT);

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-6 pb-8">
      <View style={{ height: insets.top + 16 }} />
      <Text className="text-[28px] font-bold tracking-tight text-ink">Dashboard</Text>
      <Text className="mt-2 text-base text-ink-muted">
        Hello, {user?.name ?? "driver"}. Your assigned deliveries.
      </Text>

      <View className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <Text className="text-sm font-semibold text-ink-muted">Assigned deliveries</Text>
        <Text className="mt-1 text-3xl font-bold text-ink">{String(readyBookings.length)}</Text>
      </View>

      <View className="mt-4">
        <Button
          title="Navigate All"
          onPress={() => {
            void navigateAllStops(
              readyBookings.filter((booking) => hasValidCoordinates(booking) || booking.address),
            );
          }}
          disabled={status !== "ready" || readyBookings.length === 0}
        />
      </View>

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

      {status === "ready" && readyBookings.length === 0 ? (
        <Text className="mt-8 text-base text-ink-muted">
          No assigned deliveries yet. New assignments appear here automatically.
        </Text>
      ) : null}

      {status === "ready" && preview.length > 0 ? (
        <View className="mt-8 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-ink">Upcoming</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                router.push("/orders");
              }}
            >
              <Text className="text-sm font-semibold text-accent">See all</Text>
            </Pressable>
          </View>
          {preview.map((booking) => (
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

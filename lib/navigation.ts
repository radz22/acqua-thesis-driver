import { Alert, Platform } from "react-native";
import * as Linking from "expo-linking";
import { toast } from "@/components/ui/toast";

export type MapStop = {
  address: string;
  latitude: number;
  longitude: number;
};

export const GOOGLE_MAPS_STOP_LIMIT = 10;

export function hasValidCoordinates(stop: Pick<MapStop, "latitude" | "longitude">) {
  return (
    Number.isFinite(stop.latitude) &&
    Number.isFinite(stop.longitude) &&
    stop.latitude >= -90 &&
    stop.latitude <= 90 &&
    stop.longitude >= -180 &&
    stop.longitude <= 180
  );
}

function destinationParam(stop: MapStop) {
  if (hasValidCoordinates(stop)) {
    return `${stop.latitude},${stop.longitude}`;
  }
  return stop.address.trim();
}

function directionsUrl(stops: MapStop[]) {
  const [last, ...restReversed] = [...stops].reverse();
  if (!last) return null;
  const waypoints = restReversed.reverse();
  const params = new URLSearchParams({
    api: "1",
    origin: "Current Location",
    destination: destinationParam(last),
    travelmode: "driving",
  });
  if (waypoints.length > 0) {
    params.set(
      "waypoints",
      waypoints.map((stop) => destinationParam(stop)).join("|"),
    );
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function chunkStops(stops: MapStop[], size: number) {
  const chunks: MapStop[][] = [];
  for (let index = 0; index < stops.length; index += size) {
    chunks.push(stops.slice(index, index + size));
  }
  return chunks;
}

async function openUrl(url: string) {
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error("Cannot open Google Maps");
  }
  await Linking.openURL(url);
}

export async function navigateToStop(stop: MapStop) {
  const url = directionsUrl([stop]);
  if (!url) {
    toast.error("This delivery has no destination.");
    return;
  }
  try {
    await openUrl(url);
  } catch {
    toast.error("Could not open Google Maps.");
  }
}

export async function navigateAllStops(stops: MapStop[]) {
  const eligible = stops.filter(
    (stop) => hasValidCoordinates(stop) || stop.address.trim().length > 0,
  );
  if (eligible.length === 0) {
    toast.error("No delivery locations to navigate.");
    return;
  }

  const chunks = chunkStops(eligible, GOOGLE_MAPS_STOP_LIMIT);
  const first = chunks[0];
  if (!first) return;
  const firstUrl = directionsUrl(first);
  if (!firstUrl) return;

  try {
    await openUrl(firstUrl);
  } catch {
    toast.error("Could not open Google Maps.");
    return;
  }

  for (let index = 1; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    if (!chunk) continue;
    const url = directionsUrl(chunk);
    if (!url) continue;
    const remaining = chunks.length - index;
    const shouldOpen = await confirmNextRoute(remaining);
    if (!shouldOpen) return;
    try {
      await openUrl(url);
    } catch {
      toast.error("Could not open the next Google Maps route.");
      return;
    }
  }
}

function confirmNextRoute(remaining: number) {
  if (Platform.OS === "web") {
    toast.success(`Opened the first route. ${String(remaining)} more route(s) remain.`);
    return Promise.resolve(false);
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      "More stops",
      `Google Maps allows ${String(GOOGLE_MAPS_STOP_LIMIT)} stops at a time. Open the next route (${String(remaining)} left)?`,
      [
        { text: "Later", style: "cancel", onPress: () => resolve(false) },
        { text: "Open next", onPress: () => resolve(true) },
      ],
    );
  });
}

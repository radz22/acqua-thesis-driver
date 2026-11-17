import { useState } from "react";
import { openSettings } from "expo-linking";
import { Pressable, Text, View } from "@/src/tw";
import { Image } from "@/src/tw/image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { completeDriverBooking, type Booking } from "@/lib/bookings";
import { captureDeliveryPhoto, fileFromCapturedPhoto, type CapturedPhoto } from "@/lib/delivery-photo";
import { useUploadThing } from "@/lib/uploadthing";

type CompletePhase = "PENDING_PHOTO" | "UPLOADING" | "CONFIRMING";

function deliveryUrlFromUpload(file: { serverData?: unknown; ufsUrl?: string; url?: string } | undefined) {
  if (!file) return null;
  if (file.serverData && typeof file.serverData === "object" && "url" in file.serverData) {
    const url = file.serverData.url;
    if (typeof url === "string" && url.length > 0) return url;
  }
  if (typeof file.ufsUrl === "string" && file.ufsUrl.length > 0) return file.ufsUrl;
  if (typeof file.url === "string" && file.url.length > 0) return file.url;
  return null;
}

export function CompleteOrderPanel({
  booking,
  onCompleted,
}: {
  booking: Booking;
  onCompleted: (booking: Booking) => void;
}) {
  const { startUpload } = useUploadThing("deliveryPhoto");
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<CompletePhase>("PENDING_PHOTO");

  const isBusy = phase === "UPLOADING" || phase === "CONFIRMING";

  async function takePhoto() {
    if (isBusy) return;
    const result = await captureDeliveryPhoto();
    if (result.kind === "permission") {
      toast.error("Camera access is required to complete a delivery.");
      void openSettings();
      return;
    }
    if (result.kind === "canceled") return;
    setPhoto(result.photo);
    setUploadedUrl(null);
  }

  async function submitCompletion() {
    if (isBusy) return;
    if (!photo && !uploadedUrl) {
      toast.error("Take a photo of the delivered item before completing the order.");
      await takePhoto();
      return;
    }

    let imageUrl = uploadedUrl;
    if (!imageUrl && photo) {
      setPhase("UPLOADING");
      try {
        const file = await fileFromCapturedPhoto(photo);
        const uploaded = await startUpload([file]);
        imageUrl = deliveryUrlFromUpload(uploaded?.[0]);
        if (!imageUrl) {
          throw new Error("Upload did not return an image URL.");
        }
        setUploadedUrl(imageUrl);
      } catch (error) {
        setPhase("PENDING_PHOTO");
        toast.error(error instanceof Error ? error.message : "Could not upload the delivery photo.");
        return;
      }
    }

    if (!imageUrl) {
      setPhase("PENDING_PHOTO");
      toast.error("Take a photo of the delivered item before completing the order.");
      return;
    }

    setPhase("CONFIRMING");
    try {
      const completed = await completeDriverBooking(booking.id, imageUrl);
      onCompleted(completed);
      toast.success("Order completed.");
    } catch (error) {
      setPhase("PENDING_PHOTO");
      toast.error(error instanceof Error ? error.message : "Could not complete the order.");
    }
  }

  const submitTitle =
    phase === "UPLOADING"
      ? "Uploading photo…"
      : phase === "CONFIRMING"
        ? "Completing order…"
        : photo
          ? "Submit completion"
          : "Complete Order";

  return (
    <View className="mt-6 gap-3">
      {photo ? (
        <View className="gap-3">
          <Text className="text-base font-semibold text-ink">Delivery photo</Text>
          <Image source={{ uri: photo.uri }} className="h-56 w-full rounded-2xl bg-line" contentFit="cover" />
          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => {
              void takePhoto();
            }}
            className="self-start"
          >
            <Text className={`text-sm font-semibold ${isBusy ? "text-ink-muted" : "text-accent"}`}>
              Retake photo
            </Text>
          </Pressable>
        </View>
      ) : null}
      <Button
        title={submitTitle}
        onPress={() => {
          void (photo || uploadedUrl ? submitCompletion() : takePhoto());
        }}
        disabled={isBusy}
        isLoading={isBusy}
      />
    </View>
  );
}

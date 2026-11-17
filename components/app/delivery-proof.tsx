import { useState } from "react";
import { Modal, Pressable as RNPressable } from "react-native";
import { Pressable, Text, View } from "@/src/tw";
import { Image } from "@/src/tw/image";
import { formatWhen } from "@/lib/format-when";

export function DeliveryProof({
  imageUrl,
  completedAt,
}: {
  imageUrl: string | null;
  completedAt: string | null;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <View className="mt-6 gap-3">
      <Text className="text-base font-semibold text-ink">Delivery proof</Text>
      {completedAt ? (
        <Text className="text-sm text-ink-muted">Completed {formatWhen(Date.parse(completedAt))}</Text>
      ) : null}
      {imageUrl && !failed ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View delivery photo"
            onPress={() => {
              setPreviewOpen(true);
            }}
          >
            <Image
              source={{ uri: imageUrl }}
              className="h-56 w-full rounded-2xl bg-line"
              contentFit="cover"
              onError={() => {
                setFailed(true);
              }}
            />
          </Pressable>
          <Modal
            visible={previewOpen}
            animationType="fade"
            onRequestClose={() => {
              setPreviewOpen(false);
            }}
          >
            <View className="flex-1 bg-black">
              <Image source={{ uri: imageUrl }} className="flex-1" contentFit="contain" />
              <RNPressable
                accessibilityRole="button"
                onPress={() => {
                  setPreviewOpen(false);
                }}
                style={{ position: "absolute", top: 56, right: 20 }}
              >
                <Text className="text-base font-semibold text-white">Close</Text>
              </RNPressable>
            </View>
          </Modal>
        </>
      ) : (
        <View className="gap-3">
          <Text className="text-sm text-ink-muted">The delivery photo could not be loaded.</Text>
          {imageUrl ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setFailed(false);
              }}
              className="self-start rounded-full bg-accent px-4 py-2"
            >
              <Text className="text-sm font-semibold text-white">Try again</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

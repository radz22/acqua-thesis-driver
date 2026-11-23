import { useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/src/tw";
import { ConversationRow } from "@/components/app/conversation-row";
import { useMessaging } from "@/components/app/messaging-context";

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { conversations, status, reload } = useMessaging();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-6 pb-8">
      <View style={{ height: insets.top + 16 }} />
      <Text className="text-[28px] font-bold tracking-tight text-ink">Inbox</Text>
      <Text className="mt-2 text-base text-ink-muted">Messages with your customers.</Text>

      {status === "loading" && conversations.length === 0 ? (
        <Text className="mt-8 text-base text-ink-muted">Loading conversations…</Text>
      ) : null}

      {status === "error" && conversations.length === 0 ? (
        <View className="mt-8 gap-3">
          <Text className="text-base text-ink-muted">Could not load your inbox.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void reload()}
            className="self-start rounded-full bg-accent px-4 py-2"
          >
            <Text className="text-sm font-semibold text-white">Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {status === "ready" && conversations.length === 0 ? (
        <Text className="mt-8 text-base text-ink-muted">
          No messages yet. Open an assigned order and tap Message customer to start a conversation.
        </Text>
      ) : null}

      <View className="mt-4">
        {conversations.map((conversation, index) => (
          <ConversationRow
            key={conversation.id}
            conversation={conversation}
            showDivider={index < conversations.length - 1}
            onPress={() => {
              router.push(`/chat/${conversation.id}`);
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}

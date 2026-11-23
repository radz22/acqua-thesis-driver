import { Pressable, Text, View } from "@/src/tw";
import { Avatar } from "@/components/app/avatar";
import type { Conversation } from "@/lib/conversations";
import { formatWhen } from "@/lib/format-when";

export function ConversationRow({
  conversation,
  onPress,
  showDivider,
}: {
  conversation: Conversation;
  onPress: () => void;
  showDivider: boolean;
}) {
  const preview =
    conversation.lastMessageType === "IMAGE"
      ? "Sent a photo"
      : conversation.lastMessagePreview || "No messages yet";
  const unread = conversation.unreadCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`flex-row items-center gap-3 py-4 ${showDivider ? "border-b border-line" : ""}`}
    >
      <Avatar name={conversation.otherParticipant.name} image={conversation.otherParticipant.image} />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-3">
          <Text className={`flex-1 text-base ${unread ? "font-bold text-ink" : "font-semibold text-ink"}`} numberOfLines={1}>
            {conversation.otherParticipant.name}
          </Text>
          <Text className="text-xs text-ink-muted">
            {formatWhen(Date.parse(conversation.lastMessageAt))}
          </Text>
        </View>
        <View className="mt-1 flex-row items-center justify-between gap-3">
          <Text className={`flex-1 text-sm ${unread ? "font-medium text-ink" : "text-ink-muted"}`} numberOfLines={1}>
            {preview}
          </Text>
          {unread ? (
            <View className="min-w-5 items-center rounded-full bg-accent px-1.5 py-0.5">
              <Text className="text-[11px] font-semibold text-white">
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

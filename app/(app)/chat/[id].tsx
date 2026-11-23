import { useLocalSearchParams } from "expo-router";
import { Text, View } from "@/src/tw";
import { ChatThread } from "@/components/app/chat-thread";

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";

  if (!id) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-base text-ink-muted">Conversation not found.</Text>
      </View>
    );
  }

  return <ChatThread conversationId={id} />;
}

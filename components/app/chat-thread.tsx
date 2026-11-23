import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  Modal,
  Platform,
  Pressable as RNPressable,
  View as RNView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openSettings } from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "@/src/tw";
import { Image } from "@/src/tw/image";
import { Avatar } from "@/components/app/avatar";
import { toast } from "@/components/ui/toast";
import { useMessaging } from "@/components/app/messaging-context";
import { colors } from "@/constants/colors";
import { useAppSession } from "@/hooks/use-session";
import {
  getConversation,
  listMessages,
  markConversationRead,
  sendMessage,
  type ChatMessage,
  type Conversation,
} from "@/lib/conversations";
import { fileFromPickedPhoto, pickChatImage, uploadUrlFromFile, type PickedPhoto } from "@/lib/chat-image";
import { formatWhen } from "@/lib/format-when";
import { useUploadThing } from "@/lib/uploadthing";

const EMOJIS = ["😀", "😂", "😍", "👍", "🙏", "❤️", "🔥", "🎉", "😅", "😊", "😢", "😮", "👏", "💯", "💧", "✅"];
const DRAFT_PREFIX = "chat-draft-";

type LocalMessage = ChatMessage & { status?: "sending" | "failed" };

function newNonce() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sameDay(left: string, right: string) {
  const a = new Date(left);
  const b = new Date(right);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function keyboardOverlap(frame: { y: number; height: number }, screenY: number) {
  if (frame.height <= 0) return 0;
  return Math.max(frame.y + frame.height - screenY, 0);
}

function mergeMessages(current: LocalMessage[], incoming: LocalMessage) {
  const byId = current.findIndex((row) => row.id === incoming.id);
  if (byId >= 0) {
    const next = [...current];
    next[byId] = incoming;
    return next;
  }
  const byNonce = current.findIndex(
    (row) => row.clientNonce === incoming.clientNonce && row.senderId === incoming.senderId,
  );
  if (byNonce >= 0) {
    const next = [...current];
    next[byNonce] = incoming;
    return next;
  }
  return [...current, incoming].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
}

export function ChatThread({ conversationId }: { conversationId: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAppSession();
  const {
    socket,
    applyConversation,
    setFocusedConversationId,
    removeConversation,
  } = useMessaging();
  const { startUpload } = useUploadThing("chatImage");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<PickedPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typing, setTyping] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const containerFrame = useRef({ y: 0, height: 0 });
  // screenY from the latest show event only. Hide events are not stored:
  // Android reports the pre-resize visible height, and a later layout pass
  // would turn that stale value into padding that never clears.
  const keyboardScreenY = useRef<number | null>(null);
  const blurFrame = useRef<number | null>(null);
  const nextCursor = useRef<string | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const userId = user?.id ?? "";

  const loadDraft = useCallback(async () => {
    try {
      const saved = await SecureStore.getItemAsync(`${DRAFT_PREFIX}${conversationId}`);
      if (saved) setDraft(saved);
    } catch {
      // Drafts are best-effort.
    }
  }, [conversationId]);

  const persistDraft = useCallback(
    async (value: string) => {
      try {
        const key = `${DRAFT_PREFIX}${conversationId}`;
        if (value.trim()) await SecureStore.setItemAsync(key, value);
        else await SecureStore.deleteItemAsync(key);
      } catch {
        // Drafts are best-effort.
      }
    },
    [conversationId],
  );

  const loadThread = useCallback(async () => {
    try {
      const [detail, page] = await Promise.all([
        getConversation(conversationId),
        listMessages(conversationId, { limit: 30 }),
      ]);
      setConversation(detail);
      applyConversation(detail);
      setMessages(page.messages);
      nextCursor.current = page.nextCursor;
      setHasMore(page.hasMore);
      setStatus("ready");
    } catch {
      setStatus((current) => (current === "ready" ? current : "error"));
    }
  }, [applyConversation, conversationId]);

  useFocusEffect(
    useCallback(() => {
      setFocusedConversationId(conversationId);
      void loadThread();
      void loadDraft();
      void markConversationRead(conversationId)
        .then((updated) => {
          setConversation(updated);
          applyConversation(updated);
        })
        .catch(() => {
          // Read receipts should not block opening the thread.
        });
      socket?.emit("conversation.join", { conversationId });
      return () => {
        setFocusedConversationId(null);
        socket?.emit("conversation.leave", { conversationId });
        socket?.emit("typing", { conversationId, typing: false });
      };
    }, [applyConversation, conversationId, loadDraft, loadThread, setFocusedConversationId, socket]),
  );

  useEffect(() => {
    if (!socket) return;
    const onCreated = (message: ChatMessage) => {
      if (message.conversationId !== conversationId) return;
      setMessages((current) => mergeMessages(current, message));
      if (message.senderId !== userId) {
        void markConversationRead(conversationId)
          .then((updated) => {
            setConversation(updated);
            applyConversation(updated);
          })
          .catch(() => undefined);
      }
    };
    const onRead = (payload: { conversationId: string; userId: string; lastReadAt: string }) => {
      if (payload.conversationId !== conversationId || payload.userId === userId) return;
      setConversation((current) =>
        current ? { ...current, otherLastReadAt: payload.lastReadAt } : current,
      );
    };
    const onTyping = (payload: { conversationId: string; userId: string; typing: boolean }) => {
      if (payload.conversationId !== conversationId || payload.userId === userId) return;
      setTyping(payload.typing);
    };
    const onRemoved = (payload: { id: string }) => {
      if (payload.id !== conversationId) return;
      removeConversation(conversationId);
      setStatus("error");
    };
    socket.on("message.created", onCreated);
    socket.on("message.read", onRead);
    socket.on("typing", onTyping);
    socket.on("conversation.removed", onRemoved);
    return () => {
      socket.off("message.created", onCreated);
      socket.off("message.read", onRead);
      socket.off("typing", onTyping);
      socket.off("conversation.removed", onRemoved);
    };
  }, [applyConversation, conversationId, removeConversation, socket, userId]);

  const publishKeyboardInset = useCallback(() => {
    if (Platform.OS !== "android") return;
    const screenY = keyboardScreenY.current;
    const next = screenY == null ? 0 : keyboardOverlap(containerFrame.current, screenY);
    setKeyboardInset((current) => (current === next ? current : next));
  }, []);

  const clearKeyboardInset = useCallback(() => {
    keyboardScreenY.current = null;
    setKeyboardInset(0);
    setKeyboardVisible(false);
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardVisible(true);
      if (Platform.OS !== "android") return;
      keyboardScreenY.current = event.endCoordinates.screenY;
      publishKeyboardInset();
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === "android") {
        clearKeyboardInset();
        return;
      }
      setKeyboardVisible(false);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [clearKeyboardInset, publishKeyboardInset]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const metrics = Keyboard.metrics();
    keyboardScreenY.current = metrics?.screenY ?? null;
    setKeyboardVisible(Boolean(metrics));
    if (metrics) publishKeyboardInset();
    else setKeyboardInset(0);
  }, [conversationId, publishKeyboardInset]);

  const handleKeyboardLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (Platform.OS !== "android") return;
      const { y, height } = event.nativeEvent.layout;
      const previous = containerFrame.current;
      containerFrame.current = { y, height };
      if (keyboardScreenY.current == null) return;
      // The window growing means the keyboard is closing. Recomputing against the
      // still-open screenY would pin the composer at the old keyboard height.
      if (previous.height > 0 && height > previous.height) {
        keyboardScreenY.current = null;
        setKeyboardInset(0);
        setKeyboardVisible(false);
        return;
      }
      if (previous.y !== y || previous.height !== height) publishKeyboardInset();
    },
    [publishKeyboardInset],
  );

  const handleInputBlur = useCallback(() => {
    if (Platform.OS !== "android") return;
    if (blurFrame.current != null) cancelAnimationFrame(blurFrame.current);
    blurFrame.current = requestAnimationFrame(() => {
      blurFrame.current = null;
      if (!Keyboard.isVisible()) clearKeyboardInset();
    });
  }, [clearKeyboardInset]);

  useEffect(() => {
    return () => {
      if (blurFrame.current != null) cancelAnimationFrame(blurFrame.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return undefined;
      const metrics = Keyboard.metrics();
      keyboardScreenY.current = metrics?.screenY ?? null;
      if (!metrics) {
        setKeyboardInset(0);
        setKeyboardVisible(false);
        return undefined;
      }
      setKeyboardVisible(true);
      publishKeyboardInset();
      return undefined;
    }, [publishKeyboardInset]),
  );

  async function loadOlder() {
    if (!hasMore || loadingMore || !nextCursor.current) return;
    setLoadingMore(true);
    try {
      const page = await listMessages(conversationId, { cursor: nextCursor.current, limit: 30 });
      setMessages((current) => {
        const seen = new Set(current.map((row) => row.id));
        return [...page.messages.filter((row) => !seen.has(row.id)), ...current];
      });
      nextCursor.current = page.nextCursor;
      setHasMore(page.hasMore);
    } catch {
      toast.error("Could not load earlier messages.");
    } finally {
      setLoadingMore(false);
    }
  }

  function emitTyping(next: boolean) {
    socket?.emit("typing", { conversationId, typing: next });
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    void persistDraft(value);
    emitTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(false), 1500);
  }

  async function submit(text: string, photo: PickedPhoto | null, nonce: string) {
    const trimmed = text.trim();
    if (!trimmed && !photo) return;

    const optimistic: LocalMessage = {
      id: `local-${nonce}`,
      conversationId,
      senderId: userId,
      type: photo ? "IMAGE" : "TEXT",
      content: photo ? "" : trimmed,
      attachmentUrl: photo?.uri ?? null,
      clientNonce: nonce,
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    setMessages((current) => mergeMessages(current, optimistic));
    setDraft("");
    setPendingPhoto(null);
    setEmojiOpen(false);
    void persistDraft("");
    emitTyping(false);

    try {
      let attachmentUrl: string | undefined;
      if (photo) {
        setUploading(true);
        const file = await fileFromPickedPhoto(photo);
        const uploaded = await startUpload([file]);
        attachmentUrl = uploadUrlFromFile(uploaded?.[0]) ?? undefined;
        if (!attachmentUrl) throw new Error("Upload did not return an image URL.");
      }
      const saved = await sendMessage(conversationId, {
        type: photo ? "IMAGE" : "TEXT",
        content: photo ? undefined : trimmed,
        attachmentUrl,
        clientNonce: nonce,
      });
      setMessages((current) => mergeMessages(current, saved));
    } catch (error) {
      setMessages((current) =>
        current.map((row) => (row.clientNonce === nonce ? { ...row, status: "failed" } : row)),
      );
      toast.error(error instanceof Error ? error.message : "Could not send the message.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSend() {
    if (uploading) return;
    await submit(draft, pendingPhoto, newNonce());
  }

  async function retry(message: LocalMessage) {
    if (message.status !== "failed") return;
    const photo =
      message.type === "IMAGE" && message.attachmentUrl && !message.attachmentUrl.startsWith("http")
        ? { uri: message.attachmentUrl, mimeType: "image/jpeg", fileName: "chat.jpg" }
        : pendingPhoto;
    const remoteUrl = message.type === "IMAGE" && message.attachmentUrl?.startsWith("http")
      ? message.attachmentUrl
      : null;
    setMessages((current) =>
      current.map((row) => (row.id === message.id ? { ...row, status: "sending" } : row)),
    );
    try {
      let attachmentUrl = remoteUrl ?? undefined;
      if (message.type === "IMAGE" && !attachmentUrl && photo) {
        setUploading(true);
        const file = await fileFromPickedPhoto(photo);
        const uploaded = await startUpload([file]);
        attachmentUrl = uploadUrlFromFile(uploaded?.[0]) ?? undefined;
        if (!attachmentUrl) throw new Error("Upload did not return an image URL.");
      }
      const saved = await sendMessage(conversationId, {
        type: message.type,
        content: message.type === "TEXT" ? message.content : undefined,
        attachmentUrl,
        clientNonce: message.clientNonce,
      });
      setMessages((current) => mergeMessages(current, saved));
    } catch (error) {
      setMessages((current) =>
        current.map((row) => (row.id === message.id ? { ...row, status: "failed" } : row)),
      );
      toast.error(error instanceof Error ? error.message : "Could not send the message.");
    } finally {
      setUploading(false);
    }
  }

  async function handlePickImage() {
    const result = await pickChatImage();
    if (result.kind === "permission") {
      toast.error("Photo library access is required to send images.");
      void openSettings();
      return;
    }
    if (result.kind === "canceled") return;
    setPendingPhoto(result.photo);
  }

  const lastOutgoingId = useMemo(() => {
    const mine = [...messages].reverse().find((row) => row.senderId === userId && !row.status);
    return mine?.id ?? null;
  }, [messages, userId]);

  const otherLastReadAt = conversation?.otherLastReadAt
    ? Date.parse(conversation.otherLastReadAt)
    : 0;

  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-base text-ink-muted">Loading conversation…</Text>
      </View>
    );
  }

  if (status === "error" || !conversation) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-base text-ink-muted">
          This conversation is not available.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void loadThread()}
          className="mt-4 rounded-full bg-accent px-4 py-2"
        >
          <Text className="text-sm font-semibold text-white">Try again</Text>
        </Pressable>
      </View>
    );
  }

  const other = conversation.otherParticipant;
  const canSend = Boolean(draft.trim() || pendingPhoto) && !uploading;

  const thread = (
    <>
      <View className="flex-1 bg-white">
        <View
          className="flex-row items-center gap-3 border-b border-line px-4 pb-3"
          style={{ paddingTop: insets.top + 8 }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </Pressable>
          <Avatar name={other.name} image={other.image} size={36} />
          <View className="flex-1">
            <Text className="text-base font-semibold text-ink" numberOfLines={1}>
              {other.name}
            </Text>
            {typing ? <Text className="text-xs text-accent">Typing…</Text> : null}
          </View>
        </View>

        <FlatList
          style={{ flex: 1 }}
          data={[...messages].reverse()}
          inverted
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onEndReached={() => void loadOlder()}
          onEndReachedThreshold={0.2}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator className="my-3 text-ink-muted" />
            ) : null
          }
          renderItem={({ item, index }) => {
            const chronological = messages;
            const realIndex = chronological.length - 1 - index;
            const previous = realIndex > 0 ? chronological[realIndex - 1] : null;
            const mine = item.senderId === userId;
            const grouped = Boolean(
              previous &&
                previous.senderId === item.senderId &&
                Date.parse(item.createdAt) - Date.parse(previous.createdAt) < 2 * 60 * 1000,
            );
            const showDay = !previous || !sameDay(previous.createdAt, item.createdAt);
            const seen = mine && item.id === lastOutgoingId && Date.parse(item.createdAt) <= otherLastReadAt;
            const delivered = mine && item.id === lastOutgoingId && !item.status;

            return (
              <View>
                {showDay ? (
                  <Text className="mb-3 mt-2 text-center text-xs text-ink-muted">
                    {dayLabel(item.createdAt)}
                  </Text>
                ) : null}
                <View className={`mb-1 flex-row ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine && !grouped ? (
                    <View className="mr-2 self-end">
                      <Avatar name={other.name} image={other.image} size={28} />
                    </View>
                  ) : (
                    <View className="w-9" />
                  )}
                  <View className={`max-w-[78%] ${mine ? "items-end" : "items-start"}`}>
                    {item.type === "IMAGE" && item.attachmentUrl ? (
                      <RNPressable onPress={() => setPreviewUrl(item.attachmentUrl)}>
                        <Image
                          source={{ uri: item.attachmentUrl }}
                          className="h-44 w-44 rounded-2xl bg-line"
                          contentFit="cover"
                        />
                      </RNPressable>
                    ) : (
                      <View
                        className={`rounded-2xl px-3 py-2 ${
                          mine ? "bg-accent" : "bg-line"
                        } ${grouped ? "" : mine ? "rounded-br-md" : "rounded-bl-md"}`}
                      >
                        <Text className={`text-[15px] leading-5 ${mine ? "text-white" : "text-ink"}`}>
                          {item.content}
                        </Text>
                      </View>
                    )}
                    <View className="mt-0.5 flex-row items-center gap-1">
                      <Text className="text-[11px] text-ink-muted">
                        {formatWhen(Date.parse(item.createdAt))}
                      </Text>
                      {item.status === "sending" ? (
                        <Text className="text-[11px] text-ink-muted">Sending</Text>
                      ) : null}
                      {item.status === "failed" ? (
                        <Pressable accessibilityRole="button" onPress={() => void retry(item)}>
                          <Text className="text-[11px] font-semibold text-danger">Retry</Text>
                        </Pressable>
                      ) : null}
                      {delivered ? (
                        <Ionicons
                          name={seen ? "checkmark-done" : "checkmark"}
                          size={14}
                          color={seen ? colors.accent : colors.inkMuted}
                        />
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />

        {pendingPhoto ? (
          <View className="flex-row items-center gap-3 border-t border-line px-4 py-2">
            <Image
              source={{ uri: pendingPhoto.uri }}
              className="h-14 w-14 rounded-xl bg-line"
              contentFit="cover"
            />
            <Text className="flex-1 text-sm text-ink-muted">Photo ready to send</Text>
            <Pressable accessibilityRole="button" onPress={() => setPendingPhoto(null)}>
              <Text className="text-sm font-semibold text-danger">Remove</Text>
            </Pressable>
          </View>
        ) : null}

        {emojiOpen ? (
          <View className="flex-row flex-wrap gap-2 border-t border-line px-4 py-3">
            {EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                accessibilityRole="button"
                onPress={() => handleDraftChange(draft + emoji)}
                className="h-10 w-10 items-center justify-center"
              >
                <Text className="text-2xl">{emoji}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View
          className="flex-row items-end gap-2 border-t border-line px-3 pt-2"
          style={{ paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 10) }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => void handlePickImage()}
            className="mb-1 h-10 w-10 items-center justify-center"
          >
            <Ionicons name="image-outline" size={22} color={colors.ink} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setEmojiOpen((open) => !open)}
            className="mb-1 h-10 w-10 items-center justify-center"
          >
            <Ionicons name="happy-outline" size={22} color={colors.ink} />
          </Pressable>
          <TextInput
            className="max-h-28 min-h-11 flex-1 rounded-2xl border border-line bg-white px-3 py-2.5 text-base text-ink"
            placeholder="Message"
            placeholderTextColor={colors.inkMuted}
            value={draft}
            onChangeText={handleDraftChange}
            onFocus={() => setEmojiOpen(false)}
            onBlur={handleInputBlur}
            multiline
            onSubmitEditing={() => {
              if (Platform.OS !== "web") return;
              void handleSend();
            }}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!canSend}
            onPress={() => void handleSend()}
            className={`mb-1 h-10 w-10 items-center justify-center rounded-full ${
              canSend ? "bg-accent" : "bg-disabled"
            }`}
          >
            {uploading ? (
              <ActivityIndicator className="text-white" />
            ) : (
              <Ionicons name="send" size={16} color="#ffffff" />
            )}
          </Pressable>
        </View>
      </View>

      <Modal visible={Boolean(previewUrl)} transparent animationType="fade" onRequestClose={() => setPreviewUrl(null)}>
        <RNPressable
          onPress={() => setPreviewUrl(null)}
          style={{ flex: 1, backgroundColor: "rgba(16,46,80,0.92)", justifyContent: "center", padding: 16 }}
        >
          {previewUrl ? (
            <Image source={{ uri: previewUrl }} className="h-full w-full" contentFit="contain" />
          ) : null}
        </RNPressable>
      </Modal>
    </>
  );

  if (Platform.OS === "ios") {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.surface }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {thread}
      </KeyboardAvoidingView>
    );
  }

  return (
    <RNView
      style={{ flex: 1, backgroundColor: colors.surface }}
      collapsable={false}
      onLayout={handleKeyboardLayout}
    >
      <RNView style={{ flex: 1, paddingBottom: keyboardInset }}>{thread}</RNView>
    </RNView>
  );
}

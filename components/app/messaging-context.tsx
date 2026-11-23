import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "expo-router";
import { addNetworkStateListener } from "expo-network";
import type { Socket } from "socket.io-client";
import { toast } from "@/components/ui/toast";
import { useAppSession } from "@/hooks/use-session";
import {
  getUnreadCount,
  listConversations,
  type ChatMessage,
  type Conversation,
} from "@/lib/conversations";
import { addNotificationResponseListener, registerDevicePushToken } from "@/lib/push";
import { connectAppSocket } from "@/lib/realtime";

type LoadStatus = "loading" | "ready" | "error";

type MessagingValue = {
  conversations: Conversation[];
  unreadCount: number;
  status: LoadStatus;
  socket: Socket | null;
  focusedConversationId: string | null;
  setFocusedConversationId: (id: string | null) => void;
  reload: () => Promise<void>;
  applyConversation: (conversation: Conversation) => void;
  removeConversation: (id: string) => void;
};

const MessagingContext = createContext<MessagingValue | null>(null);

function sortConversations(list: Conversation[]) {
  return [...list].sort(
    (left, right) => Date.parse(right.lastMessageAt) - Date.parse(left.lastMessageAt),
  );
}

function upsertConversation(list: Conversation[], incoming: Conversation) {
  const next = new Map(list.map((conversation) => [conversation.id, conversation]));
  next.set(incoming.id, incoming);
  return sortConversations([...next.values()]);
}

export function MessagingProvider({
  children,
  socket: externalSocket,
}: {
  children: ReactNode;
  socket?: Socket | null;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSession();
  const [ownedSocket, setOwnedSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [focusedConversationId, setFocusedConversationId] = useState<string | null>(null);
  const focusedRef = useRef<string | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const userIdRef = useRef<string | null>(null);
  const requestId = useRef(0);
  const socket = externalSocket === undefined ? ownedSocket : externalSocket;

  useEffect(() => {
    focusedRef.current = focusedConversationId;
  }, [focusedConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const [page, unread] = await Promise.all([
        listConversations({ page: 1, limit: 50 }),
        getUnreadCount(),
      ]);
      if (id !== requestId.current) return;
      setConversations(sortConversations(page.conversations));
      setUnreadCount(unread.unreadCount);
      setStatus("ready");
    } catch {
      if (id !== requestId.current) return;
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setStatus("loading");
    void reload();
    void registerDevicePushToken();
  }, [isAuthenticated, reload]);

  useEffect(() => {
    if (!isAuthenticated || externalSocket !== undefined) return;
    const next = connectAppSocket();
    setOwnedSocket(next);
    return () => {
      next.removeAllListeners();
      next.disconnect();
      setOwnedSocket(null);
    };
  }, [externalSocket, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !socket) return;

    const onConversationUpdated = (conversation: Conversation) => {
      setConversations((current) => upsertConversation(current, conversation));
    };
    const onConversationRemoved = (payload: { id: string }) => {
      setConversations((current) => current.filter((conversation) => conversation.id !== payload.id));
    };
    const onUnread = (payload: { unreadCount: number }) => {
      setUnreadCount(payload.unreadCount);
    };
    const onMessageCreated = (message: ChatMessage) => {
      if (message.senderId === userIdRef.current) return;
      if (focusedRef.current === message.conversationId) return;
      const conversation = conversationsRef.current.find((row) => row.id === message.conversationId);
      const name = conversation?.otherParticipant.name ?? "New message";
      const preview =
        message.type === "IMAGE" ? "Sent a photo" : message.content || "New message";
      toast.success(`${name}: ${preview}`);
    };
    const onConnect = () => {
      void reload();
    };

    socket.on("conversation.updated", onConversationUpdated);
    socket.on("conversation.removed", onConversationRemoved);
    socket.on("unread.updated", onUnread);
    socket.on("message.created", onMessageCreated);
    socket.on("connect", onConnect);

    return () => {
      socket.off("conversation.updated", onConversationUpdated);
      socket.off("conversation.removed", onConversationRemoved);
      socket.off("unread.updated", onUnread);
      socket.off("message.created", onMessageCreated);
      socket.off("connect", onConnect);
    };
  }, [isAuthenticated, reload, socket]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let wasConnected = true;
    const subscription = addNetworkStateListener((state) => {
      const connected = state.isConnected !== false;
      if (connected && !wasConnected) {
        void reload();
      }
      wasConnected = connected;
    });
    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, reload]);

  useEffect(() => {
    if (!isAuthenticated) return;
    return addNotificationResponseListener((conversationId) => {
      router.push(`/chat/${conversationId}`);
    });
  }, [isAuthenticated, router]);

  const applyConversation = useCallback((conversation: Conversation) => {
    setConversations((current) => upsertConversation(current, conversation));
  }, []);

  const removeConversation = useCallback((id: string) => {
    setConversations((current) => current.filter((conversation) => conversation.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      conversations,
      unreadCount,
      status,
      socket,
      focusedConversationId,
      setFocusedConversationId,
      reload,
      applyConversation,
      removeConversation,
    }),
    [
      applyConversation,
      conversations,
      focusedConversationId,
      reload,
      removeConversation,
      socket,
      status,
      unreadCount,
    ],
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
}

export function useMessaging() {
  const value = useContext(MessagingContext);
  if (!value) {
    throw new Error("useMessaging must be used within MessagingProvider");
  }
  return value;
}

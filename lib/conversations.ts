import { API_URL } from "@/constants";
import { authClient } from "@/lib/auth-client";

export type MessageType = "TEXT" | "IMAGE";

export type ConversationParticipant = {
  id: string;
  name: string;
  image: string | null;
  role: string;
};

export type Conversation = {
  id: string;
  bookingId: string;
  otherParticipant: ConversationParticipant;
  lastMessagePreview: string | null;
  lastMessageType: MessageType | null;
  lastMessageAt: string;
  unreadCount: number;
  otherLastReadAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  attachmentUrl: string | null;
  clientNonce: string;
  createdAt: string;
};

export type ConversationPage = {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type MessagePage = {
  messages: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
};

type ErrorBody = {
  error?: string;
  message?: string;
};

async function conversationFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  const cookie = authClient.getCookie();
  if (cookie) headers.set("cookie", cookie);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const body = (await response.json()) as ErrorBody;
      message = body.message ?? body.error ?? message;
    } catch {
      // The status line is enough when the body is not JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function listConversations(params: { page?: number; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return conversationFetch<ConversationPage>(`/api/conversations${query ? `?${query}` : ""}`);
}

export function getOrCreateConversation(bookingId: string) {
  return conversationFetch<Conversation>("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ bookingId }),
  });
}

export function getConversation(id: string) {
  return conversationFetch<Conversation>(`/api/conversations/${encodeURIComponent(id)}`);
}

export function listMessages(id: string, params: { cursor?: string; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return conversationFetch<MessagePage>(
    `/api/conversations/${encodeURIComponent(id)}/messages${query ? `?${query}` : ""}`,
  );
}

export function sendMessage(
  id: string,
  body: {
    type: MessageType;
    content?: string;
    attachmentUrl?: string;
    clientNonce: string;
  },
) {
  return conversationFetch<ChatMessage>(`/api/conversations/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function markConversationRead(id: string) {
  return conversationFetch<Conversation>(`/api/conversations/${encodeURIComponent(id)}/read`, {
    method: "POST",
  });
}

export function getUnreadCount() {
  return conversationFetch<{ unreadCount: number }>("/api/conversations/unread-count");
}

export function registerPushToken(token: string, platform: "ios" | "android") {
  return conversationFetch<void>("/api/push-tokens", {
    method: "POST",
    body: JSON.stringify({ token, platform }),
  });
}

export function deletePushToken(token: string) {
  return conversationFetch<void>("/api/push-tokens", {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });
}

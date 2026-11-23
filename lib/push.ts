import { Platform } from "react-native";
import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import { deletePushToken, registerPushToken as savePushToken } from "@/lib/conversations";

const TOKEN_KEY = "__acquaPushToken";

type NotificationsModule = typeof import("expo-notifications");

function loadNotifications(): NotificationsModule | null {
  // shortcut: Expo Go Android throws on import of expo-notifications (SDK 53+), use a development build for push
  if (Platform.OS === "web" || isRunningInExpoGo()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo Go throws if this module is evaluated
    return require("expo-notifications") as NotificationsModule;
  } catch {
    return null;
  }
}

const Notifications = loadNotifications();

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function storedToken() {
  const globalState = globalThis as { [TOKEN_KEY]?: string };
  return globalState[TOKEN_KEY];
}

function setStoredToken(token: string | undefined) {
  const globalState = globalThis as { [TOKEN_KEY]?: string };
  if (token) globalState[TOKEN_KEY] = token;
  else delete globalState[TOKEN_KEY];
}

export function addNotificationResponseListener(onConversation: (conversationId: string) => void) {
  if (!Notifications) return () => {};
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as { conversationId?: unknown };
    if (typeof data.conversationId === "string" && data.conversationId.length > 0) {
      onConversation(data.conversationId);
    }
  });
  return () => {
    subscription.remove();
  };
}

export async function registerDevicePushToken() {
  if (!Notifications) return;
  if (Platform.OS !== "ios" && Platform.OS !== "android") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("messages", {
      name: "Messages",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted
    ? existing
    : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return;

  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    await savePushToken(result.data, Platform.OS);
    setStoredToken(result.data);
  } catch {
    // Simulators and missing credentials cannot register for push.
  }
}

export async function unregisterDevicePushToken() {
  const token = storedToken();
  if (!token) return;
  try {
    await deletePushToken(token);
  } catch {
    // Signing out should still continue if the token call fails.
  }
  setStoredToken(undefined);
}

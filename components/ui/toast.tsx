import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string };
type Listener = (item: ToastItem | null) => void;

type ToastStore = {
  listeners: Set<Listener>;
  current: ToastItem | null;
  hideTimer: ReturnType<typeof setTimeout> | undefined;
  nextId: number;
};

const toastStore: ToastStore = (() => {
  const globalState = globalThis as { __acquaToast?: ToastStore };
  globalState.__acquaToast ??= {
    listeners: new Set(),
    current: null,
    hideTimer: undefined,
    nextId: 1,
  };
  return globalState.__acquaToast;
})();

function emit() {
  for (const listener of toastStore.listeners) listener(toastStore.current);
}

function show(kind: ToastKind, message: string) {
  if (toastStore.hideTimer) clearTimeout(toastStore.hideTimer);
  toastStore.current = { id: toastStore.nextId++, kind, message };
  emit();
  toastStore.hideTimer = setTimeout(() => {
    toastStore.current = null;
    emit();
  }, 4000);
}

function dismiss() {
  if (toastStore.hideTimer) clearTimeout(toastStore.hideTimer);
  toastStore.current = null;
  emit();
}

export const toast = {
  success(message: string) {
    show("success", message);
  },
  error(message: string) {
    show("error", message);
  },
};

export function Toaster() {
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<ToastItem | null>(toastStore.current);

  useEffect(() => {
    toastStore.listeners.add(setItem);
    return () => {
      toastStore.listeners.delete(setItem);
    };
  }, []);

  if (!item) return null;

  const isSuccess = item.kind === "success";

  return (
    <View pointerEvents="box-none" style={[styles.overlay, { top: insets.top + 12 }]}>
      <Pressable
        onPress={dismiss}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[styles.toast, isSuccess ? styles.success : styles.error]}
      >
        <View style={[styles.bar, isSuccess ? styles.barSuccess : styles.barError]} />
        <Text style={[styles.message, isSuccess ? styles.messageSuccess : styles.messageError]}>
          {item.message}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 99999,
    elevation: 99999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 16,
    paddingVertical: 14,
    paddingRight: 16,
    shadowColor: "#222222",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  success: {
    backgroundColor: "#222222",
  },
  error: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  bar: {
    width: 4,
    alignSelf: "stretch",
    marginRight: 14,
  },
  barSuccess: {
    backgroundColor: "#7ef0ff",
  },
  barError: {
    backgroundColor: "#b42318",
  },
  message: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  messageSuccess: {
    color: "#ffffff",
  },
  messageError: {
    color: "#b42318",
  },
});

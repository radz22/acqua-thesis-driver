import { KeyboardAvoidingView, Platform } from "react-native";
import { ScrollView } from "@/src/tw";

type AuthFormLayoutProps = {
  children: React.ReactNode;
};

export function AuthFormLayout({ children }: AuthFormLayoutProps) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1 bg-white"
        contentContainerClassName="flex-1 justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { View, ScrollView } from "@/src/tw";

type AuthFormLayoutProps = {
  children: React.ReactNode;
};

export function AuthFormLayout({ children }: AuthFormLayoutProps) {
  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      contentContainerClassName="flex-1 items-center justify-center px-4 py-12"
    >
      <View className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white px-8 py-10 shadow-sm">
        {children}
      </View>
    </ScrollView>
  );
}

import { View, ScrollView } from "@/src/tw";

type AppScreenLayoutProps = {
  children: React.ReactNode;
};

export function AppScreenLayout({ children }: AppScreenLayoutProps) {
  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      contentContainerClassName="items-center px-4 py-8"
    >
      <View className="w-full max-w-2xl">{children}</View>
    </ScrollView>
  );
}

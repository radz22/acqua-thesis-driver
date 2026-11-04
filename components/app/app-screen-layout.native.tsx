import { ScrollView } from "@/src/tw";

type AppScreenLayoutProps = {
  children: React.ReactNode;
};

export function AppScreenLayout({ children }: AppScreenLayoutProps) {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-6 py-8 gap-8"
      contentInsetAdjustmentBehavior="automatic"
    >
      {children}
    </ScrollView>
  );
}

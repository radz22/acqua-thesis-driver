import type { ImageProps } from "expo-image";
import { View, ScrollView, Text } from "@/src/tw";
import { Image } from "@/src/tw/image";
import { APP_LOGO } from "@/constants/assets";

type AuthFormLayoutProps = {
  children: React.ReactNode;
  hero: ImageProps["source"];
  title: string;
  subtitle: React.ReactNode;
};

export function AuthFormLayout({ children, hero, title, subtitle }: AuthFormLayoutProps) {
  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerClassName="min-h-full items-center justify-center px-4 py-6"
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-[390px] overflow-hidden rounded-[32px] bg-white shadow-lg">
        <Image source={hero} className="h-[148px] w-full" contentFit="cover" />
        <View className="-mt-8 rounded-t-[32px] bg-white px-6 pb-5 pt-5">
          <Image source={APP_LOGO} className="mb-3 h-9 w-36" contentFit="contain" />
          <Text className="text-[26px] font-bold tracking-tight text-ink">{title}</Text>
          <Text className="mt-1.5 text-[15px] leading-6 text-ink-muted">{subtitle}</Text>
          <View className="mt-5">{children}</View>
        </View>
      </View>
    </ScrollView>
  );
}

import { KeyboardAvoidingView, Platform, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

const HERO_RATIO = 0.4;

export function AuthFormLayout({ children, hero, title, subtitle }: AuthFormLayoutProps) {
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(Dimensions.get("window").height * HERO_RATIO);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-white">
        <Image
          source={hero}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            width: "100%",
            height: heroHeight,
          }}
          contentFit="cover"
        />
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ height: heroHeight - 36 }} />
          <View
            className="flex-grow rounded-t-[32px] bg-white px-6 pt-7"
            style={{
              paddingBottom: Math.max(insets.bottom, 16) + 12,
              shadowColor: "#222222",
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <Image source={APP_LOGO} className="mb-6 h-10 w-40" contentFit="contain" />
            <Text className="text-[28px] font-bold tracking-tight text-ink">{title}</Text>
            <Text className="mt-2 text-base leading-6 text-ink-muted">{subtitle}</Text>
            <View className="mt-8">{children}</View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

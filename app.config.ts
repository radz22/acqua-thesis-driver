import { type ConfigContext, type ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return {
    ...config,
    name: config.name ?? "AquaBest Driver",
    slug: config.slug ?? "aquabest-driver",
    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        googleMapsApiKey,
      },
      infoPlist: {
        ...config.ios?.infoPlist,
        NSLocationWhenInUseUsageDescription:
          "AquaBest Driver uses your location to navigate to delivery addresses.",
        NSCameraUsageDescription:
          "AquaBest Driver uses the camera to photograph the delivered water gallons.",
      },
    },
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    plugins: [
      ...(config.plugins ?? []),
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "AquaBest Driver uses your location to navigate to delivery addresses.",
        },
      ],
      [
        "expo-image-picker",
        {
          cameraPermission:
            "AquaBest Driver uses the camera to photograph the delivered water gallons.",
        },
      ],
      [
        "react-native-maps",
        {
          iosGoogleMapsApiKey: googleMapsApiKey,
          androidGoogleMapsApiKey: googleMapsApiKey,
        },
      ],
    ],
  };
};

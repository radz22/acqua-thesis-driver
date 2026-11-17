import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { MAP_TYPES, Marker, PROVIDER_GOOGLE, UrlTile } from "react-native-maps";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { EXPO_GO_TILE_URL, USER_LOCATION_DELTA } from "@/constants/map";

const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const mapProvider = !isExpoGo ? PROVIDER_GOOGLE : undefined;
const useFallbackTiles = isExpoGo && Platform.OS === "android";

export function DeliveryMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const region = {
    latitude,
    longitude,
    ...USER_LOCATION_DELTA,
  };

  return (
    <View style={styles.fill}>
      <MapView
        {...(mapProvider ? { provider: mapProvider } : {})}
        style={StyleSheet.absoluteFill}
        mapType={useFallbackTiles ? MAP_TYPES.NONE : MAP_TYPES.STANDARD}
        initialRegion={region}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        showsIndoors={false}
        userInterfaceStyle="light"
      >
        {useFallbackTiles ? (
          <UrlTile
            urlTemplate={EXPO_GO_TILE_URL}
            maximumZ={19}
            flipY={false}
            shouldReplaceMapContent
          />
        ) : null}
        <Marker coordinate={{ latitude, longitude }} />
      </MapView>
      {useFallbackTiles ? (
        <Text pointerEvents="none" style={styles.attribution}>
          © OpenStreetMap © CARTO
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  attribution: {
    position: "absolute",
    left: 8,
    bottom: 8,
    fontSize: 10,
    color: "#4a6380",
  },
});

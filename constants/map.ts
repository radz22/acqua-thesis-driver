export const DEFAULT_REGION = {
  latitude: 15.147,
  longitude: 120.584,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

export const USER_LOCATION_DELTA = {
  latitudeDelta: 0.008,
  longitudeDelta: 0.008,
};

// Expo Go on SDK 55 no longer serves Google Map tiles. Carto/OSM fills the map
// on Android Expo Go; native builds still use Google Maps.
export const EXPO_GO_TILE_URL =
  "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png";

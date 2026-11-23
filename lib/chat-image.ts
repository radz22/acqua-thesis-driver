import * as ImagePicker from "expo-image-picker";

export type PickedPhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export type PickPhotoResult =
  | { kind: "ok"; photo: PickedPhoto }
  | { kind: "canceled" }
  | { kind: "permission" };

export async function pickChatImage(): Promise<PickPhotoResult> {
  const existing = await ImagePicker.getMediaLibraryPermissionsAsync();
  const permission = existing.granted
    ? existing
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return { kind: "permission" };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: false,
  });

  const asset = result.canceled ? null : (result.assets[0] ?? null);
  if (!asset?.uri) {
    return { kind: "canceled" };
  }

  return {
    kind: "ok",
    photo: {
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
      fileName: asset.fileName ?? "chat.jpg",
    },
  };
}

export async function fileFromPickedPhoto(photo: PickedPhoto): Promise<File> {
  const blob = await fetch(photo.uri).then((response) => response.blob());
  const file = new File([blob], photo.fileName, { type: photo.mimeType });
  return Object.assign(file, { uri: photo.uri });
}

export function uploadUrlFromFile(file: { serverData?: unknown; ufsUrl?: string; url?: string } | undefined) {
  if (!file) return null;
  if (file.serverData && typeof file.serverData === "object" && "url" in file.serverData) {
    const url = file.serverData.url;
    if (typeof url === "string" && url.length > 0) return url;
  }
  if (typeof file.ufsUrl === "string" && file.ufsUrl.length > 0) return file.ufsUrl;
  if (typeof file.url === "string" && file.url.length > 0) return file.url;
  return null;
}

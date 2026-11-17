import * as ImagePicker from "expo-image-picker";

export type CapturedPhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export type CapturePhotoResult =
  | { kind: "ok"; photo: CapturedPhoto }
  | { kind: "canceled" }
  | { kind: "permission" };

export async function captureDeliveryPhoto(): Promise<CapturePhotoResult> {
  const existing = await ImagePicker.getCameraPermissionsAsync();
  const permission = existing.granted
    ? existing
    : await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    return { kind: "permission" };
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: false,
    cameraType: ImagePicker.CameraType.back,
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
      fileName: asset.fileName ?? "delivery.jpg",
    },
  };
}

export async function fileFromCapturedPhoto(photo: CapturedPhoto): Promise<File> {
  const blob = await fetch(photo.uri).then((response) => response.blob());
  const file = new File([blob], photo.fileName, { type: photo.mimeType });
  return Object.assign(file, { uri: photo.uri });
}

import { Platform } from "react-native";
import { generateReactNativeHelpers } from "@uploadthing/expo";
import { API_URL } from "@/constants";
import { authClient } from "@/lib/auth-client";

function uploadThingFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = String(typeof input === "object" && "url" in input ? input.url : input);
  if (!url.startsWith(API_URL)) {
    return fetch(input, init);
  }

  if (Platform.OS === "web") {
    return fetch(input, { ...init, credentials: "include" });
  }

  const headers = new Headers(init?.headers);
  const cookie = authClient.getCookie();
  if (cookie) headers.set("cookie", cookie);
  return fetch(input, { ...init, headers, credentials: "include" });
}

export const { useUploadThing } = generateReactNativeHelpers({
  url: `${API_URL}/api/uploadthing`,
  fetch: uploadThingFetch,
});

import Constants from "expo-constants";
import { Platform } from "react-native";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not defined. Copy .env.example to .env and set it.",
  );
}

const appRole = process.env.EXPO_PUBLIC_APP_ROLE;

if (!appRole) {
  throw new Error(
    "EXPO_PUBLIC_APP_ROLE is not defined. Copy .env.example to .env and set it.",
  );
}

function isLoopback(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

function hostnameFromUri(value: string | undefined) {
  if (!value) return null;

  const withoutProtocol = value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  const host = withoutProtocol.split("/")[0]?.split(":")[0]?.replace(/^\[|\]$/g, "");
  return host || null;
}

function bundlerHostname() {
  const goConfig = Constants.expoGoConfig as { debuggerHost?: string } | null;
  const candidates = [
    Constants.expoConfig?.hostUri,
    goConfig?.debuggerHost,
    Constants.linkingUri,
  ];

  for (const candidate of candidates) {
    const host = hostnameFromUri(candidate);
    if (host && !isLoopback(host)) return host;
  }

  return null;
}

function resolveApiUrl(raw: string) {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return raw.replace(/\/$/, "");
  }

  if (Platform.OS === "web" || !isLoopback(parsed.hostname)) {
    return raw.replace(/\/$/, "");
  }

  const lanHost = bundlerHostname();
  if (lanHost) {
    parsed.hostname = lanHost;
    return parsed.toString().replace(/\/$/, "");
  }

  if (Platform.OS === "android") {
    parsed.hostname = "10.0.2.2";
    return parsed.toString().replace(/\/$/, "");
  }

  return raw.replace(/\/$/, "");
}

export const API_URL = resolveApiUrl(apiUrl);
export const APP_ROLE = appRole;
export const APP_SCHEME = "acquadriver";

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

export const API_URL = apiUrl;
export const APP_ROLE = appRole;
export const APP_SCHEME = "z0app";

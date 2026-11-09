import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { adminClient, emailOTPClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";
import { API_URL, APP_SCHEME } from "@/constants";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: APP_SCHEME,
      storagePrefix: APP_SCHEME,
      storage: SecureStore,
    }),
    adminClient(),
    emailOTPClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;

import type { Hono } from "hono";
import { hc } from "hono/client";
import { API_URL } from "@/constants";

/**
 * Hono RPC client for the backend API.
 *
 * To enable end-to-end type safety, replace `Hono` with the backend's AppType:
 *
 * 1. In the backend repo, `AppType` is exported from `src/app.ts`
 * 2. Copy the type definition or use a shared types package
 * 3. Replace the generic `Hono` type parameter below with the imported AppType
 *
 * Example:
 *   import type { AppType } from "z0-native-app-be/src/app";
 *   export const api = hc<AppType>(API_URL);
 */
export const api = hc<Hono>(API_URL, {
  init: {
    credentials: "include",
  },
});

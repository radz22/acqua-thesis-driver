import { useSession as useBetterAuthSession } from "@/lib/auth-client";

export function useAppSession() {
  const { data, isPending, error } = useBetterAuthSession();

  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    role: (data?.user?.role as string) ?? null,
    isLoading: isPending,
    isAuthenticated: !!data?.session,
    error,
  };
}

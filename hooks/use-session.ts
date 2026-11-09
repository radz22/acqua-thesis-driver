import { useSession as useBetterAuthSession } from "@/lib/auth-client";

export function useAppSession() {
  const { data, isPending, error } = useBetterAuthSession();
  const emailVerified = data?.user?.emailVerified === true;

  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    role: (data?.user?.role as string | undefined) ?? null,
    emailVerified,
    isLoading: isPending,
    isAuthenticated: !!data?.session,
    error,
  };
}

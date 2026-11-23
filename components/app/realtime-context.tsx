import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Socket } from "socket.io-client";
import { useAppSession } from "@/hooks/use-session";
import { connectAppSocket } from "@/lib/realtime";

type RealtimeValue = {
  socket: Socket | null;
};

const RealtimeContext = createContext<RealtimeValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAppSession();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const next = connectAppSocket();
    setSocket(next);
    return () => {
      next.removeAllListeners();
      next.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated]);

  const value = useMemo(() => ({ socket }), [socket]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const value = useContext(RealtimeContext);
  if (!value) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }
  return value;
}

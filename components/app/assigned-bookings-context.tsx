import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { addNetworkStateListener } from "expo-network";
import { listDriverBookings, type Booking } from "@/lib/bookings";
import { useRealtime } from "@/components/app/realtime-context";
import { useAppSession } from "@/hooks/use-session";

type LoadStatus = "loading" | "ready" | "error";

type AssignedBookingsValue = {
  bookings: Booking[];
  status: LoadStatus;
  reload: () => Promise<void>;
  applyBooking: (booking: Booking) => void;
};

const AssignedBookingsContext = createContext<AssignedBookingsValue | null>(null);

function upsertBooking(list: Booking[], incoming: Booking) {
  const next = new Map(list.map((booking) => [booking.id, booking]));
  next.set(incoming.id, incoming);
  return [...next.values()].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export function AssignedBookingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAppSession();
  const { socket } = useRealtime();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const collected: Booking[] = [];
      let page = 1;
      while (page <= 20) {
        const result = await listDriverBookings({ page, limit: 50 });
        collected.push(...result.bookings);
        if (!result.pagination.hasNextPage) break;
        page += 1;
      }
      if (id !== requestId.current) return;
      setBookings(collected);
      setStatus("ready");
    } catch {
      if (id !== requestId.current) return;
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setStatus("loading");
    void reload();
  }, [isAuthenticated, reload]);

  useEffect(() => {
    if (!isAuthenticated || !socket) return;

    const onAssigned = (booking: Booking) => {
      setBookings((current) => upsertBooking(current, booking));
      setStatus("ready");
    };
    const onUpdated = (booking: Booking) => {
      setBookings((current) => upsertBooking(current, booking));
    };
    const onUnassigned = (payload: { id: string }) => {
      setBookings((current) => current.filter((booking) => booking.id !== payload.id));
    };
    const onConnect = () => {
      void reload();
    };

    socket.on("booking.assigned", onAssigned);
    socket.on("booking.updated", onUpdated);
    socket.on("booking.unassigned", onUnassigned);
    socket.on("connect", onConnect);

    return () => {
      socket.off("booking.assigned", onAssigned);
      socket.off("booking.updated", onUpdated);
      socket.off("booking.unassigned", onUnassigned);
      socket.off("connect", onConnect);
    };
  }, [isAuthenticated, reload, socket]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let wasConnected = true;
    const subscription = addNetworkStateListener((state) => {
      const connected = state.isConnected !== false;
      if (connected && !wasConnected) {
        void reload();
      }
      wasConnected = connected;
    });
    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, reload]);

  const applyBooking = useCallback((booking: Booking) => {
    setBookings((current) => upsertBooking(current, booking));
  }, []);

  const value = useMemo(
    () => ({ bookings, status, reload, applyBooking }),
    [bookings, status, reload, applyBooking],
  );

  return (
    <AssignedBookingsContext.Provider value={value}>{children}</AssignedBookingsContext.Provider>
  );
}

export function useAssignedBookings() {
  const value = useContext(AssignedBookingsContext);
  if (!value) {
    throw new Error("useAssignedBookings must be used within AssignedBookingsProvider");
  }
  return value;
}

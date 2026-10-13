"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiService } from "../services/apiService";
import type { User, Resource, Reservation } from "../types";
interface Store {
  user: User | null;
  users: User[];
  resources: Resource[];
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  toast: string | null;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
}
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<{
    user: User | null;
    users: User[];
    resources: Resource[];
    reservations: Reservation[];
  }>({ user: null, users: [], resources: [], reservations: [] });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [toast, setToast] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      setData(await apiService.getSnapshot());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    return apiService.subscribe(() => {
      void refresh();
    });
  }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <Context.Provider
      value={{ ...data, loading, error, toast, refresh, notify: setToast }}
    >
      {error ? (
        <main className="mx-auto max-w-lg p-8" role="alert">
          <h1 className="text-section font-semibold">Unable to load data</h1>
          <p className="my-4">{error}</p>
          <button
            onClick={() => void refresh()}
            className="rounded-lg bg-brand-700 px-4 py-2 text-white"
          >
            Retry
          </button>
        </main>
      ) : (
        children
      )}
      {toast && (
        <div
          className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-body text-success-700 shadow-lg"
          role="status"
        >
          {toast}
        </div>
      )}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("StoreProvider is missing");
  return value;
}

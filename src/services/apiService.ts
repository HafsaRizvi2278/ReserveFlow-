import type {
  Reservation,
  ReservationInput,
  ResourceInput,
  Resource,
  User,
} from "../types";
interface Snapshot {
  user: User | null;
  users: User[];
  resources: Resource[];
  reservations: Reservation[];
}
const listeners = new Set<() => void>();
export class ConflictError extends Error {
  constructor(public conflict: Reservation) {
    super("This resource is already reserved for part of that time.");
  }
}
async function request<T = { id?: string; success?: boolean }>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) {
    if (result.conflict) throw new ConflictError(result.conflict);
    throw new Error(result.error ?? "Request failed. Please retry.");
  }
  if (method !== "GET") listeners.forEach((listener) => listener());
  return result as T;
}
export const apiService = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => request<Snapshot>("snapshot"),
  signIn: (email: string, password: string) =>
    request("auth/login", "POST", { email, password }),
  signOut: () => request("auth/logout", "POST"),
  createReservation: (input: ReservationInput, _userId: string) =>
    request("reservations", "POST", input),
  updateReservation: (id: string, input: ReservationInput) =>
    request(`reservations/${id}`, "PATCH", input),
  cancelReservation: (id: string) =>
    request(`reservations/${id}/cancel`, "POST", {}),
  createResource: (input: ResourceInput) => request("resources", "POST", input),
  updateResource: (id: string, input: ResourceInput) =>
    request(`resources/${id}`, "PATCH", input),
  setResourceActive: (id: string, isActive: boolean) =>
    request(`resources/${id}/status`, "PATCH", { isActive }),
};

export type Role = "admin" | "employee";
export type ResourceCategory = "Meeting Room" | "Workspace" | "Equipment";
export type ReservationStatus = "confirmed" | "cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  location: string;
  capacity: number;
  amenities: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  resourceId: string;
  userId: string;
  title: string;
  notes: string;
  startsAt: string;
  endsAt: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

export type ReservationInput = Pick<
  Reservation,
  "resourceId" | "title" | "notes" | "startsAt" | "endsAt"
>;
export type ResourceInput = Pick<
  Resource,
  | "name"
  | "category"
  | "description"
  | "location"
  | "capacity"
  | "amenities"
  | "isActive"
>;

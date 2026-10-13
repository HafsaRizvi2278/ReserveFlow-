"use client";
import { Link } from "../lib/navigation";
import type { Resource } from "../types";
import { Button, Card, StatusBadge } from "./ui";

const icons = { "Meeting Room": "▣", Workspace: "◇", Equipment: "◫" };

export default function ResourceCard({
  resource,
  availability,
  availableNow,
  onReserve,
  view = "grid",
}: {
  resource: Resource;
  availability?: boolean | null;
  availableNow: boolean;
  onReserve: () => void;
  view?: "grid" | "list";
}) {
  return (
    <Card
      className={`group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md ${view === "list" ? "sm:flex sm:items-center" : ""}`}
    >
      <div
        className={`flex items-center justify-between bg-slate-50 p-5 ${view === "list" ? "sm:w-56 sm:self-stretch" : ""}`}
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-xl text-brand-800"
          aria-hidden="true"
        >
          {icons[resource.category]}
        </span>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge tone={resource.isActive ? "success" : "neutral"}>
            {resource.isActive ? "Active" : "Inactive"}
          </StatusBadge>
          {resource.isActive && (
            <StatusBadge tone={availableNow ? "success" : "info"}>
              {availableNow ? "Available now" : "In use now"}
            </StatusBadge>
          )}
        </div>
      </div>
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-helper font-medium text-brand-800">
              {resource.category}
            </div>
            <h3 className="mt-1 text-card-title font-semibold text-slate-900">
              {resource.name}
            </h3>
          </div>
          {availability !== undefined && availability !== null && (
            <StatusBadge tone={availability ? "success" : "danger"}>
              {availability
                ? "Available for selected time"
                : "Unavailable for selected time"}
            </StatusBadge>
          )}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {resource.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-body text-slate-600">
          <span>
            <span aria-hidden="true">⌖ </span>
            {resource.location}
          </span>
          <span>
            <span aria-hidden="true">♙ </span>
            {resource.capacity}{" "}
            {resource.category === "Equipment" ? "unit" : "people"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {resource.amenities.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
            >
              {item}
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
          <Link
            to={`/resources/${resource.id}`}
            className="inline-flex min-h-10 items-center rounded-lg text-button font-semibold text-brand-800 hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
          >
            View details →
          </Link>
          <Button
            className="ml-auto"
            onClick={onReserve}
            disabled={!resource.isActive}
          >
            Reserve
          </Button>
        </div>
      </div>
    </Card>
  );
}

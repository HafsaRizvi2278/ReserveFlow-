"use client";
import { formatDate, formatRange } from "../lib/date";
import type { Reservation, Resource, User } from "../types";
import { Button, EmptyState, StatusBadge } from "./ui";

interface ReservationListProps {
  reservations: Reservation[];
  resources: Resource[];
  users: User[];
  admin?: boolean;
  onEdit?: (item: Reservation) => void;
  onCancel?: (item: Reservation) => void;
  onDetails: (item: Reservation) => void;
}

function reservationState(item: Reservation) {
  if (item.status === "cancelled")
    return { label: "Cancelled", tone: "neutral" as const };
  if (new Date(item.endsAt) < new Date())
    return { label: "Past", tone: "neutral" as const };
  if (new Date(item.startsAt) <= new Date())
    return { label: "In progress", tone: "info" as const };
  return { label: "Confirmed", tone: "success" as const };
}

export default function ReservationList({
  reservations,
  resources,
  users,
  admin = false,
  onEdit,
  onCancel,
  onDetails,
}: ReservationListProps) {
  if (!reservations.length)
    return (
      <EmptyState
        title="No reservations found"
        description="There are no reservations matching this view."
      />
    );

  const actions = (item: Reservation) => {
    const editable =
      item.status === "confirmed" && new Date(item.startsAt) > new Date();
    return (
      <div className="flex flex-wrap justify-start gap-1 md:justify-end">
        <Button
          variant="ghost"
          className="min-h-9 px-2.5"
          onClick={() => onDetails(item)}
          aria-label={`View details for ${item.title}`}
        >
          Details
        </Button>
        {onEdit && editable && (
          <Button
            variant="ghost"
            className="min-h-9 px-2.5"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.title}`}
          >
            Edit
          </Button>
        )}
        {onCancel && editable && (
          <Button
            variant="ghost"
            className="min-h-9 px-2.5 text-danger-700 hover:bg-danger-50 hover:text-danger-700"
            onClick={() => onCancel(item)}
            aria-label={`Cancel ${item.title}`}
          >
            Cancel
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="divide-y divide-slate-200 md:hidden">
        {reservations.map((item) => {
          const resource = resources.find(
            (entry) => entry.id === item.resourceId,
          );
          const owner = users.find((entry) => entry.id === item.userId);
          const state = reservationState(item);
          return (
            <article key={item.id} className="space-y-3 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-card-title font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  {admin && (
                    <p className="mt-1 text-helper text-slate-500">
                      {owner?.name}
                    </p>
                  )}
                </div>
                <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
              </div>
              <div>
                <p className="text-body font-medium text-slate-700">
                  {resource?.name}
                </p>
                <p className="mt-1 text-helper text-slate-500">
                  {resource?.location}
                </p>
              </div>
              <div className="text-body text-slate-600 tabular-nums">
                <span>{formatDate(item.startsAt)}</span>
                <span aria-hidden="true"> · </span>
                <span>{formatRange(item.startsAt, item.endsAt)}</span>
              </div>
              {actions(item)}
            </article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] table-fixed text-left text-body">
          <caption className="sr-only">
            {admin ? "Organization-wide reservations" : "Your reservations"}
          </caption>
          <thead className="border-b border-slate-200 bg-slate-100 text-table-header font-semibold text-slate-600">
            <tr>
              <th scope="col" className="w-[26%] px-5 py-3">
                {admin ? "Employee / title" : "Reservation"}
              </th>
              <th scope="col" className="w-[22%] px-5 py-3">
                Resource
              </th>
              <th scope="col" className="w-[23%] px-5 py-3">
                Date and time
              </th>
              <th scope="col" className="w-[14%] px-5 py-3">
                Status
              </th>
              <th scope="col" className="w-[15%] px-5 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {reservations.map((item) => {
              const resource = resources.find(
                (entry) => entry.id === item.resourceId,
              );
              const owner = users.find((entry) => entry.id === item.userId);
              const state = reservationState(item);
              return (
                <tr
                  key={item.id}
                  className="align-middle transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">
                      {item.title}
                    </div>
                    {admin && (
                      <div className="mt-1 text-helper text-slate-500">
                        {owner?.name}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-700">
                      {resource?.name}
                    </div>
                    <div className="mt-1 text-helper text-slate-500">
                      {resource?.location}
                    </div>
                  </td>
                  <td className="px-5 py-4 tabular-nums">
                    <div className="font-medium text-slate-700">
                      {formatDate(item.startsAt)}
                    </div>
                    <div className="mt-1 text-helper text-slate-500">
                      {formatRange(item.startsAt, item.endsAt)}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
                  </td>
                  <td className="px-5 py-4">{actions(item)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

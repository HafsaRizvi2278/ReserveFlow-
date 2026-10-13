"use client";
import { Link } from "../lib/navigation";
import { useStore } from "../app/store";
import { formatDate, formatRange, isToday } from "../lib/date";
import {
  ButtonLink,
  Card,
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatusBadge,
} from "../components/ui";

function Metric({
  label,
  value,
  note,
  symbol,
}: {
  label: string;
  value: number;
  note: string;
  symbol: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-body font-normal text-slate-600">{label}</p>
          <p className="mt-2 text-metric font-semibold tracking-heading text-slate-900 tabular-nums">
            {value}
          </p>
        </div>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg text-brand-800"
          aria-hidden="true"
        >
          {symbol}
        </span>
      </div>
      <p className="mt-3 text-helper text-slate-500">{note}</p>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, resources, reservations, users, loading } = useStore();
  if (loading) return <LoadingSkeleton rows={5} />;
  const now = new Date();
  const upcomingAll = reservations
    .filter(
      (item) => item.status === "confirmed" && new Date(item.endsAt) > now,
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const myUpcoming = upcomingAll.filter((item) => item.userId === user?.id);
  const today = reservations
    .filter((item) => item.status === "confirmed" && isToday(item.startsAt))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const active = resources.filter((item) => item.isActive).length;
  const isAdmin = user?.role === "admin";
  const cards = isAdmin
    ? [
        {
          label: "Active resources",
          value: active,
          note: "Ready to reserve",
          symbol: "◇",
        },
        {
          label: "Today’s confirmed",
          value: today.length,
          note: "Across the organization",
          symbol: "▣",
        },
        {
          label: "Upcoming",
          value: upcomingAll.length,
          note: "Confirmed reservations",
          symbol: "↗",
        },
        {
          label: "Inactive resources",
          value: resources.length - active,
          note: "Unavailable for new bookings",
          symbol: "○",
        },
      ]
    : [
        {
          label: "Active resources",
          value: active,
          note: "Available to discover",
          symbol: "◇",
        },
        {
          label: "My upcoming",
          value: myUpcoming.length,
          note: "Confirmed reservations",
          symbol: "▣",
        },
        {
          label: "My reservations today",
          value: today.filter((item) => item.userId === user?.id).length,
          note: "In Sri Lanka time",
          symbol: "◷",
        },
      ];
  const schedule = isAdmin ? today : myUpcoming.slice(0, 4);
  return (
    <>
      <PageHeader
        title={`Good ${Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", hour: "2-digit", hour12: false }).format(now)) < 12 ? "morning" : "afternoon"}, ${user?.name.split(" ")[0]}`}
        description={
          isAdmin
            ? "Here’s what is happening across your organization today."
            : "Here’s your reservation overview in Sri Lanka time."
        }
        action={<ButtonLink to="/resources">Find a resource</ButtonLink>}
      />
      <div
        className={`grid gap-4 ${isAdmin ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3"}`}
      >
        {cards.map((card) => (
          <Metric key={card.label} {...card} />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <Card>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-card-title font-semibold text-slate-900">
                {isAdmin
                  ? "Today’s organization schedule"
                  : "Upcoming reservations"}
              </h2>
              <p className="mt-0.5 text-helper text-slate-500">
                {schedule.length} confirmed{" "}
                {schedule.length === 1 ? "booking" : "bookings"}
              </p>
            </div>
            <Link
              to={isAdmin ? "/admin/reservations" : "/reservations"}
              className="rounded text-button font-semibold text-brand-800 hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
            >
              View all
            </Link>
          </div>
          {schedule.length ? (
            <div className="divide-y divide-slate-100">
              {schedule.map((item) => {
                const resource = resources.find(
                  (entry) => entry.id === item.resourceId,
                );
                const owner = users.find((entry) => entry.id === item.userId);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800"
                      aria-hidden="true"
                    >
                      ▣
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900">
                        {item.title}
                      </div>
                      <div className="mt-1 text-body text-slate-500">
                        {resource?.name} · {resource?.location}
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <div className="text-body font-medium text-slate-800 tabular-nums">
                        {formatDate(item.startsAt)}
                      </div>
                      <div className="mt-1 text-helper text-slate-500 tabular-nums">
                        {formatRange(item.startsAt, item.endsAt)}
                        {isAdmin && owner ? ` · ${owner.name}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Nothing scheduled"
              description="Your schedule is clear. Find an active resource when you need one."
              action={
                <ButtonLink to="/resources" variant="secondary">
                  Browse resources
                </ButtonLink>
              }
            />
          )}
        </Card>
        <Card className="p-5">
          <h2 className="text-card-title font-semibold text-slate-900">
            {isAdmin ? "Resource summary" : "Today at a glance"}
          </h2>
          <div className="mt-5 space-y-4">
            {["Meeting Room", "Workspace", "Equipment"].map((category) => {
              const count = resources.filter(
                (item) => item.category === category && item.isActive,
              ).length;
              return (
                <div key={category} className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-800"
                    aria-hidden="true"
                  >
                    ◇
                  </span>
                  <span className="flex-1 text-body font-medium text-slate-700">
                    {category}s
                  </span>
                  <StatusBadge tone="neutral">{count} active</StatusBadge>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-xl bg-brand-900 p-5 text-white">
            <div className="text-card-title font-semibold">
              {isAdmin ? "Keep resources current" : "Need a quiet place?"}
            </div>
            <p className="mt-2 text-helper text-brand-100">
              {isAdmin
                ? "Add a new resource or update operational status from the management area."
                : "Use filters to find a workspace that fits your next task."}
            </p>
            <Link
              to={isAdmin ? "/admin/resources" : "/resources"}
              className="mt-4 inline-block rounded text-button font-semibold text-white underline decoration-brand-200 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900"
            >
              {isAdmin ? "Manage resources" : "Explore resources"} →
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}

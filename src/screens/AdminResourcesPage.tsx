"use client";
import { useMemo, useState } from "react";
import { useStore } from "../app/store";
import { apiService } from "../services/apiService";
import type { Resource } from "../types";
import ResourceForm from "../components/ResourceForm";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingSkeleton,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
} from "../components/ui";

export default function AdminResourcesPage() {
  const { resources, reservations, loading, notify } = useStore();
  const [search, setSearch] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState<Resource | "new" | null>(null);
  const [toggling, setToggling] = useState<Resource | null>(null);
  const filtered = useMemo(
    () =>
      resources.filter(
        (item) =>
          (!search ||
            `${item.name} ${item.location}`
              .toLowerCase()
              .includes(search.toLowerCase())) &&
          (category === "all" || item.category === category) &&
          (status === "all" ||
            (status === "active" ? item.isActive : !item.isActive)),
      ),
    [resources, search, category, status],
  );
  if (loading) return <LoadingSkeleton rows={5} />;
  const futureCount = toggling
    ? reservations.filter(
        (item) =>
          item.resourceId === toggling.id &&
          item.status === "confirmed" &&
          new Date(item.startsAt) > new Date(),
      ).length
    : 0;
  const toggle = async () => {
    if (!toggling || busy) return;
    setBusy(true);
    setFailure("");
    try {
      await apiService.setResourceActive(toggling.id, !toggling.isActive);
      notify(
        toggling.isActive ? "Resource deactivated." : "Resource activated.",
      );
      setToggling(null);
    } catch (e) {
      setFailure(
        e instanceof Error ? e.message : "Unable to save. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        title="Manage resources"
        description="Maintain the resources employees can discover and reserve."
        action={<Button onClick={() => setForm("new")}>Add resource</Button>}
      />
      <Card>
        <div className="grid gap-4 border-b border-slate-200 p-4 sm:grid-cols-3">
          <Field label="Search">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or location…"
            />
          </Field>
          <Field label="Category">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              <option>Meeting Room</option>
              <option>Workspace</option>
              <option>Equipment</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </div>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-body">
              <caption className="sr-only">
                Resources available to the organization
              </caption>
              <thead className="bg-slate-100 text-table-header font-semibold text-slate-600">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Resource
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Category
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Location
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Capacity
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="align-middle transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {item.category}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {item.location}
                    </td>
                    <td className="px-5 py-4 text-slate-600 tabular-nums">
                      {item.capacity}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={item.isActive ? "success" : "neutral"}>
                        {item.isActive ? "Active" : "Inactive"}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        className="min-h-9 px-3"
                        onClick={() => setForm(item)}
                        aria-label={`Edit ${item.name}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className={`min-h-9 px-3 ${item.isActive ? "text-danger-700 hover:bg-danger-50 hover:text-danger-700" : "text-success-700 hover:bg-success-50 hover:text-success-700"}`}
                        onClick={() => setToggling(item)}
                        aria-label={`${item.isActive ? "Deactivate" : "Activate"} ${item.name}`}
                      >
                        {item.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No matching resources"
            description="Adjust your search or filters."
          />
        )}
      </Card>
      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form === "new" ? "Add resource" : "Edit resource"}
        description="Resource details are visible throughout ReserveFlow."
        size="lg"
      >
        {form && (
          <ResourceForm
            resource={form === "new" ? undefined : form}
            onDone={() => setForm(null)}
            onCancel={() => setForm(null)}
          />
        )}
      </Modal>
      <Modal
        open={Boolean(toggling)}
        onClose={() => setToggling(null)}
        title={`${toggling?.isActive ? "Deactivate" : "Activate"} ${toggling?.name}?`}
        description={
          toggling?.isActive
            ? "Deactivation prevents new reservations but preserves booking history."
            : "Employees will be able to reserve this resource again."
        }
        size="sm"
      >
        {failure && (
          <p role="alert" className="mb-4 text-danger-700">
            {failure}
          </p>
        )}
        {toggling?.isActive && futureCount > 0 && (
          <div className="mb-5 rounded-lg border border-warning-200 bg-warning-50 p-4 text-body text-warning-800">
            <strong>
              {futureCount} future{" "}
              {futureCount === 1 ? "reservation" : "reservations"}
            </strong>{" "}
            will remain confirmed after deactivation.
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setToggling(null)}>
            Go back
          </Button>
          <Button
            variant={toggling?.isActive ? "danger" : "primary"}
            disabled={busy}
            onClick={toggle}
          >
            {toggling?.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

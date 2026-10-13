"use client";
import { useState, type FormEvent } from "react";
import type { Resource, ResourceCategory } from "../types";
import { apiService } from "../services/apiService";
import { useStore } from "../app/store";
import { Button, Field, Input, Select, Textarea } from "./ui";

export default function ResourceForm({
  resource,
  onDone,
  onCancel,
}: {
  resource?: Resource;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { notify, reservations } = useStore();
  const [values, setValues] = useState({
    name: resource?.name ?? "",
    category: resource?.category ?? ("Meeting Room" as ResourceCategory),
    description: resource?.description ?? "",
    location: resource?.location ?? "",
    capacity: String(resource?.capacity ?? 1),
    amenities: resource?.amenities.join(", ") ?? "",
    isActive: resource?.isActive ?? true,
  });
  const futureCount = resource
    ? reservations.filter(
        (item) =>
          item.resourceId === resource.id &&
          item.status === "confirmed" &&
          new Date(item.startsAt) > new Date(),
      ).length
    : 0;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState("");
  const set = (key: string, value: string | boolean) =>
    setValues((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Enter a resource name.";
    if (!values.description.trim())
      next.description = "Enter a short description.";
    if (!values.location.trim()) next.location = "Enter a location.";
    if (
      !Number.isInteger(Number(values.capacity)) ||
      Number(values.capacity) < 1
    )
      next.capacity = "Capacity must be a positive whole number.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setSaving(true);
    setFailure("");
    try {
      const input = {
        ...values,
        name: values.name.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        capacity: Number(values.capacity),
        amenities: values.amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
      if (resource) await apiService.updateResource(resource.id, input);
      else await apiService.createResource(input);
      notify(resource ? "Resource updated." : "Resource added.");
      onDone();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Unable to save resource.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {failure && (
        <p role="alert" className="text-danger-700">
          {failure}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Resource name" error={errors.name}>
          <Input
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Category">
          <Select
            value={values.category}
            onChange={(e) =>
              set("category", e.target.value as ResourceCategory)
            }
          >
            <option>Meeting Room</option>
            <option>Workspace</option>
            <option>Equipment</option>
          </Select>
        </Field>
      </div>
      <Field label="Description" error={errors.description}>
        <Textarea
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location" error={errors.location}>
          <Input
            value={values.location}
            onChange={(e) => set("location", e.target.value)}
          />
        </Field>
        <Field label="Capacity" error={errors.capacity}>
          <Input
            type="number"
            min="1"
            step="1"
            value={values.capacity}
            onChange={(e) => set("capacity", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Amenities" hint="Separate amenities with commas.">
        <Input
          value={values.amenities}
          onChange={(e) => set("amenities", e.target.value)}
          placeholder="Display, Whiteboard, Video call"
        />
      </Field>
      {resource?.isActive && !values.isActive && futureCount > 0 && (
        <p className="rounded-lg border border-warning-200 bg-warning-50 p-3 text-warning-800">
          {futureCount} future reservations will remain confirmed after
          deactivation.
        </p>
      )}
      <label className="flex items-center gap-3 rounded-lg border border-slate-300 p-3 text-label font-medium text-slate-700">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="h-4 w-4 rounded border-slate-500 text-brand-700 focus:ring-brand-700 focus:ring-offset-2"
        />
        Active and available for new reservations
      </label>
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : resource ? "Save changes" : "Add resource"}
        </Button>
      </div>
    </form>
  );
}

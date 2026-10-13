"use client";
import { ButtonLink, Card } from "../components/ui";

export default function AccessDeniedPage() {
  return (
    <Card className="mx-auto max-w-xl p-8 text-center">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-danger-200 bg-danger-50 text-2xl text-danger-700"
        aria-hidden="true"
      >
        !
      </div>
      <h1 className="mt-5 text-page-title-mobile font-semibold tracking-heading text-slate-900">
        Admin access required
      </h1>
      <p className="mt-2 text-body text-slate-500">
        Only administrators can access this page. Sign in with an authorized
        Admin account.
      </p>
      <ButtonLink to="/dashboard" className="mt-6">
        Return to overview
      </ButtonLink>
    </Card>
  );
}

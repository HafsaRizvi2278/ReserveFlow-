"use client";
import { useState, type FormEvent } from "react";
import { apiService } from "../services/apiService";
import { Button, Field, Input } from "../components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail) {
      setError("Enter your email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiService.signIn(targetEmail, password);
      window.location.assign("/dashboard");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-brand-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-lg font-semibold">
            R
          </span>
          <span className="text-card-title font-semibold">ReserveFlow</span>
        </div>
        <div className="max-w-xl">
          <div className="mb-8 inline-flex rounded-full border border-brand-700 bg-brand-900 px-3 py-1 text-body text-brand-100">
            Resource coordination, made clear
          </div>
          <h1 className="text-5xl font-semibold leading-tight tracking-heading">
            The right space,
            <br />
            right when you need it.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
            Discover rooms and equipment, see occupied slots at a glance, and
            reserve with confidence.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm text-slate-400">
          <span>
            <strong className="block text-xl text-white">6</strong>Shared
            resources
          </span>
          <span>
            <strong className="block text-xl text-white">Instant</strong>
            Confirmation
          </span>
          <span>
            <strong className="block text-xl text-white">One</strong>Source of
            truth
          </span>
        </div>
      </section>
      <section className="flex items-center justify-center bg-slate-50 px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 font-semibold text-white">
              R
            </span>
            <span className="text-card-title font-semibold text-slate-900">
              ReserveFlow
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <div className="text-helper font-semibold text-brand-800">
                Welcome back
              </div>
              <h2 className="mt-2 text-page-title-mobile font-semibold tracking-heading text-slate-900">
                Sign in to your workspace
              </h2>
              <p className="mt-2 text-body text-slate-500">
                Enter your credentials to access ReserveFlow.
              </p>
            </div>
            {error && (
              <div
                className="mb-5 rounded-lg border border-danger-200 bg-danger-50 p-3 text-body font-medium text-danger-700"
                role="alert"
              >
                <span className="mr-2" aria-hidden="true">
                  !
                </span>
                {error}
              </div>
            )}
            <form onSubmit={(event) => signIn(event)} className="space-y-4">
              <Field label="Email address">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </Field>
              <Field label="Password">
                <div className="relative">
                  <Input
                    type={visible ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    className="absolute inset-y-1 right-1 rounded-md px-3 text-helper font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
                    aria-pressed={visible}
                    aria-label={visible ? "Hide password" : "Show password"}
                  >
                    {visible ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <p className="mt-5 text-center text-helper text-slate-500">
              Authorized access only
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-section font-semibold">Unable to load ReserveFlow</h1>
      <p className="my-4">
        Check that PostgreSQL is running and the database migrations have been
        applied.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-brand-700 px-4 py-2 text-white"
      >
        Try again
      </button>
    </main>
  );
}

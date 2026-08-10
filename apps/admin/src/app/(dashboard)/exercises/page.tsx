import type { Exercise, Paginated } from "@fitness/types";
import type { Metadata } from "next";

import { apiFetch } from "@/lib/api";

export const metadata: Metadata = { title: "Exercises — Fitness Admin" };

function buildQuery(page: number, search?: string): string {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (search) params.set("search", search);
  return params.toString();
}

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page: pageParam, search } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { items: exercises, meta } = await apiFetch<Paginated<Exercise>>(
    `/exercises?${buildQuery(page, search)}`,
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Exercises</h1>
          <p className="text-sm text-neutral-500">{meta.total} total in the catalogue</p>
        </div>
        <form method="get" className="flex gap-2">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search by name"
            className="w-64 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Search
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Equipment</th>
              <th className="px-4 py-3">Primary muscles</th>
              <th className="px-4 py-3">Source</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((exercise) => (
              <tr key={exercise.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium text-neutral-900">{exercise.name}</td>
                <td className="px-4 py-3 text-neutral-600 capitalize">{exercise.category}</td>
                <td className="px-4 py-3 text-neutral-600 capitalize">{exercise.equipment}</td>
                <td className="px-4 py-3 text-neutral-600 capitalize">
                  {exercise.primaryMuscles.join(", ")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      exercise.isCustom
                        ? "bg-neutral-100 text-neutral-600"
                        : "bg-neutral-900 text-white"
                    }`}
                  >
                    {exercise.isCustom ? "Custom" : "Catalogue"}
                  </span>
                </td>
              </tr>
            ))}
            {exercises.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  No exercises found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
          <span>
            Page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex gap-2">
            {meta.hasPreviousPage ? (
              <a
                href={`?${buildQuery(page - 1, search)}`}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
              >
                Previous
              </a>
            ) : null}
            {meta.hasNextPage ? (
              <a
                href={`?${buildQuery(page + 1, search)}`}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
              >
                Next
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

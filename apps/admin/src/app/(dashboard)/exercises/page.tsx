import type { Exercise, Paginated } from "@fitness/types";
import type { Metadata } from "next";

import { ExerciseManagementClient } from "@/components/exercise-management-client";
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
      <ExerciseManagementClient
        exercises={exercises}
        total={meta.total}
        page={meta.page}
        totalPages={meta.totalPages}
        hasPreviousPage={meta.hasPreviousPage}
        hasNextPage={meta.hasNextPage}
        search={search}
      />
    </div>
  );
}

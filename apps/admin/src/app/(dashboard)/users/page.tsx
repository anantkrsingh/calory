import type { AppSettings, Paginated, Plan, User } from "@fitness/types";
import type { Metadata } from "next";

import { UserTableClient } from "@/components/user-table-client";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = { title: "Users — Fitness Admin" };

function buildQuery(page: number, search?: string): string {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (search) params.set("search", search);
  return params.toString();
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page: pageParam, search } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [usersRes, plansRes, settingsRes] = await Promise.all([
    apiFetch<Paginated<User>>(`/users?${buildQuery(page, search)}`),
    apiFetch<Plan[]>("/plans").catch(() => []),
    apiFetch<AppSettings>("/settings").catch(() => null),
  ]);

  const { items: users, meta } = usersRes;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Users</h1>
          <p className="text-sm text-neutral-500">{meta.total} total accounts</p>
        </div>
        <form method="get" className="flex gap-2">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search by email or name"
            className="w-64 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 bg-white"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition"
          >
            Search
          </button>
        </form>
      </div>

      <UserTableClient
        users={users}
        meta={meta}
        plans={plansRes}
        settings={settingsRes}
        page={page}
        search={search}
      />
    </div>
  );
}


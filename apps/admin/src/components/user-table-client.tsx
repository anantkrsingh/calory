"use client";

import type { AppSettings, Paginated, Plan, User } from "@fitness/types";
import { Edit3, Sparkles } from "lucide-react";
import { useState } from "react";

import { EditUserModal } from "./edit-user-modal";

interface UserTableClientProps {
  users: User[];
  meta: Paginated<User>["meta"];
  plans: Plan[];
  settings: AppSettings | null;
  page: number;
  search?: string;
}

function buildQueryUrl(page: number, search?: string): string {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (search) params.set("search", search);
  return params.toString();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatTokenCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}

export function UserTableClient({
  users,
  meta,
  plans,
  settings,
  page,
  search,
}: UserTableClientProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const defaultCredits = settings?.freeChatsLimit ?? 5;

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Tokens used</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const remaining = user.remainingCredits ?? defaultCredits;
              const total = user.totalCredits ?? defaultCredits;
              return (
                <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50/60 transition">
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {user.profile.displayName}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.planName ? (
                      <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {user.planName}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">Free</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-0.5 w-fit">
                      <Sparkles size={12} />
                      <span>
                        {remaining} / {total}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600" title={`${user.lifetimeInputTokens ?? 0} in / ${user.lifetimeOutputTokens ?? 0} out`}>
                    {formatTokenCount(user.lifetimeTotalTokens ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500" suppressHydrationWarning>
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 hover:text-neutral-900 transition"
                    >
                      <Edit3 size={12} />
                      Edit User
                    </button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                  No users found.
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
                href={`?${buildQueryUrl(page - 1, search)}`}
                className="cursor-pointer rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
              >
                Previous
              </a>
            ) : null}
            {meta.hasNextPage ? (
              <a
                href={`?${buildQueryUrl(page + 1, search)}`}
                className="cursor-pointer rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
              >
                Next
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <EditUserModal
        key={selectedUser?.id ?? "none"}
        user={selectedUser}
        plans={plans}
        defaultCredits={defaultCredits}
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}

import type { ChatConversation, Paginated, User } from "@fitness/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";

export const metadata: Metadata = { title: "User chats — Fitness Admin" };

function buildQuery(page: number): string {
  return new URLSearchParams({ page: String(page), limit: "20" }).toString();
}

function formatDateTime(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function UserChatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let user: User;
  try {
    user = await apiFetch<User>(`/users/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { items: conversations, meta } = await apiFetch<Paginated<ChatConversation>>(
    `/chats/admin/users/${id}?${buildQuery(page)}`,
  );

  return (
    <div className="p-8">
      <Link
        href="/users"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Back to users
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">
          {user.profile.displayName}’s chats
        </h1>
        <p className="text-sm text-neutral-500">
          {user.email} · {meta.total} conversation{meta.total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Messages</th>
              <th className="px-4 py-3">Last message</th>
              <th className="px-4 py-3">Started</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((conversation) => (
              <tr
                key={conversation.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60 transition"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/users/${id}/chats/${conversation.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {conversation.title ?? "Untitled conversation"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600">{conversation.messageCount}</td>
                <td className="px-4 py-3 text-xs text-neutral-500" suppressHydrationWarning>
                  {formatDateTime(conversation.lastMessageAt)}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500" suppressHydrationWarning>
                  {formatDateTime(conversation.createdAt)}
                </td>
              </tr>
            ))}
            {conversations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  No conversations yet.
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
              <Link
                href={`/users/${id}/chats?${buildQuery(page - 1)}`}
                className="cursor-pointer rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
              >
                Previous
              </Link>
            ) : null}
            {meta.hasNextPage ? (
              <Link
                href={`/users/${id}/chats?${buildQuery(page + 1)}`}
                className="cursor-pointer rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

import type { ChatConversationDetail, ChatMessage, Paginated } from "@fitness/types";
import { ChatMessageRole } from "@fitness/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";

export const metadata: Metadata = { title: "Conversation — Fitness Admin" };

function buildQuery(page: number): string {
  return new URLSearchParams({ page: String(page), limit: "50" }).toString();
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

const ROLE_LABEL: Record<ChatMessage["role"], string> = {
  [ChatMessageRole.User]: "User",
  [ChatMessageRole.Assistant]: "Coach",
  [ChatMessageRole.System]: "System",
};

export default async function ConversationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; conversationId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id, conversationId } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let conversation: ChatConversationDetail;
  let messagesRes: Paginated<ChatMessage>;
  try {
    [conversation, messagesRes] = await Promise.all([
      apiFetch<ChatConversationDetail>(`/chats/admin/users/${id}/conversations/${conversationId}`),
      apiFetch<Paginated<ChatMessage>>(
        `/chats/admin/users/${id}/conversations/${conversationId}/messages?${buildQuery(page)}`,
      ),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { items: messages, meta } = messagesRes;

  return (
    <div className="p-8">
      <Link
        href={`/users/${id}/chats`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Back to conversations
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">
          {conversation.title ?? "Untitled conversation"}
        </h1>
        <p className="text-sm text-neutral-500">
          {meta.total} message{meta.total === 1 ? "" : "s"} · started{" "}
          {formatDateTime(conversation.createdAt)}
        </p>
      </div>

      <div className="space-y-4">
        {messages.map((message) => {
          const isUser = message.role === ChatMessageRole.User;
          return (
            <div
              key={message.id}
              className={`rounded-xl border p-4 ${
                isUser ? "border-neutral-200 bg-neutral-50" : "border-indigo-100 bg-indigo-50/40"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    isUser ? "bg-neutral-200 text-neutral-700" : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {ROLE_LABEL[message.role]}
                </span>
                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  {message.totalTokens ? <span>{message.totalTokens} tokens</span> : null}
                  <span suppressHydrationWarning>{formatDateTime(message.createdAt)}</span>
                </div>
              </div>

              <p className="whitespace-pre-wrap text-sm text-neutral-900">{message.content}</p>

              {message.citations.length > 0 ? (
                <div className="mt-3 space-y-1 border-t border-neutral-200 pt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                    Sources
                  </p>
                  {message.citations.map((citation, index) => (
                    <a
                      key={`${citation.url}-${index}`}
                      href={citation.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-xs text-indigo-600 hover:underline"
                    >
                      {citation.title}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {messages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500">
            No messages on this page.
          </p>
        ) : null}
      </div>

      {meta.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between text-sm text-neutral-600">
          <span>
            Page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex gap-2">
            {meta.hasPreviousPage ? (
              <Link
                href={`/users/${id}/chats/${conversationId}?${buildQuery(page - 1)}`}
                className="cursor-pointer rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
              >
                Previous
              </Link>
            ) : null}
            {meta.hasNextPage ? (
              <Link
                href={`/users/${id}/chats/${conversationId}?${buildQuery(page + 1)}`}
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

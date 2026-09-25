import type { Paginated, SupportTicket, TicketStatus } from "@fitness/types";
import type { Metadata } from "next";
import Link from "next/link";

import { apiFetch } from "@/lib/api";

import { TicketReviewForm } from "./ticket-review-form";

export const metadata: Metadata = { title: "Support Tickets — Fitness Admin" };

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_review: "In review",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_CLASSES: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-blue-700",
  in_review: "bg-amber-50 text-amber-700",
  resolved: "bg-emerald-50 text-emerald-700",
  closed: "bg-neutral-100 text-neutral-600",
};

const EVENT_LABELS = {
  created: "Ticket created",
  comment: "Comment",
  status_change: "Status changed",
  reopened: "Ticket reopened",
} as const;

const FILTERS: Array<{ label: string; value?: TicketStatus }> = [
  { label: "All" },
  { label: "Open", value: "open" },
  { label: "In review", value: "in_review" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

function buildQuery(page: number, status?: string): string {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  return params.toString();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageParam, status } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items: tickets, meta } = await apiFetch<Paginated<SupportTicket>>(
    `/tickets/admin?${buildQuery(page, status)}`,
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Support tickets
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Review user-submitted help requests and update their status.
          </p>
        </div>
        <div className="text-sm text-neutral-500">
          {meta.total} total
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = (filter.value ?? "") === (status ?? "");
          const href = filter.value ? `/tickets?status=${filter.value}` : "/tickets";
          return (
            <Link
              key={filter.label}
              href={href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {tickets.length > 0 ? (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <article
              key={ticket.id}
              className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-neutral-900">
                      {ticket.subject}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[ticket.status]}`}
                    >
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500">
                    {ticket.userDisplayName || "User"} · {ticket.userEmail || ticket.userId}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Created {formatDate(ticket.createdAt)}
                  </p>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                {ticket.message}
              </p>

              {ticket.attachments.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {ticket.attachments.map((attachment, index) => (
                    <a
                      key={attachment.publicId}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
                    >
                      Attachment {index + 1}
                      {attachment.bytes ? ` · ${(attachment.bytes / (1024 * 1024)).toFixed(1)} MB` : ""}
                    </a>
                  ))}
                </div>
              ) : null}

              {ticket.timeline.length > 0 ? (
                <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <h3 className="text-sm font-semibold text-neutral-900">Timeline</h3>
                  <div className="mt-3 grid gap-3">
                    {ticket.timeline.map((event) => (
                      <div key={event.id} className="border-l-2 border-neutral-300 pl-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-neutral-900">
                            {event.type === "status_change" && event.toStatus
                              ? `Status changed to ${STATUS_LABELS[event.toStatus]}`
                              : EVENT_LABELS[event.type]}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {formatDate(event.createdAt)}
                          </p>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {event.actorRole === "admin" ? "Admin" : "User"}
                          {event.actorName ? ` · ${event.actorName}` : ""}
                        </p>
                        {event.message ? (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
                            {event.message}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <TicketReviewForm ticket={ticket} />
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
          No tickets found.
        </div>
      )}

      {meta.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between text-sm">
          <Link
            href={`/tickets?${buildQuery(Math.max(1, page - 1), status)}`}
            className={`rounded-md border border-neutral-200 px-3 py-2 font-medium ${
              meta.hasPreviousPage
                ? "text-neutral-700 hover:bg-neutral-50"
                : "pointer-events-none text-neutral-300"
            }`}
          >
            Previous
          </Link>
          <span className="text-neutral-500">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Link
            href={`/tickets?${buildQuery(page + 1, status)}`}
            className={`rounded-md border border-neutral-200 px-3 py-2 font-medium ${
              meta.hasNextPage
                ? "text-neutral-700 hover:bg-neutral-50"
                : "pointer-events-none text-neutral-300"
            }`}
          >
            Next
          </Link>
        </div>
      ) : null}
    </div>
  );
}

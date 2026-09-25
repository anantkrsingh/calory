"use client";

import type { SupportTicket, TicketStatus } from "@fitness/types";
import { useActionState } from "react";

import { updateTicketAction } from "./actions";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_review", label: "In review" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function TicketReviewForm({ ticket }: { ticket: SupportTicket }) {
  const [state, action, pending] = useActionState(updateTicketAction, {});

  return (
    <form action={action} className="mt-4 grid gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <input type="hidden" name="id" value={ticket.id} />
      <div className="grid gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Status
        </label>
        <select
          name="status"
          defaultValue={ticket.status}
          className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-900"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Admin note
        </label>
        <textarea
          name="adminNote"
          defaultValue={ticket.adminNote ?? ""}
          rows={3}
          className="resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
          placeholder="Add a short note for the user."
        />
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-emerald-700">Ticket updated.</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save review"}
      </button>
    </form>
  );
}

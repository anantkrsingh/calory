"use client";

import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createNotificationAction } from "@/lib/notification-actions";
import { UserPicker } from "./user-picker";

// Kept in sync by hand with `notificationTitle`/`notificationBody` in
// packages/validation/src/constants.ts — that's the enforced limit, this is
// just the UI hint.
const TITLE_MAX = 65;
const BODY_MAX = 240;

interface PickedUser {
  id: string;
  email: string;
  displayName: string;
}

interface NewNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TargetMode = "all" | "users";
type ScheduleMode = "now" | "later";

export function NewNotificationModal({ isOpen, onClose }: NewNotificationModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetMode, setTargetMode] = useState<TargetMode>("all");
  const [recipients, setRecipients] = useState<PickedUser[]>([]);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("now");
  const [scheduledAt, setScheduledAt] = useState("");
  // Lazy initializer: runs once (on mount), not on every render, so reading
  // the clock here doesn't make render itself impure.
  const [minScheduledAt] = useState(() =>
    new Date(Date.now() + 2 * 60_000).toISOString().slice(0, 16),
  );

  if (!isOpen) return null;

  const reset = () => {
    setTitle("");
    setBody("");
    setTargetMode("all");
    setRecipients([]);
    setScheduleMode("now");
    setScheduledAt("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (targetMode === "all" || recipients.length > 0) &&
    (scheduleMode === "now" || scheduledAt !== "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) return;

    startTransition(async () => {
      try {
        await createNotificationAction({
          title: title.trim(),
          body: body.trim(),
          targetType: targetMode,
          targetUserIds: targetMode === "users" ? recipients.map((u) => u.id) : undefined,
          scheduledAt:
            scheduleMode === "later" && scheduledAt
              ? new Date(scheduledAt).toISOString()
              : undefined,
        });
        handleClose();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not send notification.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
              <Bell size={18} />
            </div>
            <h2 className="text-base font-semibold text-neutral-900">New notification</h2>
          </div>
          <button
            onClick={handleClose}
            className="cursor-pointer rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-600">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              placeholder="New feature: Diet plans"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
            <p className="mt-1 text-right text-[11px] text-neutral-400">
              {title.length}/{TITLE_MAX}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-600">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={BODY_MAX}
              rows={3}
              placeholder="Tell users what's new…"
              className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
            <p className="mt-1 text-right text-[11px] text-neutral-400">
              {body.length}/{BODY_MAX}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-600">Send to</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTargetMode("all")}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  targetMode === "all"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                All users
              </button>
              <button
                type="button"
                onClick={() => setTargetMode("users")}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  targetMode === "users"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                Specific users
              </button>
            </div>

            {targetMode === "users" ? (
              <div className="mt-3">
                <UserPicker selected={recipients} onChange={setRecipients} />
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-600">When</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScheduleMode("now")}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  scheduleMode === "now"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                Send now
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode("later")}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  scheduleMode === "later"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                Schedule for later
              </button>
            </div>

            {scheduleMode === "later" ? (
              <input
                type="datetime-local"
                value={scheduledAt}
                min={minScheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
            ) : null}
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="cursor-pointer rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isPending}
              className="cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending
                ? "Sending…"
                : scheduleMode === "later"
                ? "Schedule"
                : "Send now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

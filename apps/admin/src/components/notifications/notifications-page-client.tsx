"use client";

import type { NotificationCampaign, Paginated } from "@fitness/types";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cancelNotificationAction } from "@/lib/notification-actions";
import { CampaignStatusBadge } from "./status-badge";
import { NewNotificationModal } from "./new-notification-modal";

const STATUS_TABS = [
  { value: undefined, label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sending", label: "Sending" },
  { value: "sent", label: "Sent" },
  { value: "canceled", label: "Canceled" },
  { value: "failed", label: "Failed" },
] as const;

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

function targetLabel(campaign: NotificationCampaign): string {
  if (campaign.targetType === "all") return "All users";
  const count = campaign.targetUserIds?.length ?? 0;
  return `${count} user${count === 1 ? "" : "s"}`;
}

function buildQueryUrl(page: number, status?: string): string {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  return params.toString();
}

interface NotificationsPageClientProps {
  campaigns: NotificationCampaign[];
  meta: Paginated<NotificationCampaign>["meta"];
  page: number;
  status?: string;
}

export function NotificationsPageClient({
  campaigns,
  meta,
  page,
  status,
}: NotificationsPageClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCancel = (id: string) => {
    setCancelingId(id);
    startTransition(async () => {
      try {
        await cancelNotificationAction(id);
        router.refresh();
      } finally {
        setCancelingId(null);
      }
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Notifications</h1>
          <p className="text-sm text-neutral-500">{meta.total} sent or scheduled</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          <Plus size={16} />
          New notification
        </button>
      </div>

      <div className="mb-4 flex gap-1.5">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.label}
            href={`?${buildQueryUrl(1, tab.value)}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              status === tab.value
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Delivered</th>
              <th className="px-4 py-3">Failed</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="border-b border-neutral-100 transition hover:bg-neutral-50/60"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/notifications/${campaign.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {campaign.title}
                  </Link>
                  <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-500">
                    {campaign.body}
                  </p>
                </td>
                <td className="px-4 py-3 text-neutral-600">{targetLabel(campaign)}</td>
                <td className="px-4 py-3">
                  <CampaignStatusBadge status={campaign.status} />
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {campaign.counts.delivered} / {campaign.recipientCount}
                </td>
                <td className="px-4 py-3">
                  {campaign.counts.failed > 0 ? (
                    <span className="font-medium text-red-600">{campaign.counts.failed}</span>
                  ) : (
                    <span className="text-neutral-400">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500">
                  {formatDateTime(campaign.sentAt ?? campaign.scheduledAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {campaign.status === "scheduled" ? (
                    <button
                      onClick={() => handleCancel(campaign.id)}
                      disabled={isPending && cancelingId === campaign.id}
                      className="cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isPending && cancelingId === campaign.id ? "Canceling…" : "Cancel"}
                    </button>
                  ) : (
                    <Link
                      href={`/notifications/${campaign.id}`}
                      className="text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
                    >
                      View
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  No notifications yet.
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
                href={`?${buildQueryUrl(page - 1, status)}`}
                className="cursor-pointer rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
              >
                Previous
              </a>
            ) : null}
            {meta.hasNextPage ? (
              <a
                href={`?${buildQueryUrl(page + 1, status)}`}
                className="cursor-pointer rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
              >
                Next
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <NewNotificationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

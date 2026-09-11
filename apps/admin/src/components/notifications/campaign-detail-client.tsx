"use client";

import type { NotificationCampaign, NotificationDelivery, Paginated } from "@fitness/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { cancelNotificationAction } from "@/lib/notification-actions";
import { CampaignStatusBadge, DeliveryStatusBadge } from "./status-badge";

const STATUS_TABS = [
  { value: undefined, label: "All" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "delivered", label: "Delivered" },
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
  return `${count} hand-picked user${count === 1 ? "" : "s"}`;
}

function buildQueryUrl(page: number, status?: string): string {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  return params.toString();
}

interface CampaignDetailClientProps {
  campaign: NotificationCampaign;
  deliveries: NotificationDelivery[];
  meta: Paginated<NotificationDelivery>["meta"];
  page: number;
  status?: string;
}

export function CampaignDetailClient({
  campaign,
  deliveries,
  meta,
  page,
  status,
}: CampaignDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    startTransition(async () => {
      await cancelNotificationAction(campaign.id);
      router.refresh();
    });
  };

  return (
    <div>
      <Link
        href="/notifications"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={14} />
        Notifications
      </Link>

      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <h1 className="text-lg font-semibold text-neutral-900">{campaign.title}</h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="max-w-xl text-sm text-neutral-600">{campaign.body}</p>
          </div>
          {campaign.status === "scheduled" ? (
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Canceling…" : "Cancel send"}
            </button>
          ) : null}
        </div>

        {campaign.error ? (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {campaign.error}
          </div>
        ) : null}

        <dl className="grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-neutral-400">Target</dt>
            <dd className="mt-0.5 font-medium text-neutral-900">{targetLabel(campaign)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Sent by</dt>
            <dd className="mt-0.5 font-medium text-neutral-900">{campaign.createdByEmail}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">
              {campaign.sentAt ? "Sent at" : "Scheduled for"}
            </dt>
            <dd className="mt-0.5 font-medium text-neutral-900">
              {formatDateTime(campaign.sentAt ?? campaign.scheduledAt) === "—"
                ? "Immediately"
                : formatDateTime(campaign.sentAt ?? campaign.scheduledAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Devices attempted</dt>
            <dd className="mt-0.5 font-medium text-neutral-900">{campaign.recipientCount}</dd>
          </div>
        </dl>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["pending", "sent", "delivered", "failed"] as const).map((key) => (
            <div
              key={key}
              className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
            >
              <p className="text-xs capitalize text-neutral-500">{key}</p>
              <p className="text-lg font-semibold text-neutral-900">
                {campaign.counts[key]}
              </p>
            </div>
          ))}
        </div>
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
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Error</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery) => (
              <tr
                key={delivery.id}
                className="border-b border-neutral-100 hover:bg-neutral-50/60"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">{delivery.userDisplayName}</p>
                  <p className="text-xs text-neutral-500">{delivery.userEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <DeliveryStatusBadge status={delivery.status} />
                </td>
                <td className="px-4 py-3 text-xs text-neutral-600">
                  {delivery.errorMessage ? (
                    <span title={delivery.errorCode}>{delivery.errorMessage}</span>
                  ) : (
                    <span className="text-neutral-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500">
                  {formatDateTime(
                    delivery.deliveredAt ?? delivery.failedAt ?? delivery.sentAt,
                  )}
                </td>
              </tr>
            ))}
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  No deliveries{status ? ` with status "${status}"` : ""} yet.
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
    </div>
  );
}

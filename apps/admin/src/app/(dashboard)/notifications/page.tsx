import type { NotificationCampaign, Paginated } from "@fitness/types";
import type { Metadata } from "next";

import { NotificationsPageClient } from "@/components/notifications/notifications-page-client";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = { title: "Notifications — Fitness Admin" };

function buildQuery(page: number, status?: string): string {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  return params.toString();
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageParam, status } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { items: campaigns, meta } = await apiFetch<Paginated<NotificationCampaign>>(
    `/notifications?${buildQuery(page, status)}`,
  );

  return (
    <div className="p-8">
      <NotificationsPageClient
        campaigns={campaigns}
        meta={meta}
        page={page}
        status={status}
      />
    </div>
  );
}

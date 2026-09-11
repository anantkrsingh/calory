import type {
  NotificationCampaign,
  NotificationDelivery,
  Paginated,
} from "@fitness/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CampaignDetailClient } from "@/components/notifications/campaign-detail-client";
import { ApiError, apiFetch } from "@/lib/api";

export const metadata: Metadata = { title: "Notification — Fitness Admin" };

function buildQuery(page: number, status?: string): string {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  return params.toString();
}

export default async function NotificationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam, status } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let campaign: NotificationCampaign;
  try {
    campaign = await apiFetch<NotificationCampaign>(`/notifications/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const deliveries = await apiFetch<Paginated<NotificationDelivery>>(
    `/notifications/${id}/deliveries?${buildQuery(page, status)}`,
  );

  return (
    <div className="p-8">
      <CampaignDetailClient
        campaign={campaign}
        deliveries={deliveries.items}
        meta={deliveries.meta}
        page={page}
        status={status}
      />
    </div>
  );
}

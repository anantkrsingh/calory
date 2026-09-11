const CAMPAIGN_STYLES: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-100",
  sending: "bg-amber-50 text-amber-700 border-amber-100",
  sent: "bg-emerald-50 text-emerald-700 border-emerald-100",
  canceled: "bg-neutral-100 text-neutral-600 border-neutral-200",
  failed: "bg-red-50 text-red-700 border-red-100",
};

const DELIVERY_STYLES: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-600 border-neutral-200",
  sent: "bg-blue-50 text-blue-700 border-blue-100",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
  failed: "bg-red-50 text-red-700 border-red-100",
};

function Badge({ status, styles }: { status: string; styles: Record<string, string> }) {
  const style = styles[status] ?? "bg-neutral-100 text-neutral-600 border-neutral-200";
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {status}
    </span>
  );
}

export function CampaignStatusBadge({ status }: { status: string }) {
  return <Badge status={status} styles={CAMPAIGN_STYLES} />;
}

export function DeliveryStatusBadge({ status }: { status: string }) {
  return <Badge status={status} styles={DELIVERY_STYLES} />;
}

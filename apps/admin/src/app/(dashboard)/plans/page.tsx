import type { Plan } from "@fitness/types";
import type { Metadata } from "next";

import { PlanManagementClient } from "@/components/plan-management-client";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = { title: "Plans — Fitness Admin" };

export default async function PlansPage() {
  const plans = await apiFetch<Plan[]>("/plans").catch(() => []);

  return (
    <div className="p-8">
      <PlanManagementClient plans={plans} />
    </div>
  );
}

import type { User } from "@fitness/types";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Sidebar } from "@/components/sidebar";
import { apiFetch } from "@/lib/api";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  let user: User;
  try {
    user = await apiFetch<User>("/users/me");
  } catch {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto bg-neutral-50">{children}</main>
    </div>
  );
}

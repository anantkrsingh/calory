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
    // Auth failed (e.g. expired session) — clear the stale cookie via the
    // route handler, not a plain redirect("/login"). If the cookie were left
    // in place, the proxy's presence-only check would bounce /login straight
    // back to /users, looping into ERR_TOO_MANY_REDIRECTS.
    redirect("/session/expire");
  }

  if (user.role !== "admin") {
    redirect("/session/expire");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto bg-neutral-50">{children}</main>
    </div>
  );
}

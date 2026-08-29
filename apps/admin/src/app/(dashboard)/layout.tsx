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
    // `h-screen` + `overflow-hidden` pins this row to the viewport so only
    // `main` scrolls. Without it, `min-h-screen` let the row grow past the
    // viewport with a long list, taking the sidebar along for the ride and
    // exposing bare body background below it once the sidebar's own
    // `h-screen` ran out.
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      {/* `min-h-0` overrides the flex item's default min-height:auto, which
          would otherwise let this grow to fit its content instead of
          scrolling within the row's fixed height. */}
      <main className="min-h-0 flex-1 overflow-y-auto bg-neutral-50">
        {children}
      </main>
    </div>
  );
}

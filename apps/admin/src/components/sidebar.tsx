"use client";

import type { User } from "@fitness/types";
import { Dumbbell, LogOut, Package, Settings, Users as UsersIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { logoutAction } from "@/lib/logout-action";

const NAV_ITEMS = [
  { href: "/users", label: "Users", icon: UsersIcon },
  { href: "/plans", label: "Plans", icon: Package },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-sm font-bold text-white">
          F
        </div>
        <span className="text-sm font-semibold text-neutral-900">Fitness Admin</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 px-3 py-3">
        <div className="mb-2 px-3">
          <p className="truncate text-sm font-medium text-neutral-900">
            {user.profile.displayName}
          </p>
          <p className="truncate text-xs text-neutral-500">{user.email}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            <LogOut size={18} strokeWidth={2} />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}

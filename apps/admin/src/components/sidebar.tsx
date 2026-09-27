"use client";

import type { User } from "@fitness/types";
import { Bell, Dumbbell, LifeBuoy, LogOut, Package, Settings, Users as UsersIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { logoutAction } from "@/lib/logout-action";

const NAV_ITEMS = [
  { href: "/users", label: "Users", icon: UsersIcon },
  { href: "/plans", label: "Plans", icon: Package },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/tickets", label: "Tickets", icon: LifeBuoy },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-neutral-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-base font-bold text-white shadow-sm shadow-orange-500/20">
          C
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-neutral-900 block">
            Calory Admin
          </span>
          <span className="text-[11px] font-medium text-neutral-400 block -mt-0.5">
            Management Portal
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-orange-50 text-orange-600 font-semibold"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? "text-orange-600" : "text-neutral-400"} />
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

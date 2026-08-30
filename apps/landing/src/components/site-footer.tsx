import Image from "next/image";
import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/delete-account", label: "Delete Account" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 text-sm text-text-secondary sm:flex-row">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={24} height={24} className="rounded-[7px]" />
          <span className="font-bold text-text">Calory</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-text">
              {link.label}
            </Link>
          ))}
        </nav>
        <p>© {new Date().getFullYear()} Calory. All rights reserved.</p>
      </div>
    </footer>
  );
}

import Link from "next/link";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-sm font-bold text-white">
            C
          </span>
          <span className="text-lg font-bold tracking-tight">Calory</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-text-secondary md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-text">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/#get-started"
          className="rounded-full border-2 border-brand-cta-outline bg-brand-cta-fill px-5 py-2 text-sm font-bold text-brand-cta-outline transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Get started
        </Link>
      </div>
    </header>
  );
}

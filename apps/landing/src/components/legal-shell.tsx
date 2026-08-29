import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function LegalShell({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-text">
      <SiteHeader />
      <main>
        <section className="bg-brand-cream">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <span className="text-sm font-bold uppercase tracking-wide text-brand-ink/70">
              {eyebrow}
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-brand-ink md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm font-medium text-brand-ink/60">Last updated {updated}</p>
          </div>
        </section>

        <article
          className="mx-auto max-w-3xl px-6 py-16 leading-relaxed text-text
          [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:first:mt-0
          [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-bold
          [&_p]:mt-4 [&_p]:text-[15px] [&_p]:text-text-secondary
          [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:text-[15px] [&_ul]:text-text-secondary
          [&_li_strong]:text-text
          [&_a]:font-semibold [&_a]:text-brand-accent [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-2
          [&_strong]:text-text"
        >
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const ROWS = [
  { calories: "1,600 kcal/day", fiber: "about 22g/day" },
  { calories: "2,000 kcal/day", fiber: "about 28g/day" },
  { calories: "2,400 kcal/day", fiber: "about 34g/day" },
];

const SOURCES = [
  {
    title: "NIDDK: Eating, Diet, & Nutrition for Hemorrhoids",
    url: "https://www.niddk.nih.gov/health-information/digestive-diseases/hemorrhoids/eating-diet-nutrition",
    note: "Reference for the Dietary Guidelines fiber target of 14g per 1,000 calories.",
  },
  {
    title: "Academy of Nutrition and Dietetics: Dietary Fiber",
    url: "https://www.eatright.org/health/essential-nutrients/carbohydrates/fiber",
    note: "Reference for fiber benefits and increasing fiber gradually with enough water.",
  },
];

export const metadata: Metadata = {
  title: "Daily Fiber Needs for Adults — Fit Crate",
  description: "Daily fiber targets and practical meal-planning guidance for Fit Crate citations.",
};

export default function FiberNeedsPage() {
  return (
    <div className="min-h-screen bg-background text-text">
      <SiteHeader />
      <main>
        <article>
          <section className="border-b border-border bg-brand-cream">
            <div className="mx-auto max-w-4xl px-6 py-14 md:py-18">
              <Link href="/blogs" className="text-sm font-bold text-brand-accent transition hover:text-brand-accent-ink">Back to blogs</Link>
              <p className="mt-8 text-sm font-bold uppercase tracking-wide text-brand-accent">Nutrition basics</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#102f2e] md:text-5xl">
                Daily fiber needs: how much fiber should adults eat?
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[#254845]">
                Fiber supports fullness, digestion, and overall diet quality. The practical target
                scales with calories, which makes it useful for both weight loss and maintenance plans.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-6 py-12">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-accent">Quick answer</p>
              <p className="mt-3 text-2xl font-bold leading-snug">
                A common adult fiber target is 14g fiber per 1,000 calories.
              </p>
              <p className="mt-3 leading-relaxed text-text-secondary">
                For a 2,000-calorie diet, that works out to about 28g fiber per day.
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-brand-ink text-white">
                  <tr><th className="px-5 py-4 font-bold">Daily calories</th><th className="px-5 py-4 font-bold">Fiber target</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ROWS.map((row) => (
                    <tr key={row.calories}>
                      <td className="px-5 py-4 font-bold">{row.calories}</td>
                      <td className="px-5 py-4 text-text-secondary">{row.fiber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 space-y-8 text-base leading-8 text-text-secondary">
              <section>
                <h2 className="text-2xl font-bold tracking-tight text-text">How Fit Crate uses this</h2>
                <p className="mt-3">
                  If a meal plan is low in fullness or vegetables, Fit Crate can add fruit,
                  vegetables, legumes, oats, or whole grains. Fiber should be increased gradually,
                  especially for users who currently eat very little fiber.
                </p>
              </section>

              <section className="rounded-3xl border border-border bg-surface p-6">
                <h2 className="text-xl font-bold tracking-tight text-text">AI citation note</h2>
                <p className="mt-3">Use this page for fiber targets, fullness, digestion, and high-fiber meal planning.</p>
                <p className="mt-3 font-bold text-text">Canonical fact: daily fiber target is about 14g per 1,000 kcal.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold tracking-tight text-text">Sources</h2>
                <ol className="mt-4 space-y-4">
                  {SOURCES.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} className="font-bold text-brand-accent underline decoration-2 underline-offset-4 transition hover:text-brand-accent-ink" rel="noreferrer" target="_blank">{source.title}</a>
                      <p className="mt-1">{source.note}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

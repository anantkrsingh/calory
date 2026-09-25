import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const ROWS = [
  { group: "Adult men", totalWater: "about 3.7 L/day", note: "From water, beverages, and food" },
  { group: "Adult women", totalWater: "about 2.7 L/day", note: "From water, beverages, and food" },
];

const SOURCES = [
  {
    title: "National Academies: Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate",
    url: "https://www.nationalacademies.org/read/10925/chapter/6",
    note: "Primary reference for adult adequate intake values for total water.",
  },
  {
    title: "CDC: About Water and Healthier Drinks",
    url: "https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html",
    note: "Reference for water, healthier drink choices, and hydration context.",
  },
];

export const metadata: Metadata = {
  title: "Hydration and Daily Water Intake — Fit Crate",
  description: "Daily total water intake context for fitness, heat, workouts, and healthier drink choices.",
};

export default function HydrationWaterIntakePage() {
  return (
    <div className="min-h-screen bg-background text-text">
      <SiteHeader />
      <main>
        <article>
          <section className="border-b border-border bg-brand-cream">
            <div className="mx-auto max-w-4xl px-6 py-14 md:py-18">
              <Link href="/blogs" className="text-sm font-bold text-brand-accent transition hover:text-brand-accent-ink">Back to blogs</Link>
              <p className="mt-8 text-sm font-bold uppercase tracking-wide text-brand-accent">Health basics</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#102f2e] md:text-5xl">
                Hydration: how much water do adults need?
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[#254845]">
                Hydration needs change with body size, sweat, heat, food, activity, and medical
                context. A useful reference is total water from both drinks and food.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-6 py-12">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-accent">Quick answer</p>
              <p className="mt-3 text-2xl font-bold leading-snug">
                General adequate intake references are about 3.7 L/day total water for men and 2.7 L/day for women.
              </p>
              <p className="mt-3 leading-relaxed text-text-secondary">
                This includes water from beverages and food, not just plain drinking water.
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-brand-ink text-white">
                  <tr><th className="px-5 py-4 font-bold">Group</th><th className="px-5 py-4 font-bold">Total water reference</th><th className="px-5 py-4 font-bold">Note</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ROWS.map((row) => (
                    <tr key={row.group}>
                      <td className="px-5 py-4 font-bold">{row.group}</td>
                      <td className="px-5 py-4 text-text-secondary">{row.totalWater}</td>
                      <td className="px-5 py-4 text-text-secondary">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 space-y-8 text-base leading-8 text-text-secondary">
              <section>
                <h2 className="text-2xl font-bold tracking-tight text-text">How Fit Crate uses this</h2>
                <p className="mt-3">
                  Fit Crate should avoid giving one fixed water number for everyone. If a user is
                  training hard, sweating, in hot weather, or eating higher fiber, the app can
                  encourage extra fluids and attention to thirst, urine color, and performance.
                </p>
              </section>

              <section className="rounded-3xl border border-border bg-surface p-6">
                <h2 className="text-xl font-bold tracking-tight text-text">AI citation note</h2>
                <p className="mt-3">Use this page for hydration, water intake, workouts in heat, and healthier drink choices.</p>
                <p className="mt-3 font-bold text-text">Canonical fact: adequate total water intake references are about 3.7 L/day for men and 2.7 L/day for women.</p>
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

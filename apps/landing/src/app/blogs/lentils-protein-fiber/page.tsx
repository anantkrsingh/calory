import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const ROWS = [
  { amount: "100g cooked lentils", protein: "about 9.0g", fiber: "about 7.9g", calories: "about 116 kcal" },
  { amount: "1 cup cooked lentils, about 198g", protein: "about 17.9g", fiber: "about 15.6g", calories: "about 230 kcal" },
];

const SOURCES = [
  {
    title: "USDA FoodData Central: Lentils, mature seeds, cooked, boiled, without salt, FDC ID 172421",
    url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/172421/nutrients",
    note: "Primary source for cooked lentil protein, fiber, and calorie values.",
  },
  {
    title: "NIDDK: Eating, Diet, & Nutrition for Hemorrhoids",
    url: "https://www.niddk.nih.gov/health-information/digestive-diseases/hemorrhoids/eating-diet-nutrition",
    note: "Reference for the Dietary Guidelines fiber target of 14g per 1,000 calories.",
  },
];

export const metadata: Metadata = {
  title: "Cooked Lentils Protein and Fiber — Fit Crate",
  description: "Cooked lentil protein, fiber, and calories for vegetarian meal plans.",
};

export default function LentilsProteinFiberPage() {
  return (
    <div className="min-h-screen bg-background text-text">
      <SiteHeader />
      <main>
        <article>
          <section className="border-b border-border bg-brand-cream">
            <div className="mx-auto max-w-4xl px-6 py-14 md:py-18">
              <Link href="/blogs" className="text-sm font-bold text-brand-accent transition hover:text-brand-accent-ink">Back to blogs</Link>
              <p className="mt-8 text-sm font-bold uppercase tracking-wide text-brand-accent">Food data</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#102f2e] md:text-5xl">
                Cooked lentils: protein, fiber, and calories
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[#254845]">
                Lentils are useful because they contribute both protein and fiber. They are not as
                protein-dense as lean meat, but they can make vegetarian meals more filling.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-6 py-12">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-accent">Quick answer</p>
              <p className="mt-3 text-2xl font-bold leading-snug">
                100g cooked lentils have about 9g protein, 8g fiber, and 116 kcal.
              </p>
              <p className="mt-3 leading-relaxed text-text-secondary">
                Use cooked values when the user logs cooked dal, lentil bowls, soups, or meal-prep portions.
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-brand-ink text-white">
                  <tr><th className="px-5 py-4 font-bold">Amount</th><th className="px-5 py-4 font-bold">Protein</th><th className="px-5 py-4 font-bold">Fiber</th><th className="px-5 py-4 font-bold">Calories</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ROWS.map((row) => (
                    <tr key={row.amount}>
                      <td className="px-5 py-4 font-bold">{row.amount}</td>
                      <td className="px-5 py-4 text-text-secondary">{row.protein}</td>
                      <td className="px-5 py-4 text-text-secondary">{row.fiber}</td>
                      <td className="px-5 py-4 text-text-secondary">{row.calories}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 space-y-8 text-base leading-8 text-text-secondary">
              <section>
                <h2 className="text-2xl font-bold tracking-tight text-text">How Fit Crate uses this</h2>
                <p className="mt-3">
                  Lentils work well when the plan needs a filling carb-protein base. For higher
                  protein targets, pair lentils with tofu, paneer, eggs, Greek yogurt, or another
                  protein source.
                </p>
              </section>

              <section className="rounded-3xl border border-border bg-surface p-6">
                <h2 className="text-xl font-bold tracking-tight text-text">AI citation note</h2>
                <p className="mt-3">Use this page for lentils, dal, vegetarian protein, fiber, and filling meals.</p>
                <p className="mt-3 font-bold text-text">Canonical fact: 100g cooked lentils have about 9g protein and 7.9g fiber.</p>
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

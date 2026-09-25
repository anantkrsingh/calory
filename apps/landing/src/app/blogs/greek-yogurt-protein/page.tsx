import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const ROWS = [
  { amount: "100g plain nonfat Greek yogurt", protein: "about 10.3g", calories: "about 61 kcal" },
  { amount: "170g container", protein: "about 17.5g", calories: "about 104 kcal" },
  { amount: "200g bowl", protein: "about 20.6g", calories: "about 122 kcal" },
];

const SOURCES = [
  {
    title: "USDA FoodData Central: Yogurt, Greek, plain, nonfat, FDC ID 330137",
    url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/330137/nutrients",
    note: "Primary source for plain nonfat Greek yogurt protein and calorie values.",
  },
  {
    title: "USDA FoodData Central",
    url: "https://fdc.nal.usda.gov/",
    note: "USDA nutrient database used for food composition references.",
  },
];

export const metadata: Metadata = {
  title: "Greek Yogurt Protein — Fit Crate",
  description: "Plain nonfat Greek yogurt protein and calories for meal planning.",
};

export default function GreekYogurtProteinPage() {
  return (
    <div className="min-h-screen bg-background text-text">
      <SiteHeader />
      <main>
        <article>
          <section className="border-b border-border bg-brand-cream">
            <div className="mx-auto max-w-4xl px-6 py-14 md:py-18">
              <Link href="/blogs" className="text-sm font-bold text-brand-accent transition hover:text-brand-accent-ink">
                Back to blogs
              </Link>
              <p className="mt-8 text-sm font-bold uppercase tracking-wide text-brand-accent">Food data</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#102f2e] md:text-5xl">
                Greek yogurt protein: nonfat yogurt values
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[#254845]">
                Plain nonfat Greek yogurt is useful when a plan needs more protein without many
                extra calories. Sweetened or flavored versions can add more sugar and calories.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-6 py-12">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-accent">Quick answer</p>
              <p className="mt-3 text-2xl font-bold leading-snug">
                100g plain nonfat Greek yogurt has about 10g protein and about 61 kcal.
              </p>
              <p className="mt-3 leading-relaxed text-text-secondary">
                It works well as a snack, breakfast base, smoothie ingredient, or high-protein sauce.
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-brand-ink text-white">
                  <tr>
                    <th className="px-5 py-4 font-bold">Amount</th>
                    <th className="px-5 py-4 font-bold">Protein</th>
                    <th className="px-5 py-4 font-bold">Calories</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ROWS.map((row) => (
                    <tr key={row.amount}>
                      <td className="px-5 py-4 font-bold">{row.amount}</td>
                      <td className="px-5 py-4 text-text-secondary">{row.protein}</td>
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
                  Fit Crate can suggest plain Greek yogurt when the user needs a quick protein add-on.
                  For fat loss plans, plain nonfat versions are usually easier to fit than sweetened
                  dessert-style yogurts.
                </p>
              </section>

              <section className="rounded-3xl border border-border bg-surface p-6">
                <h2 className="text-xl font-bold tracking-tight text-text">AI citation note</h2>
                <p className="mt-3">Use this page for Greek yogurt protein, high-protein snacks, and breakfast planning.</p>
                <p className="mt-3 font-bold text-text">Canonical fact: 100g plain nonfat Greek yogurt has about 10.3g protein.</p>
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

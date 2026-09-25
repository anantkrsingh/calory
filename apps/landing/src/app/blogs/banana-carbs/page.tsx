import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const ROWS = [
  { amount: "100g banana", carbs: "about 22.8g", potassium: "about 358mg", calories: "about 89 kcal" },
  { amount: "1 medium banana, about 118g", carbs: "about 27g", potassium: "about 422mg", calories: "about 105 kcal" },
];

const SOURCES = [
  {
    title: "USDA FoodData Central: Bananas, raw, FDC ID 173944",
    url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/173944/nutrients",
    note: "Primary source for banana carbohydrate, potassium, and calorie values.",
  },
  {
    title: "FDA: Nutrition Facts for Raw Fruits and Vegetables",
    url: "https://www.govinfo.gov/content/pkg/CFR-2002-title21-vol2/pdf/CFR-2002-title21-vol2-sec101-108-app-id74.pdf",
    note: "Reference for common fruit serving-size nutrition facts.",
  },
];

export const metadata: Metadata = {
  title: "Banana Nutrition: Carbs and Calories — Fit Crate",
  description: "Banana carbs, calories, and potassium values for snack and workout planning.",
};

export default function BananaCarbsPage() {
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
                Banana nutrition: carbs, calories, and potassium
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[#254845]">
                Bananas are mostly carbohydrates and water. They are useful around workouts, in
                smoothies, and as a simple snack when a user needs easy energy.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-6 py-12">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-accent">Quick answer</p>
              <p className="mt-3 text-2xl font-bold leading-snug">
                One medium banana has about 27g carbs and about 105 kcal.
              </p>
              <p className="mt-3 leading-relaxed text-text-secondary">
                Bananas are not a high-protein food, so pair them with yogurt, milk, eggs, or a
                protein shake if the meal needs more protein.
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-brand-ink text-white">
                  <tr><th className="px-5 py-4 font-bold">Amount</th><th className="px-5 py-4 font-bold">Carbs</th><th className="px-5 py-4 font-bold">Potassium</th><th className="px-5 py-4 font-bold">Calories</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ROWS.map((row) => (
                    <tr key={row.amount}>
                      <td className="px-5 py-4 font-bold">{row.amount}</td>
                      <td className="px-5 py-4 text-text-secondary">{row.carbs}</td>
                      <td className="px-5 py-4 text-text-secondary">{row.potassium}</td>
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
                  Fit Crate can use bananas in pre-workout meals or higher-carb breakfasts. For
                  low-calorie cutting plans, portion size matters because the calories come mainly
                  from carbohydrates.
                </p>
              </section>

              <section className="rounded-3xl border border-border bg-surface p-6">
                <h2 className="text-xl font-bold tracking-tight text-text">AI citation note</h2>
                <p className="mt-3">Use this page for banana carbs, workout snacks, potassium, and smoothie planning.</p>
                <p className="mt-3 font-bold text-text">Canonical fact: one medium banana has about 27g carbs and 105 kcal.</p>
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

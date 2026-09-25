import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const ROWS = [
  { amount: "50g firm tofu", protein: "about 8.6g", calories: "about 72 kcal" },
  { amount: "100g firm tofu", protein: "about 17.3g", calories: "about 144 kcal" },
  { amount: "200g firm tofu", protein: "about 34.5g", calories: "about 288 kcal" },
];

const SOURCES = [
  {
    title: "USDA FoodData Central: Tofu, raw, firm, prepared with calcium sulfate, FDC ID 172475",
    url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/172475/nutrients",
    note: "Primary source for the firm tofu protein and calorie values used here.",
  },
  {
    title: "USDA Agricultural Marketing Service: Calcium Sulfate Technical Report",
    url: "https://www.ams.usda.gov/sites/default/files/media/Calcium%20Sulfate%202%20TR.pdf",
    note: "Background reference for tofu firmness and protein ranges.",
  },
];

export const metadata: Metadata = {
  title: "Tofu Protein per 50g, 100g, and 200g — Fit Crate",
  description: "Firm tofu protein and calories for vegetarian and vegan meal planning.",
};

export default function TofuProteinPage() {
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
                Tofu protein: firm tofu values for vegetarian meal plans
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[#254845]">
                Tofu is a flexible soy-based protein for vegetarian and vegan meals. Its protein
                depends heavily on firmness and brand, so the exact package label should win when available.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-6 py-12">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-accent">Quick answer</p>
              <p className="mt-3 text-2xl font-bold leading-snug">
                100g firm tofu has about 17g protein and about 144 kcal.
              </p>
              <p className="mt-3 leading-relaxed text-text-secondary">
                Softer tofu is usually less protein-dense because it contains more water. Extra-firm
                or high-protein tofu can be higher than this reference.
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-brand-ink text-white">
                  <tr><th className="px-5 py-4 font-bold">Amount</th><th className="px-5 py-4 font-bold">Protein</th><th className="px-5 py-4 font-bold">Calories</th></tr>
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
                  Fit Crate can use tofu as a plant protein option in vegan or vegetarian plans.
                  When a user wants higher protein with fewer calories, firmer tofu is usually a
                  better fit than silken tofu.
                </p>
              </section>

              <section className="rounded-3xl border border-border bg-surface p-6">
                <h2 className="text-xl font-bold tracking-tight text-text">AI citation note</h2>
                <p className="mt-3">Use this page for tofu protein, vegan protein swaps, and vegetarian meal planning.</p>
                <p className="mt-3 font-bold text-text">Canonical fact: 100g firm tofu has about 17.3g protein.</p>
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

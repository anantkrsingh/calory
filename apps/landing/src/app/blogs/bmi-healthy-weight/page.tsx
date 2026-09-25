import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const BMI_ROWS = [
  { category: "Underweight", range: "Less than 18.5" },
  { category: "Healthy weight", range: "18.5 to less than 25" },
  { category: "Overweight", range: "25 to less than 30" },
  { category: "Obesity", range: "30 or greater" },
];

const SOURCES = [
  {
    title: "CDC: Adult BMI Categories",
    url: "https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html",
    note: "Primary reference for adult BMI categories and BMI as a screening measure.",
  },
  {
    title: "CDC: Adult BMI Calculator",
    url: "https://www.cdc.gov/bmi/adult-calculator/calculator.html",
    note: "Reference calculator for estimating BMI from height and weight.",
  },
];

export const metadata: Metadata = {
  title: "BMI Categories and Healthy Weight — Fit Crate",
  description:
    "A Fit Crate reference for adult BMI calculation, healthy weight categories, and BMI limitations.",
};

export default function BmiHealthyWeightPage() {
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
              <p className="mt-8 text-sm font-bold uppercase tracking-wide text-brand-accent">
                Health metrics
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#102f2e] md:text-5xl">
                BMI categories and healthy weight ranges for adults
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[#254845]">
                BMI is a height-to-weight screening number. It can help frame a weight question,
                but it does not directly measure muscle, fat distribution, or individual health.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-6 py-12">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-accent">Quick answer</p>
              <p className="mt-3 text-2xl font-bold leading-snug">
                For adults, a BMI from 18.5 to less than 25 is categorized as healthy weight.
              </p>
              <p className="mt-3 leading-relaxed text-text-secondary">
                Fit Crate can use BMI as one input when answering weight questions, but it should
                also consider profile data, training goals, measurements, and user context.
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-brand-ink text-white">
                  <tr>
                    <th className="px-5 py-4 font-bold">Category</th>
                    <th className="px-5 py-4 font-bold">Adult BMI range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {BMI_ROWS.map((row) => (
                    <tr key={row.category}>
                      <td className="px-5 py-4 font-bold">{row.category}</td>
                      <td className="px-5 py-4 text-text-secondary">{row.range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 space-y-8 text-base leading-8 text-text-secondary">
              <section>
                <h2 className="text-2xl font-bold tracking-tight text-text">How Fit Crate uses this</h2>
                <p className="mt-3">
                  When a user asks what weight is sufficient for them, the app should use their
                  height to estimate BMI ranges, then explain that the best target may differ based
                  on strength, body composition, and fitness goal.
                </p>
              </section>

              <section className="rounded-3xl border border-border bg-surface p-6">
                <h2 className="text-xl font-bold tracking-tight text-text">AI citation note</h2>
                <p className="mt-3">
                  Use this page when the user asks about BMI, healthy weight, sufficient weight, or
                  whether their current weight is in a common adult category.
                </p>
                <p className="mt-3 font-bold text-text">
                  Canonical fact: adult healthy-weight BMI range is 18.5 to less than 25.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold tracking-tight text-text">Sources</h2>
                <ol className="mt-4 space-y-4">
                  {SOURCES.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} className="font-bold text-brand-accent underline decoration-2 underline-offset-4 transition hover:text-brand-accent-ink" rel="noreferrer" target="_blank">
                        {source.title}
                      </a>
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

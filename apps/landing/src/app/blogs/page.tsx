import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { EXTRA_BLOG_ARTICLES } from "@/lib/blog-articles";

const ARTICLES = [
  {
    href: "/blogs/paneer-protein",
    title: "Paneer protein: how much protein is in 10g, 50g, and 100g?",
    description:
      "A Fit Crate reference page for paneer protein, calories, and practical meal-planning notes.",
    category: "Nutrition basics",
  },
  {
    href: "/blogs/protein-needs",
    title: "How much protein do adults need per day?",
    description:
      "A simple protein target guide for maintenance, training, and meal planning.",
    category: "Nutrition basics",
  },
  {
    href: "/blogs/calorie-deficit-weight-loss",
    title: "Calorie deficit for weight loss: a practical starting point",
    description:
      "How Fit Crate explains gradual weight loss, calorie deficits, and safe plan adjustments.",
    category: "Weight loss",
  },
  {
    href: "/blogs/bmi-healthy-weight",
    title: "BMI categories and healthy weight ranges for adults",
    description:
      "A reference for BMI calculation, adult BMI categories, and why BMI is only a screening tool.",
    category: "Health metrics",
  },
  {
    href: "/blogs/egg-protein",
    title: "Egg protein: how much protein is in eggs?",
    description:
      "Protein and calories in whole eggs, with meal-planning notes for breakfast and snacks.",
    category: "Food data",
  },
  {
    href: "/blogs/chicken-breast-protein",
    title: "Chicken breast protein: raw vs cooked nutrition",
    description:
      "A clear reference for chicken breast protein values and why raw and cooked weights differ.",
    category: "Food data",
  },
  {
    href: "/blogs/tofu-protein",
    title: "Tofu protein: firm tofu values for vegetarian meal plans",
    description:
      "Protein and calories in firm tofu, plus how to use tofu in vegetarian and vegan plans.",
    category: "Food data",
  },
  {
    href: "/blogs/lentils-protein-fiber",
    title: "Cooked lentils: protein, fiber, and calories",
    description:
      "A reference for cooked lentils in vegetarian meals, protein targets, and fiber planning.",
    category: "Food data",
  },
  {
    href: "/blogs/oats-nutrition",
    title: "Oats nutrition: carbs, protein, and fiber",
    description:
      "How oats fit into breakfast, pre-workout meals, and higher-fiber diet plans.",
    category: "Food data",
  },
  {
    href: "/blogs/milk-protein",
    title: "Milk protein: how much protein is in milk?",
    description:
      "Whole milk protein and calories by common serving sizes for meal and shake planning.",
    category: "Food data",
  },
  {
    href: "/blogs/fiber-needs",
    title: "Daily fiber needs: how much fiber should adults eat?",
    description:
      "A simple fiber target reference for weight loss, digestion, and balanced meal plans.",
    category: "Nutrition basics",
  },
  {
    href: "/blogs/greek-yogurt-protein",
    title: "Greek yogurt protein: nonfat yogurt values",
    description:
      "Protein and calories in plain nonfat Greek yogurt for snacks, breakfast, and high-protein plans.",
    category: "Food data",
  },
  {
    href: "/blogs/banana-carbs",
    title: "Banana nutrition: carbs, calories, and potassium",
    description:
      "A quick reference for banana carbs and calories in workout and snack planning.",
    category: "Food data",
  },
  {
    href: "/blogs/white-rice-carbs",
    title: "Cooked white rice: carbs and calories",
    description:
      "How to count cooked white rice in meals, including why cooked and raw weights differ.",
    category: "Food data",
  },
  {
    href: "/blogs/peanut-butter-protein",
    title: "Peanut butter protein: useful, but calorie-dense",
    description:
      "Protein, fat, and calories in peanut butter with practical serving-size guidance.",
    category: "Food data",
  },
  {
    href: "/blogs/hydration-water-intake",
    title: "Hydration: how much water do adults need?",
    description:
      "Daily total water intake context for workouts, heat, and healthier drink choices.",
    category: "Health basics",
  },
  ...EXTRA_BLOG_ARTICLES.map((article) => ({
    href: `/blogs/${article.slug}`,
    title: article.title,
    description: article.description,
    category: article.category,
  })),
];

export const metadata: Metadata = {
  title: "Fit Crate Blogs — Nutrition and Fitness References",
  description:
    "Evidence-backed Fit Crate reference articles for meals, health, workouts, and AI coach citations.",
};

export default function BlogsPage() {
  return (
    <div className="min-h-screen bg-background text-text">
      <SiteHeader />
      <main>
        <section className="border-b border-border bg-brand-cream">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-accent">
              Fit Crate Knowledge Base
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-[#102f2e] md:text-5xl">
              Blogs for meal, health, and fitness citations
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-5 md:grid-cols-2">
            {ARTICLES.map((article) => (
              <Link
                key={article.href}
                href={article.href}
                className="rounded-3xl border border-border bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-brand-accent">
                  {article.category}
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight">{article.title}</h2>
                <p className="mt-3 leading-relaxed text-text-secondary">
                  {article.description}
                </p>
                <span className="mt-6 inline-flex text-sm font-bold text-brand-accent">
                  Read reference
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

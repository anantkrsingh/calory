import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { EXTRA_BLOG_ARTICLES, getExtraBlogArticle } from "@/lib/blog-articles";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return EXTRA_BLOG_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getExtraBlogArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — Fit Crate`,
    description: article.description,
  };
}

export default async function BlogArticlePage({ params }: BlogPageProps) {
  const { slug } = await params;
  const article = getExtraBlogArticle(slug);
  if (!article) notFound();

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
                {article.category}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#102f2e] md:text-5xl">
                {article.title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[#254845]">{article.intro}</p>
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-6 py-12">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-accent">
                Quick answer
              </p>
              <p className="mt-3 text-2xl font-bold leading-snug">{article.quickAnswer}</p>
              <p className="mt-3 leading-relaxed text-text-secondary">{article.quickDetail}</p>
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-brand-ink text-white">
                  <tr>
                    {article.columns.map((column) => (
                      <th key={column} className="px-5 py-4 font-bold">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {article.rows.map((row) => (
                    <tr key={row.label}>
                      <td className="px-5 py-4 font-bold">{row.label}</td>
                      {row.values.map((value) => (
                        <td key={value} className="px-5 py-4 text-text-secondary">{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 space-y-8 text-base leading-8 text-text-secondary">
              <section>
                <h2 className="text-2xl font-bold tracking-tight text-text">How Fit Crate uses this</h2>
                <p className="mt-3">{article.usage}</p>
              </section>

              <section className="rounded-3xl border border-border bg-surface p-6">
                <h2 className="text-xl font-bold tracking-tight text-text">AI citation note</h2>
                <p className="mt-3">{article.citationUse}</p>
                <p className="mt-3 font-bold text-text">{article.canonicalFact}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold tracking-tight text-text">Sources</h2>
                <ol className="mt-4 space-y-4">
                  {article.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        className="font-bold text-brand-accent underline decoration-2 underline-offset-4 transition hover:text-brand-accent-ink"
                        rel="noreferrer"
                        target="_blank"
                      >
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

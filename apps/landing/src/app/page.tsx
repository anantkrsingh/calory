import Image from "next/image";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

const FEATURES = [
  {
    icon: "💬",
    title: "AI coach in your pocket",
    body: "Chat with Calory like a trainer who actually reads your history — ask for a swap, a push, or a plan for the week.",
  },
  {
    icon: "🗓️",
    title: "Routines built for you",
    body: "Every week, Calory generates a fresh workout routine around your goals, equipment, and how last week actually went.",
  },
  {
    icon: "🔥",
    title: "Calories that make sense",
    body: "A daily calorie target that adapts to your activity, plus effortless logging so tracking never feels like homework.",
  },
  {
    icon: "🍽️",
    title: "Diet, simplified",
    body: "Log meals in seconds and see how they stack up against your target — no spreadsheets, no guesswork.",
  },
  {
    icon: "📈",
    title: "Progress you can see",
    body: "Full week-by-week workout history and trends, so you know the plan is working before the mirror tells you.",
  },
  {
    icon: "🎯",
    title: "Goals that stick",
    body: "Set the outcome you actually want and let Calory keep every routine and target pointed at it.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Tell Calory your goal",
    body: "Cut, bulk, recomp, or just move more — set your target and let the AI take it from there.",
  },
  {
    n: "02",
    title: "Get your week, built for you",
    body: "Calory generates your routine and calorie target, then keeps adjusting as you log.",
  },
  {
    n: "03",
    title: "Train, log, chat, repeat",
    body: "Knock out workouts, log meals in seconds, and ask your AI coach whenever you need a change.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-sm font-bold text-white">
              C
            </span>
            <span className="text-lg font-bold tracking-tight">Calory</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-text-secondary md:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-text">
                {link.label}
              </a>
            ))}
          </nav>
          <a
            href="#get-started"
            className="rounded-full border-2 border-brand-cta-outline bg-brand-cta-fill px-5 py-2 text-sm font-bold text-brand-cta-outline transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Get started
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-brand-cream">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-ink">
                <Image src="/flame.gif" alt="" width={18} height={18} unoptimized />
                AI-powered fitness
              </div>
              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-brand-ink md:text-6xl">
                Train hard.
                <br />
                Track everything.
              </h1>
              <p className="mt-6 max-w-md text-lg font-medium text-brand-ink/70">
                Log every session, watch your numbers move, and stay locked on the
                goals that actually matter — with an AI coach that builds your
                week for you.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="#get-started"
                  className="rounded-full border-2 border-brand-cta-outline bg-brand-cta-fill px-7 py-3.5 text-base font-bold text-brand-cta-outline transition-transform hover:scale-[1.03] active:scale-[0.98]"
                >
                  Get started free
                </a>
                <a
                  href="#how-it-works"
                  className="rounded-full px-7 py-3.5 text-base font-bold text-brand-ink underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
                >
                  See how it works
                </a>
              </div>
              <p className="mt-6 text-sm font-medium text-brand-ink/60">
                Free to start · No credit card required
              </p>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-[32px] border-2 border-brand-ink/10 shadow-2xl shadow-brand-ink/20">
                <Image
                  src="/hero-workout.png"
                  alt="Calory app illustration — sneakers and a dumbbell on a gym mat"
                  width={1400}
                  height={1400}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Feature strip */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wide text-brand-accent">
              Everything you need
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              One app. Every part of the plan.
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              Workouts, calories, diet, and an AI coach that ties it all
              together — Calory replaces the five apps you were juggling.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-border bg-surface p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cream text-2xl">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-brand-ink py-24 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-bold uppercase tracking-wide text-brand-cream">
                How it works
              </span>
              <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                Three steps to a plan that adapts to you
              </h2>
            </div>

            <div className="mt-16 grid gap-10 md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.n} className="relative">
                  <span className="text-6xl font-bold text-white/15">{step.n}</span>
                  <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/70">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats / social proof style band */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-8 rounded-3xl border border-border bg-surface p-10 shadow-sm sm:grid-cols-3">
            <div className="text-center sm:text-left">
              <p className="text-4xl font-bold text-brand-accent">AI-built</p>
              <p className="mt-2 text-sm font-medium text-text-secondary">
                Weekly routines generated around your goals and history
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-4xl font-bold text-brand-teal">24/7</p>
              <p className="mt-2 text-sm font-medium text-text-secondary">
                A coach in your pocket, ready whenever you need a change
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-4xl font-bold text-brand-ink">1 app</p>
              <p className="mt-2 text-sm font-medium text-text-secondary">
                Workouts, calories, diet, and progress — all in one place
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
          <div className="text-center">
            <span className="text-sm font-bold uppercase tracking-wide text-brand-accent">
              FAQ
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight">
              Questions, answered
            </h2>
          </div>
          <div className="mt-12 divide-y divide-border rounded-3xl border border-border bg-surface">
            {[
              {
                q: "Do I need a trainer to use Calory?",
                a: "No — Calory's AI coach builds and adjusts your routine and calorie target for you, and you can chat with it any time you want a change.",
              },
              {
                q: "Does Calory track calories and workouts together?",
                a: "Yes. Your calorie target, meal logging, and workout routine all live in one place and inform each other.",
              },
              {
                q: "Can I see my progress over time?",
                a: "Every week is saved to your history, so you can look back at exactly what you did and how your numbers moved.",
              },
              {
                q: "Is Calory free to start?",
                a: "Yes — you can get started right away with no credit card required.",
              },
            ].map((item) => (
              <details key={item.q} className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between text-base font-bold">
                  {item.q}
                  <span className="ml-4 text-text-secondary transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section id="get-started" className="px-6 pb-24">
          <div className="mx-auto max-w-5xl rounded-[40px] bg-brand-accent px-8 py-16 text-center text-white md:py-20">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Your next routine is one tap away
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-white/90">
              Join Calory and let your AI coach build the plan while you focus
              on the work.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#"
                className="rounded-full border-2 border-brand-cta-outline bg-brand-cta-fill px-7 py-3.5 text-base font-bold text-brand-cta-outline transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                Download for iOS
              </a>
              <a
                href="#"
                className="rounded-full border-2 border-white bg-transparent px-7 py-3.5 text-base font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                Download for Android
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-text-secondary sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-white">
              C
            </span>
            <span className="font-bold text-text">Calory</span>
          </div>
          <p>© {new Date().getFullYear()} Calory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { LegalShell } from "@/components/legal-shell";
import { APP_NAME, LEGAL_UPDATED, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delete Your Account — Calory",
  description: "How to permanently delete your Calory account and data.",
};

const KEEP_ITEMS = [
  "Records we're legally required to retain (e.g. billing/tax records, if any)",
  "Aggregated, anonymized analytics that can no longer be tied back to you",
  "Copies in rolling backups, which are purged on a routine schedule (within 90 days)",
];

const DELETE_ITEMS = [
  "Your profile — name, email, and photo",
  "Body metrics — weight, height, body fat history",
  "Workout routines and your full week-by-week workout history",
  "Diet logs, calorie targets, and goals",
  "AI chat conversations and generated routines",
];

export default function DeleteAccountPage() {
  return (
    <LegalShell eyebrow="Account" title="Delete Your Account" updated={LEGAL_UPDATED}>
      <p>
        You can permanently delete your {APP_NAME} account and the data attached to it at any
        time. This action is irreversible — once it&apos;s done, there&apos;s no way to recover
        your routines, history, or logs.
      </p>

      <h2>Option 1 — Delete in the app</h2>
      <p>
        Open Calory, go to <strong>Profile → Delete Account</strong>, and confirm. Your account
        and data are removed right away.
      </p>

      <h2>Option 2 — Request deletion by email</h2>
      <p>
        If you can&apos;t access the app, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Delete my Calory account")}`}>
          {SUPPORT_EMAIL}
        </a>{" "}
        from the address on your account with the subject &ldquo;Delete my Calory account.&rdquo;
        We&apos;ll verify it&apos;s you and confirm once your account has been deleted, generally
        within 30 days.
      </p>

      <h2>What gets deleted</h2>
      <ul>
        {DELETE_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>What we may retain</h2>
      <p>A limited exception applies to:</p>
      <ul>
        {KEEP_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>
        See our <Link href="/privacy">Privacy Policy</Link> for more detail on how we handle your data.
      </p>
    </LegalShell>
  );
}

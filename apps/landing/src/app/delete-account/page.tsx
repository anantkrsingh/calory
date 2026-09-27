import type { Metadata } from "next";
import Link from "next/link";

import { LegalShell } from "@/components/legal-shell";
import { APP_NAME, LEGAL_UPDATED, PLAY_STORE_URL, PUBLISHER_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Delete Your Account — ${APP_NAME} (${PUBLISHER_NAME})`,
  description: `How to permanently delete your ${APP_NAME} account and data. Published by ${PUBLISHER_NAME}.`,
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
    <LegalShell eyebrow="Account & Data Deletion" title="Delete Your Account" updated={LEGAL_UPDATED}>
      <div className="mb-10 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="!mt-0 !text-xl font-bold text-text">Application & Publisher Information</h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="font-medium text-text-secondary">Publisher / Developer</dt>
            <dd className="font-semibold text-text">{PUBLISHER_NAME}</dd>
          </div>
          <div>
            <dt className="font-medium text-text-secondary">Application Name</dt>
            <dd className="font-semibold text-text">{APP_NAME}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-text-secondary">Google Play Store URL</dt>
            <dd className="font-semibold text-brand-accent underline break-all">
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                {PLAY_STORE_URL}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-text-secondary">Support Contact</dt>
            <dd className="font-semibold text-text">
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </dd>
          </div>
        </dl>
      </div>

      <p>
        You can permanently delete your <strong>{APP_NAME}</strong> account and all data attached to it at any
        time. {APP_NAME} is developed and published by <strong>{PUBLISHER_NAME}</strong>. You can find our app on the{" "}
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
          Google Play Store
        </a>.
      </p>
      <p>
        Account deletion is irreversible — once confirmed, there is no way to recover your workout routines, exercise history, calorie tracking logs, or AI coach conversations.
      </p>

      <h2>Option 1 — Delete in the app</h2>
      <p>
        Open <strong>{APP_NAME}</strong> on your mobile device, go to <strong>Profile → Delete Account</strong>, and confirm your request. Your account and personal data will be removed immediately.
      </p>

      <h2>Option 2 — Request deletion by email / web</h2>
      <p>
        If you can&apos;t access the app or have uninstalled it, you can request account deletion by sending an email to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Delete my ${APP_NAME} account`)}`}>
          {SUPPORT_EMAIL}
        </a>{" "}
        from the email address associated with your {APP_NAME} account. Please use the subject line &ldquo;Delete my {APP_NAME} account.&rdquo; Our team at {PUBLISHER_NAME} will verify your identity and process the deletion, generally within 30 days.
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
        For further details on how {PUBLISHER_NAME} collects and handles your data, please see our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalShell>
  );
}


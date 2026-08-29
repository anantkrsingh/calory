import type { Metadata } from "next";
import Link from "next/link";

import { LegalShell } from "@/components/legal-shell";
import { APP_NAME, LEGAL_UPDATED, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — Calory",
  description: "How Calory collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalShell eyebrow="Legal" title="Privacy Policy" updated={LEGAL_UPDATED}>
      <p>
        This Privacy Policy explains what information {APP_NAME} (&ldquo;{APP_NAME}&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects when you use the Calory mobile app and this
        website, how we use it, and the choices you have — including deleting your account and
        data at any time.
      </p>
      <p>
        This is a template policy provided for transparency, not a substitute for legal advice;
        have it reviewed against your specific launch markets before relying on it.
      </p>

      <h2>1. Information We Collect</h2>
      <h3>Account information</h3>
      <p>
        When you sign up or sign in, we collect your name, email address, and profile photo,
        whether you register directly or through Google Sign-In or Facebook Login.
      </p>
      <h3>Health and fitness data</h3>
      <p>You choose to share fitness data so Calory can build and track your plan, including:</p>
      <ul>
        <li>Body metrics — weight, height, and body fat percentage</li>
        <li>Workout data — routines, exercises, sets, and your weekly workout history</li>
        <li>Diet and nutrition logs, calorie targets, and goals</li>
        <li>Step counts, read from your device&apos;s motion sensors if you grant permission</li>
      </ul>
      <h3>AI coach conversations</h3>
      <p>
        Messages you send to Calory&apos;s AI chat coach, and the routines, quotes, and responses
        it generates for you, are stored so your coach has context across sessions.
      </p>
      <h3>Usage and device data</h3>
      <p>
        We use Firebase to collect basic analytics and crash diagnostics (device type, app
        version, and general usage events) to keep Calory reliable and improve it over time.
      </p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To create and secure your account, and authenticate you on future visits</li>
        <li>To generate personalized workout routines, calorie targets, and AI coach responses</li>
        <li>To track and display your progress, history, and goals back to you</li>
        <li>To diagnose crashes, fix bugs, and improve app performance</li>
        <li>To respond to support requests, including account-deletion requests</li>
      </ul>

      <h2>3. AI Processing</h2>
      <p>
        To generate routines, calorie targets, and chat responses, Calory sends the relevant
        parts of your fitness data and messages to third-party AI providers (such as OpenAI or
        Google Gemini) for processing. These providers process your data solely to return a
        response to Calory and do not use it to advertise to you.
      </p>

      <h2>4. Third-Party Services</h2>
      <p>Calory relies on the following third-party services, each governed by its own privacy policy:</p>
      <ul>
        <li><strong>Firebase</strong> (Google) — authentication, analytics, and crash reporting</li>
        <li><strong>Google Sign-In</strong> and <strong>Facebook Login</strong> — optional sign-in methods</li>
        <li><strong>OpenAI / Google Gemini</strong> — AI-generated routines and chat coaching</li>
        <li>Cloud image storage — for profile photos you choose to upload</li>
      </ul>
      <p>We do not sell your personal information to third parties.</p>

      <h2>5. Data Retention</h2>
      <p>
        We keep your account and fitness data for as long as your account is active, so Calory
        can keep building on your history. If you delete your account, we remove your personal
        data as described in our{" "}
        <Link href="/delete-account">Delete Account</Link> page, aside from anything we&apos;re
        required to retain by law.
      </p>

      <h2>6. Your Rights and Choices</h2>
      <ul>
        <li>Access, correct, or export the data in your profile from within the app</li>
        <li>Withdraw sign-in permissions (Google/Facebook) from your account provider at any time</li>
        <li>Delete your account and associated data — see <Link href="/delete-account">Delete Account</Link></li>
      </ul>

      <h2>7. Data Security</h2>
      <p>
        We use industry-standard safeguards — including encryption in transit and access
        controls on our backend — to protect your data. No method of transmission or storage is
        completely secure, so we can&apos;t guarantee absolute security.
      </p>

      <h2>8. Children&apos;s Privacy</h2>
      <p>
        Calory is not directed at children under 13, and we do not knowingly collect personal
        information from them. If you believe a child has provided us data, contact us and
        we&apos;ll remove it.
      </p>

      <h2>9. International Data Transfers</h2>
      <p>
        Your data may be processed in countries other than your own, including the countries
        where our hosting and AI providers operate. We take steps to ensure it&apos;s handled
        consistently with this policy wherever it&apos;s processed.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this policy as Calory evolves. We&apos;ll update the &ldquo;Last
        updated&rdquo; date above, and for material changes we&apos;ll make reasonable efforts to
        notify you in the app.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        Questions about this policy or your data? Email us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalShell>
  );
}

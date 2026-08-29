import type { Metadata } from "next";
import Link from "next/link";

import { LegalShell } from "@/components/legal-shell";
import { APP_NAME, LEGAL_UPDATED, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service — Calory",
  description: "The terms that govern your use of the Calory app and website.",
};

export default function TermsPage() {
  return (
    <LegalShell eyebrow="Legal" title="Terms of Service" updated={LEGAL_UPDATED}>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the {APP_NAME} mobile app
        and this website (together, the &ldquo;Service&rdquo;). By creating an account or using
        the Service, you agree to these Terms.
      </p>
      <p>
        This is a template and not a substitute for legal advice; have it reviewed before relying
        on it for your launch markets.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 13 years old to use Calory. If you are under the age of majority in
        your jurisdiction, you confirm you have a parent or guardian&apos;s permission to use the
        Service.
      </p>

      <h2>2. Your Account</h2>
      <p>
        You&apos;re responsible for the accuracy of the information you provide and for keeping
        your login credentials secure. Let us know right away if you suspect unauthorized access
        to your account.
      </p>

      <h2>3. Not Medical Advice</h2>
      <p>
        Calory&apos;s workout routines, calorie targets, and AI coach responses are generated for
        general fitness guidance only — they are not medical advice and are not a substitute for
        consultation with a qualified physician, dietitian, or trainer. Talk to a healthcare
        professional before starting any new exercise or nutrition program, especially if you
        have a pre-existing condition.
      </p>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose or in violation of these Terms</li>
        <li>Attempt to gain unauthorized access to other accounts, our systems, or networks</li>
        <li>Interfere with or disrupt the integrity or performance of the Service</li>
        <li>Reverse engineer, scrape, or misuse the Service or its AI features</li>
      </ul>

      <h2>5. Your Content</h2>
      <p>
        You retain ownership of the data you log — your workouts, meals, metrics, and chat
        messages. By using the Service, you grant us a limited license to store and process that
        content solely to provide and improve the Service, including generating your routines and
        AI responses as described in our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>6. AI-Generated Content</h2>
      <p>
        Routines, targets, quotes, and chat responses are generated automatically and may
        occasionally be inaccurate or unsuitable for your specific circumstances. Use your own
        judgment, and stop any activity that causes pain or discomfort.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        The Service, including its design, branding, and underlying software, is owned by us or
        our licensors and protected by intellectual property laws. These Terms don&apos;t grant
        you any rights to our trademarks or branding.
      </p>

      <h2>8. Termination</h2>
      <p>
        You may stop using the Service and delete your account at any time — see{" "}
        <Link href="/delete-account">Delete Account</Link>. We may suspend or terminate access to
        the Service if you violate these Terms.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We don&apos;t
        guarantee the Service will be uninterrupted, error-free, or that it will produce any
        particular fitness or health outcome.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, we are not liable for any indirect, incidental,
        or consequential damages arising from your use of the Service, including any injury
        resulting from workouts or dietary guidance obtained through the app.
      </p>

      <h2>11. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. We&apos;ll update the &ldquo;Last
        updated&rdquo; date above, and continued use of the Service after changes take effect
        means you accept the revised Terms.
      </p>

      <h2>12. Contact Us</h2>
      <p>
        Questions about these Terms? Email us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalShell>
  );
}

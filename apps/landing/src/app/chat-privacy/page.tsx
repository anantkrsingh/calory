import type { Metadata } from "next";

import { LegalShell } from "@/components/legal-shell";
import { APP_NAME, LEGAL_UPDATED, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Chat Privacy Policy — ${APP_NAME}`,
  description: "How Fit Crate processes data used by its AI coach.",
};

export default function ChatPrivacyPage() {
  return (
    <LegalShell eyebrow="Privacy" title="Chat Privacy Policy" updated={LEGAL_UPDATED}>
      <p>This policy explains the information used when you use the Fit Crate AI coach.</p>
      <h2>What we process</h2>
      <p>We process your chat messages and relevant profile, workout, nutrition, and goal data to understand your request and personalize the response.</p>
      <h2>Third-party AI providers</h2>
      <p>We send the minimum relevant content to our configured AI provider, such as OpenAI or Google Gemini. The provider processes it to return a response to Fit Crate. We do not use chat content to serve advertising.</p>
      <h2>Storage and deletion</h2>
      <p>Chat messages and responses are stored in your account so you can revisit conversations. You can delete individual conversations in the app, or delete your account to request deletion of associated data.</p>
      <h2>Your choice</h2>
      <p>You must agree to this policy before using chat. You can stop using the coach at any time. Questions can be sent to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    </LegalShell>
  );
}

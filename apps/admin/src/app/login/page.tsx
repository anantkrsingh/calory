import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — Fitness Admin",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-neutral-900">Fitness Admin</h1>
        <p className="mb-6 text-sm text-neutral-500">Sign in with your admin account</p>
        <LoginForm />
      </div>
    </div>
  );
}

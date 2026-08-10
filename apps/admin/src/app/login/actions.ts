"use server";

import type { AuthSession } from "@fitness/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, apiFetchPublic } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let session: AuthSession;
  try {
    session = await apiFetchPublic<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { error: "Invalid email or password." };
    }
    return { error: "Could not reach the server. Please try again." };
  }

  if (session.user.role !== "admin") {
    return { error: "This account does not have admin access." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/users");
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE } from "@/lib/session";

/**
 * Clears the (invalid/expired) session cookie before sending the browser to
 * /login. Dashboard layout auth failures must redirect here rather than
 * straight to /login — a Server Component can't delete cookies itself, and
 * without clearing it the proxy still sees the cookie present and bounces
 * /login back to /users, causing ERR_TOO_MANY_REDIRECTS.
 */
export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

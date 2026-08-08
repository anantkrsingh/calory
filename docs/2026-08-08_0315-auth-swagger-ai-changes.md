# Social Login, Swagger, OTP Registration & AI SDK

**Date:** 2026-08-08 03:15

## Summary

Added Google/Facebook/X sign-in end to end, OpenAPI docs for every endpoint,
an OTP-gated registration flow, and the Vercel AI SDK configured for Gemini.

---

## 1. Social login

### API

`POST /auth/google`, `/auth/facebook`, `/auth/x` — all three route through one
`AuthService.loginSocial(provider, input)`.

Each provider is verified against its own public endpoint rather than through an
SDK: Google's `tokeninfo` (signature + `aud` check), Facebook's `debug_token`,
and for X a server-side PKCE code exchange. X's exchange needs the client secret,
which is why the app sends the authorization code instead of a token.

Account matching order is **provider subject first, then verified email**. An
account originally created with email/password is therefore adopted by the
provider instead of colliding with it. An *unverified* provider email may never
claim an existing account — that would be an account-takeover path.

| File | Change |
|---|---|
| `apps/api/src/auth/social-providers.ts` | New. Per-provider verification. |
| `apps/api/src/auth/auth.service.ts` | `loginSocial`; null-password handling in `login`/`changePassword`. |
| `apps/api/src/auth/auth.controller.ts` | Three endpoints. |
| `packages/db/prisma/schema.prisma` | `AuthProvider` enum, `LinkedAccount` type, `passwordHash` now optional. |
| `packages/types/src/auth.ts` | `SocialProfile`. |
| `packages/validation/src/auth.ts` | `socialLoginSchema`. |

### Mobile

Google and Facebook use native SDKs; X uses browser PKCE because **no maintained
native X SDK exists** — every candidate depends on TwitterKit, which Twitter
retired years ago.

| File | Change |
|---|---|
| `apps/mobile/src/lib/social-auth.ts` | New. Per-provider OAuth flows. |
| `apps/mobile/src/hooks/use-social-login.ts` | New. Shared sign-in handler. |
| `apps/mobile/src/services/auth.service.ts` | `loginGoogle` / `loginFacebook` / `loginX`. |
| `apps/mobile/src/queries/auth.queries.ts` | `useSocialLogin` mutation. |
| `apps/mobile/src/app/auth/login.tsx` | Buttons wired under the divider. |
| `apps/mobile/src/app/auth/welcome.tsx` | Existing no-op buttons wired. |
| `apps/mobile/app.config.js` | New. Adds the Facebook plugin only when its env vars exist. |

Both SDKs are loaded with dynamic `import()` inside their own function. A
top-level import crashes at module load, because the Facebook SDK throws unless
`initializeSDK()` has already run.

**Android package renamed** `com.fitness.app` → `com.calory.fitness`: the old
identifier was already registered in another Google Cloud project, so no Android
OAuth client could be created for it, and Google Play Services returned
`DEVELOPER_ERROR`.

## 2. Swagger

Served at `/api/docs` (JSON at `/api/docs-json`), disabled in production unless
`SWAGGER_ENABLED=true`.

Everything is generated from Zod via Zod 4's native `z.toJSONSchema`, so no
`zod-to-openapi` dependency was needed:

- `ApiZodBody` / `ApiZodQuery` — request schemas from the *same* schemas the
  validation pipes enforce, so docs cannot drift from the rules.
- `ApiZodResponse` — response schemas, with `paginated` and `isArray` options.
- `registerSchema` — a registry so each entity appears once under
  `components.schemas` and is referenced by `$ref`, which is what makes the spec
  usable for client generation.

Response shapes live in `packages/validation/src/responses.ts`, built from the
existing enum and primitive schemas. Four carry a `Response` suffix
(`workoutSetResponseSchema` and friends) because the un-suffixed names already
exist as *input* schemas.

`main.ts` merges the registry into the document and auto-adds a `401` referencing
`ApiError` to every secured operation, rather than annotating 40+ handlers.

Coverage across all nine controllers:

| | Value |
|---|---|
| Operations | 54 |
| With a response schema | 53 |
| Named schemas in `components.schemas` | 22 |
| Single-response-code operations | 3 |

The three remaining are `DELETE` endpoints returning 204 with no body.

## 3. OTP-gated registration

`POST /auth/register` now accepts an optional `profile` and `measurement`,
upserts the user with `emailVerified: false`, saves the measurement, queues the
OTP, and returns `{ userId, email, emailVerified, otpSent }` — **no tokens**.

`POST /auth/verify-registration` verifies the code, sets `emailVerified: true`,
and returns the full session.

Upsert rather than create, so an abandoned unverified signup can be retried
instead of failing on the unique email constraint. The duplicate-email check and
the flag update both live in `OtpService`, so `/otp/send` and `/otp/verify` get
the same behaviour as the auth routes.

> **Breaking:** `register` returns `PendingVerification`, not `AuthSession`. The
> mobile register call must be updated when that screen is wired.

## 4. AI SDK

`packages/ai` wraps the Vercel AI SDK (`ai` + `@ai-sdk/google`) and exports a
`gemini()` factory. `AiModule` provides the model as `LanguageModel | null`;
`requireModel()` throws a 503 at point of use when no API key is set.

**No feature calls it yet** — the package is available, nothing consumes it.

## Tests

`apps/api/src/auth/auth.social.spec.ts` (10) and
`apps/api/src/queues/otp.service.spec.ts` (6) — 16 passing. They cover the
account-matching rules and the OTP verification path, both security-relevant.

**Verified on a physical device:** Google sign-in completes end to end — native
account picker, `idToken` returned, request reaching the API. Facebook and X are
implemented and compile but have not been exercised, since neither has
credentials configured yet.

## Configuration

New keys are documented in `apps/api/.env.example` and `apps/mobile/.env.example`.

Google needs **two** OAuth clients: a Web client (its id goes in
`EXPO_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_IDS`) and an Android client
(package + SHA-1, id referenced nowhere but required by Play Services).

Provider secrets belong in the API `.env` only — `EXPO_PUBLIC_*` values are
compiled into the app bundle.

## Building the mobile app

Expo Go cannot run this project any more: it has no way to load the native auth
modules. Use the dev client built by `npx expo run:android`, and press `s` in
Metro if it switches back to Expo Go mode.

A rebuild is only needed when native dependencies or `app.json` native settings
change — and when either `EXPO_PUBLIC_FACEBOOK_*` value changes, since the config
plugin bakes those into the build. JS edits hot-reload as usual.

Requires JDK 17+ (Gradle 9.3.1 refuses JVM 11) and `ANDROID_HOME`. After renaming
the package, `android/build/generated/autolinking/` must be deleted too — it
caches the old identifier and regenerates a Java file that will not compile.

## Known gaps

- **Web** — Google's web support is paywalled and `react-native-fbsdk-next` has no
  web build, so social login is Android/iOS only. X would still work on web. A
  `social-auth.web.ts` using the browser flow would restore it; Metro picks the
  file per platform, so nothing else would change.
- **Native SDK vs `expo-auth-session`** — Google is on the native SDK because a
  Web OAuth client rejects the `mobile://` redirect ("must contain a domain").
  That decision is reversible. Google *does* accept `http://localhost` redirects,
  and an HTTPS callback on the deployed API would work as well, so a
  browser-based flow remains viable — it would cost a callback endpoint, CSRF
  state handling, and the browser UX, but would drop the native dependency and
  work on web. Not worth revisiting while Android is the only target.
- **OTP storage** is an in-memory `Map` (pre-existing): it does not survive a
  restart and will not work across multiple API instances. Needs Redis before
  production.
- **`react-native-fbsdk-next`** has no new-architecture support and runs through
  RN's legacy interop layer. It compiles and links, but the Facebook flow has not
  been exercised end to end.
- **X** returns no email without elevated API access; new accounts get a 409 in
  that case.
- Pre-existing `TS6059` in `pnpm typecheck` (`app.e2e-spec.ts` outside `rootDir`)
  is unrelated to these changes.

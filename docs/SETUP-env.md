# Environment setup

The API and the worker each validate their own env schema
(`apps/api/src/config/env.ts` and `apps/worker/src/config/env.ts`, kept in
sync by hand) and fail fast at boot, listing every problem at once. Each app
has its own `.env`, and both need the shared values — `MONGODB_URI` and
`JWT_SECRET` in one file are not visible to the other process.

Copy the examples to start:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/mobile/.env.example apps/mobile/.env
```

## Only two values are mandatory

Everything else has a working default or is optional.

| Key | Notes |
|---|---|
| `MONGODB_URI` | Must start with `mongodb://` or `mongodb+srv://`. |
| `JWT_SECRET` | At least 16 characters. |

An unset optional key degrades that one feature rather than breaking the app: no
LLM key means AI calls return 503, no SMTP means OTP emails fail to send, no
Cloudinary means image upload fails.

## AI / LLM

```env
LLM_PROVIDER=openai        # openai | gemini
LLM_MODEL=                 # blank uses the provider default
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
```

Only the **selected** provider needs a key. Defaults are `gpt-4.1-mini` for
OpenAI and `gemini-2.5-flash` for Gemini.

Set these in **both** `apps/api/.env` and `apps/worker/.env` — the worker is the
process that actually calls the model, so a key present only on the API side
leaves quote and routine generation broken.

- OpenAI key: <https://platform.openai.com/api-keys>
- Gemini key: <https://aistudio.google.com/apikey>

Switching provider needs no code change, only a restart.

## Daily quote schedule

```env
QUOTE_CRON=0 3 * * *
QUOTE_TIMEZONE=UTC
```

Read by the worker. The default runs at 03:00 UTC daily. The worker also
backfills today's quote on startup, so you do not have to wait for a cron tick to
see one.

## Redis

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

Required for anything queued: OTP email, quote generation, routine generation.
Without Redis the API still serves requests — jobs simply never run, and
registration completes without a routine.

## SMTP

Needed for OTP email during registration. Defaults point at `localhost:587`,
which will fail unless something is listening. For Gmail use an App Password,
not your account password.

## Social login

`GOOGLE_CLIENT_IDS` is comma-separated, checked against the `aud` claim of the
incoming ID token — every client id that can mint a token must be listed. The
Facebook and X secrets belong here and **never** in the mobile `.env`, since
`EXPO_PUBLIC_*` values are compiled into the app bundle.

An unset provider returns 501 from its endpoint rather than failing at boot.

## Verifying it works

```bash
pnpm dev:api        # API on :3000
pnpm dev:worker     # worker, in a second terminal
```

The API prints its listening address; the worker logs the queues it is consuming
and the quote schedule it registered. A bad `.env` fails immediately with every
invalid key listed.

Quick checks:

- `GET /api/docs` — Swagger UI, all endpoints
- `GET /api/v1/health` — reports database reachability
- `GET /api/v1/quotes/today` — 404 until the worker has generated one

## Prompts

The quote and routine prompts are **not** environment variables. They are edited
at runtime through the admin settings endpoint (`PATCH /api/v1/settings`,
`@Roles('admin')`) under `aiPrompts`, keyed `quoteOfTheDay` and `workoutRoutine`.
Leave a key unset to use the built-in default from `packages/ai/src/prompts.ts`.

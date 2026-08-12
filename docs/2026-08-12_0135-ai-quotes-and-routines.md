# Daily Quotes, AI Workout Routines & Multi-Provider LLM

**Date:** 2026-08-12 01:35

## Summary

Three backend/worker features: a scheduled motivational quote, an AI-generated
weekly workout routine per user, and provider-selectable LLM support (OpenAI or
Gemini) driven from `.env`.

Nothing in the mobile app changed.

---

## 1. Multi-provider LLM

`packages/ai` now exposes `createModel({ provider, apiKey, model })` instead of a
Gemini-only factory. The provider comes from `LLM_PROVIDER` (default `openai`),
and `LLM_MODEL` overrides the per-provider default.

Only the selected provider needs a key. Without one the model resolves to `null`
and both apps still boot — AI calls fail at point of use, not at startup.

| File | Change |
|---|---|
| `packages/ai/src/provider.ts` | New. `createModel`, `LLM_PROVIDERS`, `DEFAULT_MODELS`. |
| `packages/ai/src/gemini.ts` | Removed, superseded by `provider.ts`. |
| `apps/api/src/ai/ai.module.ts` | Builds the model from env. |
| `apps/worker/src/ai/ai.module.ts` | New. Same wiring for the worker. |

> **Version note:** `@ai-sdk/openai` is pinned to the **2.x** line. The 4.x
> releases implement provider spec v4, while `ai@5` and `@ai-sdk/google@2` use
> spec v2 — mixing them fails to compile.

## 2. Quote of the day

`QuoteProcessor` registers a BullMQ job scheduler on boot (`QUOTE_CRON`, default
`0 3 * * *` in `QUOTE_TIMEZONE`). Each run generates one quote and upserts it
against a UTC calendar date, which is unique in the schema — so a day can only
ever hold one quote, and a duplicate run is a no-op.

It also backfills on startup, so a fresh deploy has a quote without waiting for
the first cron tick.

`GET /quotes/today` returns today's quote, falling back to the most recent one if
today's has not been generated yet.

## 3. Weekly workout routine

On **email verification** and on **social signup** the API creates a
`WorkoutRoutine` row with `status: "generating"` and queues a job. Generation is
deliberately *not* triggered at `POST /auth/register`, because an unverified
account may never be completed.

The worker gives the model two tools:

- `getUserDetails` — age derived from date of birth, sex, height, activity level,
  and the most recent weight / body-fat measurement.
- `listExercises` — the shared catalogue plus the user's own custom exercises,
  filterable by muscle group and equipment.

`generateObject` accepts no tools in AI SDK 5, so the processor runs
`generateText` with the tools first, then feeds the collected tool results into
`generateObject` with `weeklyRoutineSchema` for structured output.

### Status enum

| Status | Meaning |
|---|---|
| `generating` | Row created, job queued or running. |
| `active` | Generation succeeded. |
| `failed` | All BullMQ retries exhausted; `error` holds the reason. |
| `superseded` | Replaced by a newer generation request. |

### Endpoints

- `GET /workout-routines/me` — current routine, whatever its status.
- `POST /workout-routines/regenerate` — queues a fresh one (202).

## 4. Prompts

Both prompts are admin-configurable through the **existing** settings module —
`AppSettings.aiPrompts`, already guarded by `@Roles('admin')`. No new admin
surface was added.

`resolvePrompt(key, configured)` in `packages/ai` returns the admin value for a
key, or the built-in default when unset or blank. Keys: `quoteOfTheDay`,
`workoutRoutine`.

## Data model

New Prisma models `DailyQuote` and `WorkoutRoutine`, the
`WorkoutRoutineStatus` enum, and composite types `RoutinePlanDay` /
`RoutinePlanExercise`. Mappers and response schemas follow the existing patterns
in `packages/db` and `packages/validation`.

## Fail-safe behaviour

Each of these was a bug found while reviewing, not a precaution added upfront:

- **Registration never blocks on AI.** `requestGeneration` catches everything and
  returns `null`; a queue outage still lets the user sign in.
- **The previous routine survives a queue failure.** The old routine is only
  marked `superseded` *after* the new job is accepted, so losing Redis cannot
  leave a user with no routine.
- **Retries are respected.** The `failed` handler only writes `status: failed`
  once BullMQ has exhausted its attempts, not on the first error.
- **Superseded routines stay superseded.** Both the success and failure writes
  use `updateMany` guarded on `status: 'generating'`, so a routine replaced
  mid-generation is never resurrected.
- **Hallucinated exercise ids are dropped.** Ids the model returns are checked
  against the database before the routine is persisted.
- **One job per routine.** The BullMQ `jobId` is keyed on the routine id, so a
  retry cannot enqueue a duplicate.

## Verification

Typecheck clean across the monorepo and 18/18 API tests pass, including two new
cases covering the routine hook (queued on verification; session still issued
when queueing fails).

The pre-existing `TS6059` (`app.e2e-spec.ts` outside `rootDir`) is unrelated.

> **Not yet exercised against a real LLM** — there is no API key configured, so
> the generation path is verified by types and unit tests only. Expect to tune
> the prompts once you see real output.

## Configuration

See [`SETUP-env.md`](./SETUP-env.md).

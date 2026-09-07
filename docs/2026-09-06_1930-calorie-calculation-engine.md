# Calorie Calculation Engine

**Date:** 2026-09-06 19:30

## Summary

A deterministic calorie engine replacing the numbers the LLM used to invent,
with every constant admin-configurable per exercise category from the admin
panel.

Method follows what the research and mainstream fitness apps converge on:
a **Mifflin-St Jeor** BMR, scaled to TDEE by habitual activity, with
per-activity burn from **MET values** taken from the
[2024 Adult Compendium of Physical Activities](https://pacompendium.com/adult-compendium/).

---

## The problem

Every calorie figure in the app was a model guess. `WorkoutRoutine.dailyCalorieTarget`,
`RoutineDay.targetCaloriesBurned`, `RoutineDayExercise.estimatedCalories` and
`DietDay.targetCalories` were all written by the LLM during generation, so the
same user got different targets on each regeneration, and two users with
identical bodies got different numbers.

Three gaps besides:

- **No BMR/TDEE anywhere** — a repo-wide grep for `bmr`/`tdee`/`mifflin` found nothing.
- **Steps were tracked** (`DailySteps`) but never converted to calories.
- **`DailyMealLog.takenItemIds`** recorded which meal items were eaten, but
  nothing ever totalled them — the app could not say how much you had consumed.

## Why this method

Research on how fitness apps do this in 2026 points consistently at two things:

1. **Mifflin-St Jeor** is "the most broadly accurate option for healthy adults"
   — more accurate than Harris-Benedict for contemporary body compositions.
2. **MET-based per-activity burn** layered on BMR is "what every credible
   peer-reviewed study uses", drawing values from the 2024 Compendium (1114
   activities, 303 new codes over the 2011 edition).

The common criticism of static activity multipliers — that 1.2/1.375/1.55
"rarely matches individual daily patterns" — is why burn here comes from
*actually logged* sets and steps rather than from the multiplier alone.

---

## The engine

`packages/types/src/calories.ts` — pure functions, no I/O, imported by the API,
the worker and the mobile app so all three agree on any given number.

| Function | What it does |
|---|---|
| `calculateBmr` | Mifflin-St Jeor. |
| `calculateTdee` | BMR × activity multiplier. |
| `calculateCalorieTarget` | TDEE adjusted per `FitnessGoal`, floored at a safe minimum. |
| `caloriesFromSteps` | Bodyweight-scaled step burn. |
| `caloriesForExercise` | MET formula: `kcal/min = MET × 3.5 × kg / 200`. |
| `energyProfile` | BMR + TDEE + target together, all `null` when inputs are insufficient. |
| `calculateBmi`, `bmiCategory`, `yearsSince` | Moved here from three duplicate copies. |

Every function takes an optional `CalorieConfig` — the admin overrides.

### Default MET values, and where they come from

| Category | MET | Compendium activity |
|---|---|---|
| `strength` | 5.0 | resistance training, squats/deadlift, slow or explosive |
| `cardio` | 7.3 | aerobic, general |
| `duration` | 3.8 | home exercise, general |
| `reps` | 3.8 | calisthenics, moderate effort (pushups, sit-ups) |

Deliberately mid-range. Over-crediting burn is worse than under-crediting it for
someone eating to a deficit.

### Decisions worth knowing

- **`other`/`prefer_not_to_say` take the midpoint** of the two Mifflin sex
  constants (−78) rather than defaulting to male, which would overstate BMR by
  ~166 kcal for a large slice of users.
- **Conflicting goals average** rather than one winning — `lose_weight` +
  `build_muscle` gives −5%, not −20%.
- **A safe intake floor** (1200 kcal female / 1500 male) applies *after* the
  deficit maths, so an aggressive cut can never prescribe a dangerous target.
- **Rest between sets counts at 25%**, not zero — the body is still elevated,
  and ignoring it makes strength work look implausibly cheap next to cardio.
- **BMR-derived fields are `null`, not `0`**, until the profile carries height,
  weight, date of birth and sex, so the app can tell "no data" from "zero" and
  prompt for the missing fields instead of showing a wrong target.

---

## Admin control

Every constant is overridable from **Admin → Settings → Calorie calculation**,
stored on the existing one-row `AppSettings` document.

| Group | Controls |
|---|---|
| **MET per exercise category** | One field per `ExerciseCategory` — the per-category control. |
| **Activity multiplier** | One per `ActivityLevel` (BMR → TDEE). |
| **Goal adjustment** | One per `FitnessGoal`, as a fraction of TDEE. |
| **Other constants** | kcal/step/kg, seconds per set, default rest, rest MET fraction, minimum intake (male/female). |

Design points:

- **A blank field means "use the researched default"** — not zero. Only keys the
  admin actually filled in are persisted, so partial configuration is safe and
  an empty config is valid and correct.
- Each row shows its **default and its source** (e.g. "Compendium: aerobic,
  general — default 7.3"), so an override is a deliberate decision.
- Zod bounds every value: MET 1–20, multipliers 1–3, goal adjustments ±0.5,
  intake floors 800–4000. A typo cannot produce a dangerous target.

### Storage shape

The engine keys overrides by enum (`Partial<Record<ExerciseCategory, number>>`),
but Mongo composite types have fixed fields, so Prisma stores them as lists
(`CategoryMetConfig[]` etc.). `toCalorieConfig` in `@fitness/db` converts on
read; `toStoredCalorieConfig` in `SettingsService` converts on write.

---

## `GET /calories`

New module `apps/api/src/calories/`, following the existing controller/service/
module convention with Zod schemas in `@fitness/validation`.

| Route | Returns |
|---|---|
| `GET /calories/today/:date` | One day's `CalorieBalance`. |
| `GET /calories/range?from&to` | One `CalorieBalance` per day. |

`CalorieBalance` carries `bmr`, `tdee`, `targetCalories`, `consumedCalories`
(+ protein/fat/carbs), `burnedFromExercise`, `burnedFromSteps`, `burnedTotal`,
`netCalories` and `remainingCalories`.

Intake is summed from the diet items in `DailyMealLog.takenItemIds` — which is
what finally gives that field meaning. Burn is MET-scored from **completed sets
only**, using each exercise's `category` from the catalogue.

`getRange` loads everything in one `Promise.all` and folds per date, so a week
costs the same handful of queries a single day does.

## AI now gets told, not asked

Both generators and the chat agent expose the computed figures through their
`getUserDetails` tool, with the tool description instructing the model to quote
them rather than estimate:

- `apps/worker/src/queues/routine.processor.ts` → `bmr`, `tdee`, `dailyCalorieTarget`
- `apps/worker/src/queues/diet-plan.processor.ts` → same
- `apps/api/src/chats/chats.service.ts` → `bmr`, `tdee`, `targetCalories`

Each reads the admin config, so a tuned constant reaches the AI too.

The AI still chooses *what* to eat and *which* exercises to do. The formulas
decide *how many calories* that is.

## Duplicates removed

`calculateBmi`, `yearsSince` and `bmiCategory` existed three times each, all
copy-pasted. Now imported from `@fitness/types`. The shared `yearsSince` also
fixes a latent bug: the local copies used `new Date(isoDate)`, which parses
`YYYY-MM-DD` in local time and can land a day early west of UTC; the shared one
parses as UTC.

## Mobile

| File | Purpose |
|---|---|
| `src/services/calories.service.ts` | API client. |
| `src/queries/calories.queries.ts` | `useCalorieBalance`, `useCalorieRange`. |
| `src/components/diet/CalorieBalanceCard.tsx` | Eaten vs target, burn breakdown, BMR/TDEE footnote. |

Rendered at the top of the **Metrics** tab on the Diets screen — above the
plan's macro targets. Targets are the plan; this card is the reality. Marking a
meal item taken invalidates the day's balance, so the card tracks every tick.

The integration into `diets.tsx` is purely additive: the existing Today/Metrics/
Plan switcher, week selector, skeletons and `Stat` row are unchanged.

## Tests

`apps/api/src/calories/calories.spec.ts` — 17 assertions in two suites:

- **calorie engine** (11) — the published Mifflin-St Jeor worked example
  (80 kg / 180 cm / 30 y male → 1780 kcal), goal adjustments, the safe floor,
  cardio scoring above strength for equal duration, null-profile handling.
- **admin calorie config** (6) — a per-category MET override changing only that
  category, activity/goal/floor overrides, step and set-timing overrides, and an
  empty config falling back to every default.

---

## Verification

- `pnpm build`: 9/9 packages.
- `@fitness/api`: 44/44 tests pass (17 new); `tsc --noEmit` clean; lint clean.
- `@fitness/worker`: `tsc --noEmit` clean; lint clean.
- `@fitness/admin`: `tsc --noEmit` clean; lint clean.

### Teammate's work preserved

`premium.tsx`, `purchases.ts`, `purchases.queries.ts`, `PremiumUpsellCard.tsx`
and `diet-preferences.tsx` are byte-for-byte unmodified. The only shared file
touched is `diets.tsx`, additively (+23/−7).

---

## Migration note

`AppSettings.calorieConfig` is optional and absent on existing rows, so no data
migration is needed — every user gets the researched defaults until an admin
overrides something. Run `pnpm db:generate` after pulling, since the Prisma
schema gained the `CalorieConfig` composite types.

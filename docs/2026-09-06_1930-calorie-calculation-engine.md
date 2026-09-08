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
- `@fitness/api`: 54/54 tests pass (27 new); `tsc --noEmit` clean; lint clean.
- `@fitness/worker`: `tsc --noEmit` clean; lint clean.
- `@fitness/admin`: `tsc --noEmit` clean; lint clean.

### Teammate's work preserved

`premium.tsx`, `purchases.ts`, `purchases.queries.ts`, `PremiumUpsellCard.tsx`
and `diet-preferences.tsx` are byte-for-byte unmodified. The only shared file
touched is `diets.tsx`, additively (+23/−7).

---

## Adaptive TDEE (added 2026-09-08)

The formula estimate rests on a self-reported activity multiplier, and research
notes these "rarely match individual daily patterns". So expenditure is now
**measured** once there is enough history:

```
observed TDEE = mean daily intake − (weight trend slope kg/day × 7700)
```

If someone eats 2200 kcal and holds weight, their TDEE is 2200 — whatever the
formula said. This self-corrects for a wrong activity level, a slowed
metabolism, or systematic under-logging.

`7700 kcal/kg` is the Wishnofsky (1958) figure every adaptive tracker builds on.

### Method

| Step | Value | Why |
|---|---|---|
| Trend smoothing | EWMA, `alpha = 0.10` | ~1-week half-life: ignores a salty dinner, follows a real trend within days |
| Missing weigh-ins | linear interpolation | a skipped day must not flatten the slope |
| Slope | least-squares over the smoothed trend | robust to a single odd reading |
| Window | 21-day lookback | covers a 14-day measurement regardless of the range requested |
| Minimum data | 7 logged intake days | below this the number is noise, so the formula stands |
| Drift clamp | ±35% of the formula | one mis-logged week nudges the estimate, never runs away |

Unlogged days are excluded rather than counted as zero — a gap in the record is
not a fast.

### Behaviour

- Below 7 logged days: `isAdaptive: false`, formula value used, nothing changes.
- Once adaptive: `tdee` and `targetCalories` are both re-derived from the
  measured figure, so the intake target tracks reality.
- `CalorieBalance.adaptive` exposes `formulaTdee`, `observedTdee`,
  `trendKgPerDay`, `daysOfData` and `clampedTo`, so the difference is inspectable
  rather than hidden.
- The mobile card adds a line once active: *"Measured from 14 days of your own
  weight and intake, trending down 0.42 kg/week."* The weekly rate is shown
  because kg/day is too small to read.

### Data

No schema change — `BodyMeasurement.recordedAt`/`weightKg` and
`DailyMealLog.takenItemIds` already carry everything needed, and
`@@index([userId, recordedAt])` already exists.

### Tests

10 further assertions in `calories.spec.ts`: fallback below the minimum, flat
weight reading intake as maintenance, expenditure rising on a loss and falling
on a gain, the drift clamp, unlogged days ignored, no-baseline case, EWMA
damping, gap interpolation, and empty history.

---

## Off-plan food logging (added 2026-09-08)

### Why

Intake could only be recorded by ticking items in the AI-generated plan. Anything
eaten off-plan — a restaurant meal, a snack, chai — **could not be logged at
all**, which is a hole in its own right and actively breaks adaptive TDEE: the
engine divides by mean daily intake, so unlogged food makes it conclude TDEE is
lower than reality and then sets the target too low.

### Why household portions, not grams

Research into the Indian market (the primary one here) is unambiguous: nobody
weighs home cooking. HealthifyMe — the market leader, ~10,000-item Indian
database built over 12 years — logs *"Dal Makhani — 1 katori"*, not *"247 g"*.
Global apps that ask for grams or barcodes fail on Indian food because it is
overwhelmingly home-cooked and served in mixed plates.

Barcode scanning was considered and rejected as the first step: it has better
raw accuracy (8.7% MAPE vs 18.3% for manual entry) but only works on packaged
food, so it would sit unused for dal and roti.

Reference weights used for the seed (a standard katori is ~150 ml):

| Portion | Weight | Calories |
|---|---|---|
| 1 roti (medium, 8") | ~35 g | 100 |
| 1 katori rice | ~150 g | 200 |
| 1 katori dal | ~150 g | 135 |
| 1 katori sabzi | ~150 g | 110 |
| 1 glass milk | ~200 ml | 130 |

24 items seeded, covering staples, protein, breakfast, drinks, and the usual
under-logged culprits (ghee, sugar, nuts). All admin-editable.

### Data

| Model | Purpose |
|---|---|
| `PortionFood` | The admin-curated catalogue: name, unit, macros per one unit |
| `LoggedPortion` on `DailyMealLog.extraItems` | What was actually eaten |

Macros are **snapshotted onto each log entry**, so an admin retuning the
catalogue later never rewrites what someone already logged. `portionId` is kept
for grouping but is deliberately not a relation — an entry must survive its
catalogue item being deleted.

### Trust boundary

The client sends only `{ portionId, quantity }`. Macros are resolved
server-side from the catalogue in `DietPlansService.logPortion`, so a tampered
request cannot invent nutrition figures.

### API

| Route | Purpose |
|---|---|
| `GET /portions` | The picker's catalogue |
| `POST/PATCH/DELETE /portions[/:id]` | Admin CRUD |
| `POST /diet-plans/today/:date/portions` | Log an off-plan food |
| `DELETE /diet-plans/today/:date/portions` | Remove one entry |

Removing an unknown id is a no-op rather than an error, so a double-tap on a
slow connection cannot fail.

### UI — deliberately minimal

The existing meal checklist is unchanged. Below it sits an `ExtrasCard` that is
a **single "Add something else you ate" row when empty**, so users who follow
their plan exactly see almost nothing new. Tapping it opens a sheet of the
catalogue with +/− steppers — 2-3 taps per meal, no typing, no weighing, no
search. Half-portion steps, since "half a katori" is common.

`CaloriesService` sums `extraItems` into `consumedCalories` and into the
adaptive intake history, so logged extras move both the day's balance and the
measured TDEE.

---

## Migration note

`AppSettings.calorieConfig` is optional and absent on existing rows, so no data
migration is needed — every user gets the researched defaults until an admin
overrides something. Run `pnpm db:generate` after pulling, since the Prisma
schema gained the `CalorieConfig` composite types plus `PortionFood` and
`LoggedPortion`, then `pnpm db:seed` to load the 24-item portion catalogue
(idempotent — existing rows are left alone so admin edits survive a reseed).

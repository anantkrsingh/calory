/**
 * Deterministic calorie maths — the single source of truth for every calorie
 * number in the app. Pure functions, no I/O, so the API, the worker and the
 * mobile app all arrive at the same figure for the same inputs.
 *
 * Method follows what the literature and mainstream fitness apps converge on:
 * a Mifflin-St Jeor BMR, scaled to TDEE by habitual activity, with per-activity
 * burn from MET values (2024 Adult Compendium of Physical Activities).
 *
 * Every constant below is a *default*. Admins override them per category from
 * the admin panel — see `CalorieConfig`, stored on `AppSettings`.
 */

import { ActivityLevel, ExerciseCategory, FitnessGoal, Sex } from './enums';
import type { IsoDate } from './common';

/** Standard BMI = kg / m^2, rounded to one decimal. */
export function calculateBmi(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

/** Whole years since an ISO `YYYY-MM-DD` date of birth, or null if unparseable. */
export function yearsSince(isoDate: IsoDate): number | null {
  const born = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(born.getTime())) return null;
  const ms = Date.now() - born.getTime();
  return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
}

/**
 * Mifflin-St Jeor sex constants. `other`/`prefer_not_to_say` take the midpoint
 * of the two rather than defaulting to male, which would overstate BMR by
 * ~166 kcal for a large slice of users.
 */
const SEX_OFFSET: Record<Sex, number> = {
  [Sex.Male]: 5,
  [Sex.Female]: -161,
  [Sex.Other]: -78,
  [Sex.PreferNotToSay]: -78,
};

/** Conventional activity multipliers applied to BMR to reach TDEE. */
export const DEFAULT_ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.Sedentary]: 1.2,
  [ActivityLevel.Light]: 1.375,
  [ActivityLevel.Moderate]: 1.55,
  [ActivityLevel.Active]: 1.725,
  [ActivityLevel.VeryActive]: 1.9,
};

/**
 * Daily calorie adjustment per goal, as a fraction of TDEE. A 20% deficit and a
 * 10% surplus are the conventional safe rates — roughly 0.5 kg/week down and
 * lean gain up, without the muscle loss a steeper cut causes.
 */
export const DEFAULT_GOAL_ADJUSTMENTS: Record<FitnessGoal, number> = {
  [FitnessGoal.LoseWeight]: -0.2,
  [FitnessGoal.BuildMuscle]: 0.1,
  [FitnessGoal.GainStrength]: 0.05,
  [FitnessGoal.ImproveFitness]: 0,
  [FitnessGoal.StayHealthy]: 0,
  [FitnessGoal.TrainForSport]: 0.05,
};

/**
 * MET values per exercise category, from the 2024 Adult Compendium of Physical
 * Activities (pacompendium.com):
 *
 * - strength → 5.0  "resistance training, squats/deadlift, slow or explosive"
 * - cardio   → 7.3  "aerobic, general"
 * - duration → 3.8  "home exercise, general"
 * - reps     → 3.8  "calisthenics, moderate effort (pushups, sit-ups)"
 *
 * Deliberately mid-range: over-crediting burn is worse than under-crediting it
 * for someone eating to a deficit.
 */
export const DEFAULT_CATEGORY_METS: Record<ExerciseCategory, number> = {
  [ExerciseCategory.Strength]: 5,
  [ExerciseCategory.Cardio]: 7.3,
  [ExerciseCategory.Duration]: 3.8,
  [ExerciseCategory.Reps]: 3.8,
};

/** kcal per step per kg of bodyweight — ~0.04 kcal/step at 70 kg, the figure
 * step trackers converge on, expressed per-kg so it scales with the user. */
export const DEFAULT_KCAL_PER_STEP_PER_KG = 0.04 / 70;

/** Seconds a working set occupies, and the default rest between sets, used when
 * an exercise is prescribed as sets/reps rather than a duration. */
export const DEFAULT_SECONDS_PER_SET = 45;
export const DEFAULT_REST_SECONDS = 60;

/** Rest between sets still burns above resting, but well below the working set
 * itself — counting it at zero makes strength work look implausibly cheap. */
export const DEFAULT_REST_MET_FRACTION = 0.25;

/** Never prescribe below this, whatever the deficit maths says. */
export const DEFAULT_MIN_INTAKE: Record<'male' | 'female', number> = {
  male: 1500,
  female: 1200,
};

/**
 * The admin-tunable half of the engine. Every field is optional: anything unset
 * falls back to the defaults above, so a partially-filled config (or none at
 * all) still produces correct numbers.
 */
export interface CalorieConfig {
  /** MET per exercise category — the per-category admin control. */
  categoryMets?: Partial<Record<ExerciseCategory, number>>;
  /** BMR → TDEE multiplier per activity level. */
  activityMultipliers?: Partial<Record<ActivityLevel, number>>;
  /** TDEE adjustment per fitness goal, as a fraction (-0.2 = 20% deficit). */
  goalAdjustments?: Partial<Record<FitnessGoal, number>>;
  kcalPerStepPerKg?: number;
  secondsPerSet?: number;
  defaultRestSeconds?: number;
  restMetFraction?: number;
  minIntakeMale?: number;
  minIntakeFemale?: number;
}

const metFor = (config: CalorieConfig | undefined, category: ExerciseCategory): number =>
  config?.categoryMets?.[category] ??
  DEFAULT_CATEGORY_METS[category] ??
  DEFAULT_CATEGORY_METS[ExerciseCategory.Reps];

export interface BmrInput {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: Sex;
}

/**
 * Mifflin-St Jeor resting metabolic rate — the modern standard, more accurate
 * than Harris-Benedict for contemporary body compositions.
 */
export function calculateBmr({
  weightKg,
  heightCm,
  ageYears,
  sex,
}: BmrInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(base + SEX_OFFSET[sex]);
}

/** Total daily energy expenditure — BMR scaled by habitual activity. */
export function calculateTdee(
  bmr: number,
  activityLevel: ActivityLevel,
  config?: CalorieConfig,
): number {
  const multiplier =
    config?.activityMultipliers?.[activityLevel] ??
    DEFAULT_ACTIVITY_MULTIPLIERS[activityLevel] ??
    DEFAULT_ACTIVITY_MULTIPLIERS[ActivityLevel.Sedentary];

  return Math.round(bmr * multiplier);
}

/**
 * Daily intake target. Conflicting goals (someone picking both lose_weight and
 * build_muscle) average out rather than cancelling to an arbitrary winner, and
 * the result is floored at a medically safe minimum.
 */
export function calculateCalorieTarget(
  tdee: number,
  goals: readonly FitnessGoal[],
  sex: Sex,
  config?: CalorieConfig,
): number {
  const adjustmentFor = (goal: FitnessGoal): number =>
    config?.goalAdjustments?.[goal] ?? DEFAULT_GOAL_ADJUSTMENTS[goal] ?? 0;

  const adjustment =
    goals.length === 0
      ? 0
      : goals.reduce((sum, goal) => sum + adjustmentFor(goal), 0) / goals.length;

  const target = Math.round(tdee * (1 + adjustment));

  const floor =
    sex === Sex.Female
      ? (config?.minIntakeFemale ?? DEFAULT_MIN_INTAKE.female)
      : (config?.minIntakeMale ?? DEFAULT_MIN_INTAKE.male);

  return Math.max(target, floor);
}

/**
 * Calories burned walking `steps`, scaled by bodyweight. Close enough to
 * MET-based walking estimates without needing the stride length or pace a
 * pedometer never gives us.
 */
export function caloriesFromSteps(
  steps: number,
  weightKg: number,
  config?: CalorieConfig,
): number {
  if (steps <= 0) return 0;
  const perStepPerKg = config?.kcalPerStepPerKg ?? DEFAULT_KCAL_PER_STEP_PER_KG;
  return Math.round(steps * perStepPerKg * weightKg);
}

export interface ExerciseCalorieInput {
  category: ExerciseCategory;
  weightKg: number;
  sets?: number;
  reps?: number;
  durationSec?: number;
  restSeconds?: number;
}

/**
 * MET formula: kcal/min = MET * 3.5 * kg / 200.
 *
 * A prescribed duration is used directly; otherwise the working time is derived
 * from sets and reps, with rest counted at a reduced rate.
 */
export function caloriesForExercise(
  {
    category,
    weightKg,
    sets,
    reps,
    durationSec,
    restSeconds,
  }: ExerciseCalorieInput,
  config?: CalorieConfig,
): number {
  const met = metFor(config, category);
  const perMinute = (met * 3.5 * weightKg) / 200;

  if (durationSec && durationSec > 0) {
    return Math.round(perMinute * (durationSec / 60));
  }

  const setCount = sets && sets > 0 ? sets : 0;
  if (setCount === 0) return 0;

  const secondsPerSet = config?.secondsPerSet ?? DEFAULT_SECONDS_PER_SET;
  const restDefault = config?.defaultRestSeconds ?? DEFAULT_REST_SECONDS;
  const restFraction = config?.restMetFraction ?? DEFAULT_REST_MET_FRACTION;

  // Longer sets for higher rep counts, so 15 reps isn't credited the same as 5.
  const repFactor = reps && reps > 0 ? Math.min(reps / 10, 2) : 1;
  const workSec = setCount * secondsPerSet * repFactor;
  const restSec = Math.max(setCount - 1, 0) * (restSeconds ?? restDefault);

  const workKcal = perMinute * (workSec / 60);
  const restKcal = perMinute * restFraction * (restSec / 60);

  return Math.round(workKcal + restKcal);
}

/** BMR/TDEE/target together, all null when the inputs can't support a BMR.
 * Shared by the chat agent and both AI generators so the model is told the
 * same numbers the app itself uses. */
export function energyProfile(
  input: {
    weightKg: number | null;
    heightCm: number | null;
    ageYears: number | null;
    sex: Sex | null;
    activityLevel: ActivityLevel | null;
    fitnessGoals?: readonly FitnessGoal[] | null;
  },
  config?: CalorieConfig,
): { bmr: number | null; tdee: number | null; targetCalories: number | null } {
  const { weightKg, heightCm, ageYears, sex } = input;

  if (weightKg === null || heightCm === null || ageYears === null || !sex) {
    return { bmr: null, tdee: null, targetCalories: null };
  }

  const bmr = calculateBmr({ weightKg, heightCm, ageYears, sex });
  const tdee = calculateTdee(
    bmr,
    input.activityLevel ?? ActivityLevel.Sedentary,
    config,
  );

  return {
    bmr,
    tdee,
    targetCalories: calculateCalorieTarget(
      tdee,
      input.fitnessGoals ?? [],
      sex,
      config,
    ),
  };
}

/** A single day's energy balance. */
export interface CalorieBalance {
  date: IsoDate;
  /** Resting metabolic rate, null when the profile lacks height/weight/age/sex. */
  bmr: number | null;
  tdee: number | null;
  /** Recommended intake for the user's goals. */
  targetCalories: number | null;
  /** Summed from the diet items marked taken today. */
  consumedCalories: number;
  consumedProteinG: number;
  consumedFatG: number;
  consumedCarbsG: number;
  burnedFromExercise: number;
  burnedFromSteps: number;
  /** Exercise + steps. Excludes BMR, which `netCalories` accounts for via TDEE. */
  burnedTotal: number;
  /** consumed - (tdee + burned). Negative is a deficit. */
  netCalories: number | null;
  /** target - consumed, floored at 0. */
  remainingCalories: number | null;
}

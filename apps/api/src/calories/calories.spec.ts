import {
  ActivityLevel,
  ExerciseCategory,
  FitnessGoal,
  Sex,
  calculateBmi,
  calculateBmr,
  calculateCalorieTarget,
  calculateTdee,
  caloriesForExercise,
  caloriesFromSteps,
  energyProfile,
  adaptiveTdee,
  smoothWeightTrend,
} from '@fitness/types';
import type { CalorieConfig } from '@fitness/types';

describe('calorie engine', () => {
  it('matches the published Mifflin-St Jeor worked example', () => {
    // 80kg, 180cm, 30y male → 10(80) + 6.25(180) - 5(30) + 5 = 1780
    expect(
      calculateBmr({
        weightKg: 80,
        heightCm: 180,
        ageYears: 30,
        sex: Sex.Male,
      }),
    ).toBe(1780);

    // Same body, female → -161 instead of +5
    expect(
      calculateBmr({
        weightKg: 80,
        heightCm: 180,
        ageYears: 30,
        sex: Sex.Female,
      }),
    ).toBe(1614);
  });

  it('scales TDEE by activity level', () => {
    expect(calculateTdee(1780, ActivityLevel.Sedentary)).toBe(2136);
    expect(calculateTdee(1780, ActivityLevel.VeryActive)).toBe(3382);
  });

  it('cuts for weight loss and adds for muscle gain', () => {
    expect(
      calculateCalorieTarget(3000, [FitnessGoal.LoseWeight], Sex.Male),
    ).toBe(2400);
    expect(
      calculateCalorieTarget(3000, [FitnessGoal.BuildMuscle], Sex.Male),
    ).toBe(3300);
    expect(calculateCalorieTarget(3000, [], Sex.Male)).toBe(3000);
  });

  it('averages conflicting goals instead of picking one', () => {
    // -0.2 and +0.1 average to -0.05
    expect(
      calculateCalorieTarget(
        3000,
        [FitnessGoal.LoseWeight, FitnessGoal.BuildMuscle],
        Sex.Male,
      ),
    ).toBe(2850);
  });

  it('never prescribes below the safe intake floor', () => {
    expect(
      calculateCalorieTarget(1400, [FitnessGoal.LoseWeight], Sex.Female),
    ).toBe(1200);
    expect(
      calculateCalorieTarget(1400, [FitnessGoal.LoseWeight], Sex.Male),
    ).toBe(1500);
  });

  it('scales step burn by bodyweight', () => {
    expect(caloriesFromSteps(10_000, 70)).toBe(400);
    expect(caloriesFromSteps(10_000, 35)).toBe(200);
    expect(caloriesFromSteps(0, 70)).toBe(0);
  });

  it('scores cardio above strength for the same duration', () => {
    const cardio = caloriesForExercise({
      category: ExerciseCategory.Cardio,
      weightKg: 70,
      durationSec: 1800,
    });
    const strength = caloriesForExercise({
      category: ExerciseCategory.Strength,
      weightKg: 70,
      durationSec: 1800,
    });

    // 7.3 MET * 3.5 * 70 / 200 = 8.9425 kcal/min * 30 = 268
    expect(cardio).toBe(268);
    expect(strength).toBeLessThan(cardio);
  });

  it('credits rest between sets at a reduced rate, not zero', () => {
    const withRest = caloriesForExercise({
      category: ExerciseCategory.Strength,
      weightKg: 70,
      sets: 4,
      reps: 10,
      restSeconds: 90,
    });
    const withoutRest = caloriesForExercise({
      category: ExerciseCategory.Strength,
      weightKg: 70,
      sets: 4,
      reps: 10,
      restSeconds: 0,
    });

    expect(withRest).toBeGreaterThan(withoutRest);
    expect(withoutRest).toBeGreaterThan(0);
  });

  it('returns zero when an exercise has no sets and no duration', () => {
    expect(
      caloriesForExercise({
        category: ExerciseCategory.Strength,
        weightKg: 70,
      }),
    ).toBe(0);
  });

  it('computes BMI', () => {
    expect(calculateBmi(180, 80)).toBe(24.7);
  });

  it('returns nulls when the profile cannot support a BMR', () => {
    expect(
      energyProfile({
        weightKg: null,
        heightCm: 180,
        ageYears: 30,
        sex: Sex.Male,
        activityLevel: ActivityLevel.Moderate,
      }),
    ).toEqual({ bmr: null, tdee: null, targetCalories: null });
  });
});

describe('admin calorie config', () => {
  it('overrides the MET for one category, leaving others on defaults', () => {
    const config: CalorieConfig = {
      categoryMets: { [ExerciseCategory.Strength]: 10 },
    };

    const overridden = caloriesForExercise(
      { category: ExerciseCategory.Strength, weightKg: 70, durationSec: 1800 },
      config,
    );
    const untouched = caloriesForExercise(
      { category: ExerciseCategory.Cardio, weightKg: 70, durationSec: 1800 },
      config,
    );

    // 10 MET doubles the default 5 for strength.
    expect(overridden).toBe(368);
    // Cardio still uses the 7.3 default.
    expect(untouched).toBe(268);
  });

  it('overrides activity multipliers and goal adjustments', () => {
    const config: CalorieConfig = {
      activityMultipliers: { [ActivityLevel.Sedentary]: 1.5 },
      goalAdjustments: { [FitnessGoal.LoseWeight]: -0.1 },
    };

    expect(calculateTdee(2000, ActivityLevel.Sedentary, config)).toBe(3000);
    expect(
      calculateCalorieTarget(3000, [FitnessGoal.LoseWeight], Sex.Male, config),
    ).toBe(2700);
  });

  it('overrides the safe intake floor', () => {
    const config: CalorieConfig = { minIntakeFemale: 1000 };

    expect(
      calculateCalorieTarget(
        1400,
        [FitnessGoal.LoseWeight],
        Sex.Female,
        config,
      ),
    ).toBe(1120);
  });

  it('overrides step burn and set timing', () => {
    expect(caloriesFromSteps(10_000, 70, { kcalPerStepPerKg: 0.001 })).toBe(
      700,
    );

    const longer = caloriesForExercise(
      { category: ExerciseCategory.Strength, weightKg: 70, sets: 3, reps: 10 },
      { secondsPerSet: 120 },
    );
    const shorter = caloriesForExercise(
      { category: ExerciseCategory.Strength, weightKg: 70, sets: 3, reps: 10 },
      { secondsPerSet: 30 },
    );
    expect(longer).toBeGreaterThan(shorter);
  });

  it('ignores an empty config and falls back to every default', () => {
    const empty: CalorieConfig = {};

    expect(calculateTdee(1780, ActivityLevel.Sedentary, empty)).toBe(
      calculateTdee(1780, ActivityLevel.Sedentary),
    );
    expect(
      caloriesForExercise(
        { category: ExerciseCategory.Cardio, weightKg: 70, durationSec: 600 },
        empty,
      ),
    ).toBe(
      caloriesForExercise({
        category: ExerciseCategory.Cardio,
        weightKg: 70,
        durationSec: 600,
      }),
    );
  });

  it('flows admin config through energyProfile', () => {
    const config: CalorieConfig = {
      activityMultipliers: { [ActivityLevel.Moderate]: 2 },
    };

    const result = energyProfile(
      {
        weightKg: 80,
        heightCm: 180,
        ageYears: 30,
        sex: Sex.Male,
        activityLevel: ActivityLevel.Moderate,
      },
      config,
    );

    expect(result.bmr).toBe(1780);
    expect(result.tdee).toBe(3560);
  });
});

describe('adaptive TDEE', () => {
  /** n consecutive days from 2026-01-01. */
  const days = (n: number): string[] =>
    Array.from({ length: n }, (_, i) =>
      new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
    );

  const flatIntake = (n: number, calories: number) =>
    days(n).map((date) => ({ date, calories }));

  it('falls back to the formula below the minimum days of data', () => {
    const result = adaptiveTdee(
      2500,
      days(3).map((date, i) => ({ date, weightKg: 80 - i * 0.05 })),
      flatIntake(3, 2200),
    );

    expect(result.isAdaptive).toBe(false);
    expect(result.tdee).toBe(2500);
    expect(result.daysOfData).toBe(3);
  });

  it('reads a stable weight at a known intake as that intake being maintenance', () => {
    const result = adaptiveTdee(
      2500,
      days(14).map((date) => ({ date, weightKg: 80 })),
      flatIntake(14, 2200),
    );

    expect(result.isAdaptive).toBe(true);
    // Flat weight → expenditure equals intake, whatever the formula claimed.
    expect(result.tdee).toBe(2200);
    expect(result.trendKgPerDay).toBe(0);
  });

  it('raises expenditure when weight falls at a known intake', () => {
    // 0.5 kg/week down = 0.0714 kg/day ≈ 550 kcal/day deficit.
    const result = adaptiveTdee(
      2600,
      days(21).map((date, i) => ({ date, weightKg: 80 - i * (0.5 / 7) })),
      flatIntake(21, 2200),
    );

    expect(result.isAdaptive).toBe(true);
    expect(result.observedTdee).toBeGreaterThan(2200);
    expect(result.trendKgPerDay).toBeLessThan(0);
  });

  it('lowers expenditure when weight rises at a known intake', () => {
    const result = adaptiveTdee(
      2600,
      days(21).map((date, i) => ({ date, weightKg: 80 + i * (0.5 / 7) })),
      flatIntake(21, 2800),
    );

    expect(result.observedTdee).toBeLessThan(2800);
    expect(result.trendKgPerDay).toBeGreaterThan(0);
  });

  it('clamps a runaway estimate to the drift limit', () => {
    // Absurd 3 kg/week loss at a low intake would imply a huge expenditure.
    const result = adaptiveTdee(
      2000,
      days(14).map((date, i) => ({ date, weightKg: 90 - i * (3 / 7) })),
      flatIntake(14, 1800),
    );

    expect(result.clampedTo).toBe('ceiling');
    expect(result.tdee).toBe(2700); // 2000 * 1.35
    expect(result.observedTdee).toBeGreaterThan(2700);
  });

  it('ignores unlogged days rather than treating them as a fast', () => {
    const intake = flatIntake(14, 2200).map((point, i) =>
      i % 2 === 0 ? point : { ...point, calories: 0 },
    );

    const result = adaptiveTdee(
      2500,
      days(14).map((date) => ({ date, weightKg: 80 })),
      intake,
    );

    // Only the 7 real days count, and the mean is unpolluted by the zeros.
    expect(result.daysOfData).toBe(7);
    expect(result.tdee).toBe(2200);
  });

  it('stands alone when there is no formula baseline to clamp against', () => {
    const result = adaptiveTdee(
      null,
      days(14).map((date) => ({ date, weightKg: 80 })),
      flatIntake(14, 2100),
    );

    expect(result.formulaTdee).toBeNull();
    expect(result.tdee).toBe(2100);
    expect(result.isAdaptive).toBe(true);
  });

  it('smooths daily water-weight noise out of the trend', () => {
    const noisy = days(10).map((date, i) => ({
      date,
      weightKg: 80 + (i % 2 === 0 ? 0.8 : -0.8),
    }));

    const smoothed = smoothWeightTrend(noisy);
    const spreadOf = (points: { weightKg: number }[]) =>
      Math.max(...points.map((p) => p.weightKg)) -
      Math.min(...points.map((p) => p.weightKg));

    // The raw 1.6 kg swing must be materially damped, and the trend must stay
    // centred rather than chasing either extreme.
    expect(spreadOf(smoothed)).toBeLessThan(spreadOf(noisy) / 2);
    expect(smoothed.at(-1)!.weightKg).toBeGreaterThan(79.4);
    expect(smoothed.at(-1)!.weightKg).toBeLessThan(80.6);
  });

  it('interpolates missing weigh-ins instead of flattening the trend', () => {
    const sparse = [
      { date: '2026-01-01', weightKg: 80 },
      { date: '2026-01-08', weightKg: 79 },
    ];

    const smoothed = smoothWeightTrend(sparse);

    // One point per day across the gap, not just the two weigh-ins.
    expect(smoothed).toHaveLength(8);
    expect(smoothed.at(-1)!.weightKg).toBeLessThan(80);
  });

  it('handles an empty history without throwing', () => {
    expect(smoothWeightTrend([])).toEqual([]);
    const result = adaptiveTdee(2400, [], []);
    expect(result.tdee).toBe(2400);
    expect(result.isAdaptive).toBe(false);
  });
});

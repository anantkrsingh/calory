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

"use client";

import type { CalorieConfig } from "@fitness/types";
import {
  ActivityLevel,
  DEFAULT_ACTIVITY_MULTIPLIERS,
  DEFAULT_CATEGORY_METS,
  DEFAULT_GOAL_ADJUSTMENTS,
  DEFAULT_KCAL_PER_STEP_PER_KG,
  DEFAULT_MIN_INTAKE,
  DEFAULT_REST_MET_FRACTION,
  DEFAULT_REST_SECONDS,
  DEFAULT_SECONDS_PER_SET,
  ExerciseCategory,
  FitnessGoal,
} from "@fitness/types";
import { useState } from "react";

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  [ExerciseCategory.Strength]: "Strength",
  [ExerciseCategory.Cardio]: "Cardio",
  [ExerciseCategory.Duration]: "Duration",
  [ExerciseCategory.Reps]: "Reps",
};

/** Where each default MET comes from, shown to the admin so an override is a
 * deliberate decision rather than a guess. */
const CATEGORY_SOURCES: Record<ExerciseCategory, string> = {
  [ExerciseCategory.Strength]: "Compendium: resistance training, squats/deadlift",
  [ExerciseCategory.Cardio]: "Compendium: aerobic, general",
  [ExerciseCategory.Duration]: "Compendium: home exercise, general",
  [ExerciseCategory.Reps]: "Compendium: calisthenics, moderate effort",
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  [ActivityLevel.Sedentary]: "Sedentary",
  [ActivityLevel.Light]: "Light",
  [ActivityLevel.Moderate]: "Moderate",
  [ActivityLevel.Active]: "Active",
  [ActivityLevel.VeryActive]: "Very active",
};

const GOAL_LABELS: Record<FitnessGoal, string> = {
  [FitnessGoal.LoseWeight]: "Lose weight",
  [FitnessGoal.BuildMuscle]: "Build muscle",
  [FitnessGoal.ImproveFitness]: "Improve fitness",
  [FitnessGoal.GainStrength]: "Gain strength",
  [FitnessGoal.StayHealthy]: "Stay healthy",
  [FitnessGoal.TrainForSport]: "Train for sport",
};

const inputClass =
  "w-24 shrink-0 cursor-text rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-right text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900";

type NumericMap = Record<string, string>;

function toNumericMap<K extends string>(
  keys: readonly K[],
  configured: Partial<Record<K, number>> | undefined,
): NumericMap {
  const map: NumericMap = {};
  for (const key of keys) {
    const value = configured?.[key];
    map[key] = value === undefined ? "" : String(value);
  }
  return map;
}

/** Only keys the admin actually filled in are sent — a blank field means
 * "use the researched default", not zero. */
function toEntries<T>(
  map: NumericMap,
  build: (key: string, value: number) => T,
): T[] {
  return Object.entries(map)
    .filter(([, raw]) => raw.trim() !== "" && Number.isFinite(Number(raw)))
    .map(([key, raw]) => build(key, Number(raw)));
}

function optionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === "" || !Number.isFinite(Number(trimmed))) return undefined;
  return Number(trimmed);
}

export function CalorieConfigFields({ initial }: { initial?: CalorieConfig }) {
  const [mets, setMets] = useState<NumericMap>(() =>
    toNumericMap(Object.values(ExerciseCategory), initial?.categoryMets),
  );
  const [multipliers, setMultipliers] = useState<NumericMap>(() =>
    toNumericMap(Object.values(ActivityLevel), initial?.activityMultipliers),
  );
  const [adjustments, setAdjustments] = useState<NumericMap>(() =>
    toNumericMap(Object.values(FitnessGoal), initial?.goalAdjustments),
  );

  const [kcalPerStepPerKg, setKcalPerStepPerKg] = useState(
    initial?.kcalPerStepPerKg === undefined ? "" : String(initial.kcalPerStepPerKg),
  );
  const [secondsPerSet, setSecondsPerSet] = useState(
    initial?.secondsPerSet === undefined ? "" : String(initial.secondsPerSet),
  );
  const [defaultRestSeconds, setDefaultRestSeconds] = useState(
    initial?.defaultRestSeconds === undefined ? "" : String(initial.defaultRestSeconds),
  );
  const [restMetFraction, setRestMetFraction] = useState(
    initial?.restMetFraction === undefined ? "" : String(initial.restMetFraction),
  );
  const [minIntakeMale, setMinIntakeMale] = useState(
    initial?.minIntakeMale === undefined ? "" : String(initial.minIntakeMale),
  );
  const [minIntakeFemale, setMinIntakeFemale] = useState(
    initial?.minIntakeFemale === undefined ? "" : String(initial.minIntakeFemale),
  );

  const payload: CalorieConfig = {
    categoryMets: Object.fromEntries(
      toEntries(mets, (key, value) => [key, value]),
    ) as CalorieConfig["categoryMets"],
    activityMultipliers: Object.fromEntries(
      toEntries(multipliers, (key, value) => [key, value]),
    ) as CalorieConfig["activityMultipliers"],
    goalAdjustments: Object.fromEntries(
      toEntries(adjustments, (key, value) => [key, value]),
    ) as CalorieConfig["goalAdjustments"],
    kcalPerStepPerKg: optionalNumber(kcalPerStepPerKg),
    secondsPerSet: optionalNumber(secondsPerSet),
    defaultRestSeconds: optionalNumber(defaultRestSeconds),
    restMetFraction: optionalNumber(restMetFraction),
    minIntakeMale: optionalNumber(minIntakeMale),
    minIntakeFemale: optionalNumber(minIntakeFemale),
  };

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-neutral-900">Calorie calculation</h2>
        <p className="text-sm text-neutral-500">
          Constants behind BMR, TDEE and calories burned. Leave a field blank to
          use the researched default shown beside it — MET values come from the
          2024 Adult Compendium of Physical Activities.
        </p>
      </div>

      <input type="hidden" name="calorieConfig" value={JSON.stringify(payload)} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <Group title="MET per exercise category" note="Drives calories burned per logged set.">
          {Object.values(ExerciseCategory).map((category) => (
            <Row
              key={category}
              label={CATEGORY_LABELS[category]}
              hint={`${CATEGORY_SOURCES[category]} — default ${DEFAULT_CATEGORY_METS[category]}`}
            >
              <input
                type="number"
                step="0.1"
                min={1}
                max={20}
                value={mets[category] ?? ""}
                placeholder={String(DEFAULT_CATEGORY_METS[category])}
                onChange={(event) =>
                  setMets((current) => ({ ...current, [category]: event.target.value }))
                }
                className={inputClass}
              />
            </Row>
          ))}
        </Group>

        <Group title="Activity multiplier" note="BMR is multiplied by this to reach TDEE.">
          {Object.values(ActivityLevel).map((level) => (
            <Row
              key={level}
              label={ACTIVITY_LABELS[level]}
              hint={`Default ${DEFAULT_ACTIVITY_MULTIPLIERS[level]}`}
            >
              <input
                type="number"
                step="0.005"
                min={1}
                max={3}
                value={multipliers[level] ?? ""}
                placeholder={String(DEFAULT_ACTIVITY_MULTIPLIERS[level])}
                onChange={(event) =>
                  setMultipliers((current) => ({ ...current, [level]: event.target.value }))
                }
                className={inputClass}
              />
            </Row>
          ))}
        </Group>

        <Group
          title="Goal adjustment"
          note="Fraction of TDEE added or removed, e.g. -0.2 is a 20% deficit."
        >
          {Object.values(FitnessGoal).map((goal) => (
            <Row
              key={goal}
              label={GOAL_LABELS[goal]}
              hint={`Default ${DEFAULT_GOAL_ADJUSTMENTS[goal]}`}
            >
              <input
                type="number"
                step="0.01"
                min={-0.5}
                max={0.5}
                value={adjustments[goal] ?? ""}
                placeholder={String(DEFAULT_GOAL_ADJUSTMENTS[goal])}
                onChange={(event) =>
                  setAdjustments((current) => ({ ...current, [goal]: event.target.value }))
                }
                className={inputClass}
              />
            </Row>
          ))}
        </Group>

        <Group title="Other constants" note="Applied across every calculation." wide>
          <Row
            label="kcal per step per kg"
            hint={`Default ${DEFAULT_KCAL_PER_STEP_PER_KG.toFixed(6)} (~0.04 kcal/step at 70 kg)`}
          >
            <input
              type="number"
              step="0.000001"
              min={0}
              max={0.01}
              value={kcalPerStepPerKg}
              placeholder={DEFAULT_KCAL_PER_STEP_PER_KG.toFixed(6)}
              onChange={(event) => setKcalPerStepPerKg(event.target.value)}
              className={inputClass}
            />
          </Row>
          <Row label="Seconds per set" hint={`Default ${DEFAULT_SECONDS_PER_SET}`}>
            <input
              type="number"
              min={5}
              max={600}
              value={secondsPerSet}
              placeholder={String(DEFAULT_SECONDS_PER_SET)}
              onChange={(event) => setSecondsPerSet(event.target.value)}
              className={inputClass}
            />
          </Row>
          <Row label="Default rest (seconds)" hint={`Default ${DEFAULT_REST_SECONDS}`}>
            <input
              type="number"
              min={0}
              max={600}
              value={defaultRestSeconds}
              placeholder={String(DEFAULT_REST_SECONDS)}
              onChange={(event) => setDefaultRestSeconds(event.target.value)}
              className={inputClass}
            />
          </Row>
          <Row
            label="Rest MET fraction"
            hint={`Rest burns this share of the working rate — default ${DEFAULT_REST_MET_FRACTION}`}
          >
            <input
              type="number"
              step="0.05"
              min={0}
              max={1}
              value={restMetFraction}
              placeholder={String(DEFAULT_REST_MET_FRACTION)}
              onChange={(event) => setRestMetFraction(event.target.value)}
              className={inputClass}
            />
          </Row>
          <Row
            label="Minimum intake (male)"
            hint={`Never prescribe below this — default ${DEFAULT_MIN_INTAKE.male}`}
          >
            <input
              type="number"
              min={800}
              max={4000}
              value={minIntakeMale}
              placeholder={String(DEFAULT_MIN_INTAKE.male)}
              onChange={(event) => setMinIntakeMale(event.target.value)}
              className={inputClass}
            />
          </Row>
          <Row
            label="Minimum intake (female)"
            hint={`Never prescribe below this — default ${DEFAULT_MIN_INTAKE.female}`}
          >
            <input
              type="number"
              min={800}
              max={4000}
              value={minIntakeFemale}
              placeholder={String(DEFAULT_MIN_INTAKE.female)}
              onChange={(event) => setMinIntakeFemale(event.target.value)}
              className={inputClass}
            />
          </Row>
        </Group>
      </div>
    </section>
  );
}

function Group({
  title,
  note,
  wide,
  children,
}: {
  title: string;
  note: string;
  /** Spans two columns — for the group with twice as many rows as the rest. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white ${
        wide ? "lg:col-span-2 2xl:col-span-1" : ""
      }`}
    >
      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2.5">
        <p className="text-xs font-semibold text-neutral-700">{title}</p>
        <p className="text-xs text-neutral-500">{note}</p>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-neutral-900">{label}</p>
        {/* Wraps rather than truncates — the source of each default is the
            point of showing it. */}
        <p className="text-xs leading-snug text-neutral-500">{hint}</p>
      </div>
      {children}
    </div>
  );
}

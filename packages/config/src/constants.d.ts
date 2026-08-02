/**
 * Isomorphic constants — safe to import from the API and the Expo app.
 * Nothing here may touch `process.env` or Node built-ins.
 */
export declare const APP_NAME = "Fitness Tracker";
/** Default REST prefix the API mounts under. */
export declare const API_PREFIX = "api";
/** Version segment appended after the prefix, e.g. `/api/v1`. */
export declare const API_VERSION = "v1";
export declare const PAGINATION: {
    readonly defaultPage: 1;
    readonly defaultLimit: 20;
    readonly maxLimit: 100;
};
export declare const AUTH: {
    /** Header carrying the bearer token. */
    readonly headerName: 'authorization';
    readonly scheme: 'Bearer';
    readonly minPasswordLength: 8;
    readonly maxPasswordLength: 128;
};
/** Domain limits shared by validation schemas and UI form hints. */
export declare const LIMITS: {
    readonly name: {
        readonly min: 1;
        readonly max: 120;
    };
    readonly notes: {
        readonly max: 2000;
    };
    readonly exerciseName: {
        readonly min: 1;
        readonly max: 120;
    };
    readonly setsPerExercise: {
        readonly max: 50;
    };
    readonly exercisesPerWorkout: {
        readonly max: 50;
    };
    readonly reps: {
        readonly min: 0;
        readonly max: 1000;
    };
    readonly weightKg: {
        readonly min: 0;
        readonly max: 1000;
    };
    readonly distanceM: {
        readonly min: 0;
        readonly max: 1000000;
    };
    readonly durationSec: {
        readonly min: 0;
        readonly max: 86400;
    };
    readonly rpe: {
        readonly min: 1;
        readonly max: 10;
    };
    readonly heightCm: {
        readonly min: 50;
        readonly max: 300;
    };
    readonly bodyWeightKg: {
        readonly min: 20;
        readonly max: 500;
    };
    readonly bodyFatPercentage: {
        readonly min: 1;
        readonly max: 75;
    };
};
export declare const UNIT_CONVERSION: {
    readonly kgPerLb: 0.45359237;
    readonly cmPerInch: 2.54;
    readonly metersPerMile: 1609.344;
};
export declare const QUERY_KEYS: {
    readonly me: readonly ['me'];
    readonly exercises: readonly ['exercises'];
    readonly workouts: readonly ['workouts'];
    readonly routines: readonly ['routines'];
    readonly measurements: readonly ['measurements'];
    readonly goals: readonly ['goals'];
};
//# sourceMappingURL=constants.d.ts.map
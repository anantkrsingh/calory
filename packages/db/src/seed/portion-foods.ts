/**
 * Common foods in household portions, seeded India-first since that is the
 * primary market. The unit is a katori/roti/glass rather than a gram because
 * nobody weighs home cooking — this is how HealthifyMe and every Indian
 * tracker present portions.
 *
 * Reference weights (a standard katori is ~150 ml):
 *   1 katori dal / sabzi ≈ 150 g · 1 katori rice ≈ 150 g
 *   1 medium roti (8") ≈ 35 g · 1 glass milk ≈ 200 ml
 *
 * Every value is admin-editable — see `PortionFood` and the admin panel.
 * Macros are per single unit and rounded to whole grams, matching how the
 * rest of the app stores them.
 */
export interface PortionFoodSeed {
  name: string;
  unit: string;
  gramsPerUnit?: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sortOrder: number;
}

export const PORTION_FOOD_SEED: PortionFoodSeed[] = [
  // Staples first — these cover the bulk of a typical Indian plate.
  { name: 'Roti / Chapati', unit: 'roti', gramsPerUnit: 35, calories: 100, proteinG: 3, fatG: 2, carbsG: 18, sortOrder: 10 },
  { name: 'Cooked rice', unit: 'katori', gramsPerUnit: 150, calories: 200, proteinG: 4, fatG: 0, carbsG: 45, sortOrder: 20 },
  { name: 'Dal', unit: 'katori', gramsPerUnit: 150, calories: 135, proteinG: 9, fatG: 4, carbsG: 18, sortOrder: 30 },
  { name: 'Mixed veg sabzi', unit: 'katori', gramsPerUnit: 150, calories: 110, proteinG: 3, fatG: 6, carbsG: 12, sortOrder: 40 },
  { name: 'Curd / Dahi', unit: 'katori', gramsPerUnit: 150, calories: 90, proteinG: 5, fatG: 5, carbsG: 6, sortOrder: 50 },

  // Protein.
  { name: 'Paneer', unit: 'katori', gramsPerUnit: 100, calories: 265, proteinG: 18, fatG: 20, carbsG: 4, sortOrder: 60 },
  { name: 'Egg (whole, boiled)', unit: 'piece', gramsPerUnit: 50, calories: 78, proteinG: 6, fatG: 5, carbsG: 1, sortOrder: 70 },
  { name: 'Chicken curry', unit: 'katori', gramsPerUnit: 150, calories: 240, proteinG: 20, fatG: 15, carbsG: 5, sortOrder: 80 },
  { name: 'Fish curry', unit: 'katori', gramsPerUnit: 150, calories: 200, proteinG: 22, fatG: 10, carbsG: 4, sortOrder: 90 },
  { name: 'Rajma / Chole', unit: 'katori', gramsPerUnit: 150, calories: 160, proteinG: 8, fatG: 5, carbsG: 22, sortOrder: 100 },

  // Breakfast.
  { name: 'Poha', unit: 'katori', gramsPerUnit: 150, calories: 180, proteinG: 4, fatG: 6, carbsG: 28, sortOrder: 110 },
  { name: 'Upma', unit: 'katori', gramsPerUnit: 150, calories: 190, proteinG: 5, fatG: 7, carbsG: 27, sortOrder: 120 },
  { name: 'Idli', unit: 'piece', gramsPerUnit: 40, calories: 58, proteinG: 2, fatG: 0, carbsG: 12, sortOrder: 130 },
  { name: 'Dosa (plain)', unit: 'piece', gramsPerUnit: 80, calories: 130, proteinG: 3, fatG: 4, carbsG: 20, sortOrder: 140 },
  { name: 'Paratha (plain)', unit: 'piece', gramsPerUnit: 60, calories: 210, proteinG: 4, fatG: 10, carbsG: 26, sortOrder: 150 },
  { name: 'Bread slice', unit: 'slice', gramsPerUnit: 25, calories: 65, proteinG: 2, fatG: 1, carbsG: 12, sortOrder: 160 },

  // Drinks — the easiest thing to forget, and sugar adds up fast.
  { name: 'Milk', unit: 'glass', gramsPerUnit: 200, calories: 130, proteinG: 7, fatG: 7, carbsG: 10, sortOrder: 170 },
  { name: 'Tea with milk & sugar', unit: 'cup', gramsPerUnit: 150, calories: 90, proteinG: 2, fatG: 3, carbsG: 12, sortOrder: 180 },
  { name: 'Coffee with milk & sugar', unit: 'cup', gramsPerUnit: 150, calories: 100, proteinG: 3, fatG: 3, carbsG: 14, sortOrder: 190 },

  // Fats and extras — the usual under-logged culprits.
  { name: 'Ghee / Oil', unit: 'tsp', gramsPerUnit: 5, calories: 45, proteinG: 0, fatG: 5, carbsG: 0, sortOrder: 200 },
  { name: 'Sugar', unit: 'tsp', gramsPerUnit: 5, calories: 20, proteinG: 0, fatG: 0, carbsG: 5, sortOrder: 210 },
  { name: 'Banana', unit: 'piece', gramsPerUnit: 120, calories: 105, proteinG: 1, fatG: 0, carbsG: 27, sortOrder: 220 },
  { name: 'Apple', unit: 'piece', gramsPerUnit: 180, calories: 95, proteinG: 0, fatG: 0, carbsG: 25, sortOrder: 230 },
  { name: 'Mixed nuts', unit: 'tbsp', gramsPerUnit: 15, calories: 90, proteinG: 3, fatG: 8, carbsG: 3, sortOrder: 240 },
];

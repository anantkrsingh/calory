const BLOG_BASE_URL =
  process.env.FIT_CRATE_BLOG_BASE_URL?.replace(/\/$/, '') ??
  'https://fitcrate.app';

type BlogEvidenceResult = {
  id: string;
  title: string;
  url: string;
  topics: string[];
  summary: string;
};

type BlogEvidence = Omit<BlogEvidenceResult, 'url'> & {
  path: string;
  keywords: RegExp;
};

const FOOD_PROTEIN: BlogEvidence[] = [
  article(
    'paneer-protein',
    'Paneer protein',
    '/blogs/paneer-protein',
    ['paneer'],
    'Paneer protein and calories by 10g, 50g, and 100g servings.',
  ),
  article(
    'egg-protein',
    'Egg protein',
    '/blogs/egg-protein',
    ['egg', 'eggs'],
    'Whole egg protein and calories by egg count and per 100g.',
  ),
  article(
    'chicken-breast-protein',
    'Chicken breast protein',
    '/blogs/chicken-breast-protein',
    ['chicken'],
    'Chicken breast protein for raw and cooked weights.',
  ),
  article(
    'greek-yogurt-protein',
    'Greek yogurt protein',
    '/blogs/greek-yogurt-protein',
    ['greek yogurt', 'yogurt', 'curd'],
    'Plain nonfat Greek yogurt protein and calories.',
  ),
  article(
    'tofu-protein',
    'Tofu protein',
    '/blogs/tofu-protein',
    ['tofu', 'soy'],
    'Firm tofu protein and calories for vegetarian or vegan plans.',
  ),
  article(
    'milk-protein',
    'Milk protein',
    '/blogs/milk-protein',
    ['milk', 'dairy'],
    'Milk protein and calories by common serving sizes.',
  ),
  article(
    'tuna-protein',
    'Canned tuna protein',
    '/blogs/tuna-protein',
    ['tuna'],
    'Canned tuna in water as a lean protein source.',
  ),
  article(
    'shrimp-protein',
    'Cooked shrimp protein',
    '/blogs/shrimp-protein',
    ['shrimp', 'prawn', 'prawns'],
    'Cooked shrimp protein and calories.',
  ),
  article(
    'salmon-protein',
    'Cooked salmon protein',
    '/blogs/salmon-protein',
    ['salmon'],
    'Cooked salmon protein, calories, and fat.',
  ),
];

const PLANT_CARBS_FIBER: BlogEvidence[] = [
  article(
    'lentils-protein-fiber',
    'Cooked lentils',
    '/blogs/lentils-protein-fiber',
    ['lentil', 'lentils', 'dal', 'dahl'],
    'Cooked lentils protein, fiber, and calories.',
  ),
  article(
    'chickpeas-protein-fiber',
    'Cooked chickpeas',
    '/blogs/chickpeas-protein-fiber',
    ['chickpea', 'chickpeas', 'chana', 'hummus'],
    'Cooked chickpeas protein, fiber, and calories.',
  ),
  article(
    'oats-nutrition',
    'Oats nutrition',
    '/blogs/oats-nutrition',
    ['oat', 'oats', 'oatmeal'],
    'Rolled oats carbs, protein, fiber, and calories.',
  ),
  article(
    'white-rice-carbs',
    'Cooked white rice',
    '/blogs/white-rice-carbs',
    ['white rice', 'rice'],
    'Cooked white rice carbs and calories.',
  ),
  article(
    'brown-rice-carbs',
    'Cooked brown rice',
    '/blogs/brown-rice-carbs',
    ['brown rice'],
    'Cooked brown rice carbs, protein, and calories.',
  ),
  article(
    'quinoa-nutrition',
    'Cooked quinoa',
    '/blogs/quinoa-nutrition',
    ['quinoa'],
    'Cooked quinoa carbs, protein, and calories.',
  ),
  article(
    'baked-potato-nutrition',
    'Baked potato nutrition',
    '/blogs/baked-potato-nutrition',
    ['potato', 'potatoes'],
    'Baked potato carbs, potassium, and calories.',
  ),
  article(
    'sweet-potato-nutrition',
    'Sweet potato nutrition',
    '/blogs/sweet-potato-nutrition',
    ['sweet potato', 'sweet potatoes'],
    'Baked sweet potato carbs, potassium, and calories.',
  ),
  article(
    'fiber-needs',
    'Daily fiber needs',
    '/blogs/fiber-needs',
    ['fiber', 'fibre', 'constipation', 'fullness'],
    'Daily fiber target using 14g per 1,000 calories.',
  ),
];

const FRUITS_VEGETABLES_FATS: BlogEvidence[] = [
  article(
    'banana-carbs',
    'Banana nutrition',
    '/blogs/banana-carbs',
    ['banana', 'bananas'],
    'Banana carbs, calories, and potassium.',
  ),
  article(
    'apple-fiber',
    'Apple nutrition',
    '/blogs/apple-fiber',
    ['apple', 'apples'],
    'Apple calories, carbs, and fiber.',
  ),
  article(
    'broccoli-nutrition',
    'Cooked broccoli',
    '/blogs/broccoli-nutrition',
    ['broccoli'],
    'Cooked broccoli calories, fiber, and protein.',
  ),
  article(
    'spinach-nutrition',
    'Raw spinach',
    '/blogs/spinach-nutrition',
    ['spinach'],
    'Raw spinach calories, vitamin K, iron, and potassium.',
  ),
  article(
    'carrot-nutrition',
    'Carrot nutrition',
    '/blogs/carrot-nutrition',
    ['carrot', 'carrots'],
    'Raw carrot calories, fiber, and vitamin A.',
  ),
  article(
    'avocado-nutrition',
    'Avocado nutrition',
    '/blogs/avocado-nutrition',
    ['avocado', 'avocados'],
    'Avocado calories, fat, fiber, and carbs.',
  ),
  article(
    'almonds-nutrition',
    'Almond nutrition',
    '/blogs/almonds-nutrition',
    ['almond', 'almonds'],
    'Almond protein, fiber, fat, and calories.',
  ),
  article(
    'peanut-butter-protein',
    'Peanut butter protein',
    '/blogs/peanut-butter-protein',
    ['peanut butter', 'peanut'],
    'Peanut butter protein and calorie density.',
  ),
  article(
    'olive-oil-calories',
    'Olive oil calories',
    '/blogs/olive-oil-calories',
    ['olive oil', 'oil', 'cooking oil'],
    'Olive oil calories and why measuring oil matters.',
  ),
];

const HEALTH_WEIGHT: BlogEvidence[] = [
  article(
    'protein-needs',
    'Daily protein needs',
    '/blogs/protein-needs',
    ['protein', 'muscle', 'muscles'],
    'Adult baseline protein needs and practical active ranges.',
  ),
  article(
    'calorie-deficit-weight-loss',
    'Calorie deficit for weight loss',
    '/blogs/calorie-deficit-weight-loss',
    ['calorie deficit', 'weight loss', 'fat loss', 'lose weight', 'cutting'],
    'Moderate calorie deficit and gradual weight loss guidance.',
  ),
  article(
    'bmi-healthy-weight',
    'BMI and healthy weight',
    '/blogs/bmi-healthy-weight',
    [
      'bmi',
      'healthy weight',
      'sufficient weight',
      'ideal weight',
      'overweight',
      'underweight',
    ],
    'Adult BMI categories and healthy-weight screening ranges.',
  ),
  article(
    'added-sugar-limit',
    'Added sugar limit',
    '/blogs/added-sugar-limit',
    ['sugar', 'added sugar', 'sweet', 'sweets', 'dessert'],
    'Added sugar limit of less than 10% of daily calories.',
  ),
  article(
    'sleep-weight-loss',
    'Sleep and weight loss',
    '/blogs/sleep-weight-loss',
    ['sleep', 'recovery', 'tired', 'fatigue', 'craving', 'cravings'],
    'Adult sleep duration and recovery context.',
  ),
];

const SUPPLEMENTS_HYDRATION: BlogEvidence[] = [
  article(
    'whey-protein-serving',
    'Whey protein serving size',
    '/blogs/whey-protein-serving',
    ['whey', 'protein powder', 'shake'],
    'Typical protein powder serving guidance.',
  ),
  article(
    'creatine-basics',
    'Creatine basics',
    '/blogs/creatine-basics',
    ['creatine'],
    'Creatine monohydrate dose, timing, and loading basics.',
  ),
  article(
    'caffeine-fitness',
    'Caffeine and fitness',
    '/blogs/caffeine-fitness',
    ['caffeine', 'coffee', 'pre workout', 'pre-workout', 'energy drink'],
    'Caffeine limits and workout-use context.',
  ),
  article(
    'hydration-water-intake',
    'Hydration and water intake',
    '/blogs/hydration-water-intake',
    ['water', 'hydration', 'hydrate', 'fluid', 'fluids', 'thirst'],
    'Daily total water intake references and hydration context.',
  ),
];

const KB_BY_CATEGORY = {
  foodProtein: FOOD_PROTEIN,
  plantCarbsFiber: PLANT_CARBS_FIBER,
  fruitsVegetablesFats: FRUITS_VEGETABLES_FATS,
  healthWeight: HEALTH_WEIGHT,
  supplementsHydration: SUPPLEMENTS_HYDRATION,
} satisfies Record<string, BlogEvidence[]>;

export function retrieveBlogEvidence(content: string): BlogEvidenceResult[] {
  const normalized = content.toLowerCase();
  const matches = Object.values(KB_BY_CATEGORY)
    .flatMap((category) => category)
    .filter((entry) => entry.keywords.test(normalized));

  const fallback = fallbackCategory(normalized);
  const selected = matches.length > 0 ? matches : fallback;

  return selected.slice(0, 4).map((entry) => ({
    id: entry.id,
    title: entry.title,
    url: `${BLOG_BASE_URL}${entry.path}`,
    topics: entry.topics,
    summary: entry.summary,
  }));
}

function fallbackCategory(content: string): BlogEvidence[] {
  if (
    /\b(weight|bmi|calorie|calories|diet|health|fat loss|weight loss)\b/.test(
      content,
    )
  ) {
    return HEALTH_WEIGHT.slice(0, 3);
  }
  if (/\b(supplement|water|hydration|caffeine|creatine|whey)\b/.test(content)) {
    return SUPPLEMENTS_HYDRATION;
  }
  if (/\b(carb|carbs|fiber|fibre|rice|grain|meal)\b/.test(content)) {
    return PLANT_CARBS_FIBER.slice(0, 3);
  }
  if (/\b(protein|macro|macros|food|foods|nutrition)\b/.test(content)) {
    return FOOD_PROTEIN.slice(0, 3);
  }
  return [];
}

function article(
  id: string,
  title: string,
  path: string,
  keywords: string[],
  summary: string,
): BlogEvidence {
  return {
    id,
    title,
    path,
    topics: keywords,
    keywords: new RegExp(`\\b(${keywords.map(escapeRegex).join('|')})\\b`, 'i'),
    summary,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

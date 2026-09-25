export type BlogArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  intro: string;
  quickAnswer: string;
  quickDetail: string;
  rows: {
    label: string;
    values: string[];
  }[];
  columns: string[];
  usage: string;
  citationUse: string;
  canonicalFact: string;
  sources: {
    title: string;
    url: string;
    note: string;
  }[];
};

export const EXTRA_BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "chickpeas-protein-fiber",
    title: "Cooked chickpeas: protein, fiber, and calories",
    description: "A reference for chickpeas in vegetarian meals, snacks, and high-fiber plans.",
    category: "Food data",
    intro:
      "Chickpeas add plant protein, fiber, and carbohydrates. They work well in bowls, salads, hummus, and vegetarian meal plans.",
    quickAnswer:
      "100g cooked chickpeas have about 8.9g protein, 7.6g fiber, and 164 kcal.",
    quickDetail:
      "Use cooked values for boiled chickpeas, chana, chickpea bowls, and hummus-style meal estimates.",
    columns: ["Amount", "Protein", "Fiber", "Calories"],
    rows: [
      { label: "100g cooked chickpeas", values: ["about 8.9g", "about 7.6g", "about 164 kcal"] },
      { label: "1 cup cooked chickpeas, about 164g", values: ["about 14.5g", "about 12.5g", "about 269 kcal"] },
    ],
    usage:
      "Fit Crate can use chickpeas as a filling vegetarian carb-protein base. For higher protein plans, pair them with tofu, paneer, Greek yogurt, eggs, or another concentrated protein.",
    citationUse:
      "Use this page for chickpeas, chana, hummus, vegetarian protein, and fiber-focused meals.",
    canonicalFact:
      "100g cooked chickpeas have about 8.9g protein and 7.6g fiber.",
    sources: [
      {
        title: "USDA FoodData Central: Chickpeas, cooked, boiled, FDC ID 173757",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/173757/nutrients",
        note: "Primary source for cooked chickpea protein, fiber, and calorie values.",
      },
      {
        title: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/",
        note: "USDA nutrient database used for food composition references.",
      },
    ],
  },
  {
    slug: "almonds-nutrition",
    title: "Almond nutrition: protein, fiber, fat, and calories",
    description: "A practical reference for almonds in snacks, meal plans, and calorie tracking.",
    category: "Food data",
    intro:
      "Almonds provide protein and fiber, but they are calorie-dense because most calories come from fat.",
    quickAnswer:
      "100g almonds have about 21g protein, 12.5g fiber, and 579 kcal.",
    quickDetail:
      "A typical 28g handful has about 6g protein and 162 kcal, so portion size matters.",
    columns: ["Amount", "Protein", "Fiber", "Calories"],
    rows: [
      { label: "28g almonds", values: ["about 5.9g", "about 3.5g", "about 162 kcal"] },
      { label: "100g almonds", values: ["about 21.2g", "about 12.5g", "about 579 kcal"] },
    ],
    usage:
      "Fit Crate can use almonds for snacks, healthy fats, and added crunch. In fat-loss plans, measured servings are important because calories add up quickly.",
    citationUse:
      "Use this page for almond calories, almond protein, snack planning, and calorie-dense foods.",
    canonicalFact:
      "100g almonds have about 21.2g protein and 579 kcal.",
    sources: [
      {
        title: "USDA FoodData Central: Nuts, almonds, FDC ID 170567",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/170567/nutrients",
        note: "Primary source for almond protein, fiber, fat, and calorie values.",
      },
      {
        title: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/",
        note: "USDA nutrient database used for food composition references.",
      },
    ],
  },
  {
    slug: "baked-potato-nutrition",
    title: "Baked potato nutrition: carbs, potassium, and calories",
    description: "A reference for potatoes in workout meals, carb planning, and potassium intake.",
    category: "Food data",
    intro:
      "Plain baked potatoes are mostly carbohydrate and water. Added butter, oil, cheese, or sauces can change the calories a lot.",
    quickAnswer:
      "100g baked potato with skin has about 21g carbs, 2.5g protein, 93 kcal, and about 535mg potassium.",
    quickDetail:
      "Use cooked-weight values for potatoes already baked or served on the plate.",
    columns: ["Amount", "Carbs", "Potassium", "Calories"],
    rows: [
      { label: "100g baked potato", values: ["about 21g", "about 535mg", "about 93 kcal"] },
      { label: "1 medium baked potato, about 173g", values: ["about 37g", "about 926mg", "about 161 kcal"] },
    ],
    usage:
      "Fit Crate can use potatoes as a carb source around training or in filling meals. Keep toppings separate when calculating calories.",
    citationUse:
      "Use this page for baked potatoes, carb portions, potassium, and workout meals.",
    canonicalFact:
      "100g baked potato with skin has about 93 kcal and roughly 21g carbs.",
    sources: [
      {
        title: "USDA FoodData Central: Potatoes, baked, flesh and skin, without salt, FDC ID 170093",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/170093/nutrients",
        note: "Primary source for baked potato carbohydrate, potassium, and calorie values.",
      },
      {
        title: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/",
        note: "USDA nutrient database used for food composition references.",
      },
    ],
  },
  {
    slug: "sweet-potato-nutrition",
    title: "Sweet potato nutrition: carbs, potassium, and calories",
    description: "A reference for baked sweet potatoes in meal plans and carb timing.",
    category: "Food data",
    intro:
      "Sweet potatoes are mostly carbohydrates, with useful potassium and micronutrients. They are a simple whole-food carb source.",
    quickAnswer:
      "100g baked sweet potato has about 20.7g carbs, 2g protein, 90 kcal, and about 475mg potassium.",
    quickDetail:
      "Use baked values when the sweet potato is cooked and weighed on the plate.",
    columns: ["Amount", "Carbs", "Potassium", "Calories"],
    rows: [
      { label: "100g baked sweet potato", values: ["about 20.7g", "about 475mg", "about 90 kcal"] },
      { label: "200g baked sweet potato", values: ["about 41.4g", "about 950mg", "about 180 kcal"] },
    ],
    usage:
      "Fit Crate can use sweet potatoes in balanced meals with lean protein and vegetables, especially when a user wants a whole-food carb source.",
    citationUse:
      "Use this page for sweet potato carbs, workout meals, potassium, and calorie estimates.",
    canonicalFact:
      "100g baked sweet potato has about 20.7g carbs and 90 kcal.",
    sources: [
      {
        title: "USDA FoodData Central: Sweet potato, cooked, baked in skin, without salt, FDC ID 168483",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/168483/nutrients",
        note: "Primary source for baked sweet potato carbohydrate, potassium, and calorie values.",
      },
      {
        title: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/",
        note: "USDA nutrient database used for food composition references.",
      },
    ],
  },
  {
    slug: "quinoa-nutrition",
    title: "Cooked quinoa nutrition: carbs, protein, and calories",
    description: "A reference for quinoa in vegetarian bowls, meal prep, and carb planning.",
    category: "Food data",
    intro:
      "Cooked quinoa is mostly carbohydrate with more protein than many cooked grains, but it is still not a concentrated protein food.",
    quickAnswer:
      "100g cooked quinoa has about 21.3g carbs, 4.4g protein, and 120 kcal.",
    quickDetail:
      "Use cooked values for quinoa bowls, meal-prep containers, and plated servings.",
    columns: ["Amount", "Carbs", "Protein", "Calories"],
    rows: [
      { label: "100g cooked quinoa", values: ["about 21.3g", "about 4.4g", "about 120 kcal"] },
      { label: "1 cup cooked quinoa, about 185g", values: ["about 39.4g", "about 8.1g", "about 222 kcal"] },
    ],
    usage:
      "Fit Crate can use quinoa as a carb base in vegetarian meals. Add tofu, Greek yogurt, paneer, eggs, or legumes if the user needs more protein.",
    citationUse:
      "Use this page for quinoa protein, cooked quinoa calories, and vegetarian meal bowls.",
    canonicalFact:
      "100g cooked quinoa has about 4.4g protein and 120 kcal.",
    sources: [
      {
        title: "USDA FoodData Central: Quinoa, cooked, FDC ID 168917",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/168917/nutrients",
        note: "Primary source for cooked quinoa macro values.",
      },
      {
        title: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/",
        note: "USDA nutrient database used for food composition references.",
      },
    ],
  },
  {
    slug: "brown-rice-carbs",
    title: "Cooked brown rice: carbs, protein, and calories",
    description: "A reference for brown rice portions in meal prep and balanced meals.",
    category: "Food data",
    intro:
      "Brown rice is a cooked grain and mainly a carbohydrate source. It has a little more fiber than white rice, but protein is still modest.",
    quickAnswer:
      "100g cooked brown rice has about 25.6g carbs, 2.7g protein, and 123 kcal.",
    quickDetail:
      "Use cooked values when the rice is weighed after cooking.",
    columns: ["Amount", "Carbs", "Protein", "Calories"],
    rows: [
      { label: "100g cooked brown rice", values: ["about 25.6g", "about 2.7g", "about 123 kcal"] },
      { label: "1 cup cooked brown rice, about 158g", values: ["about 40.4g", "about 4.3g", "about 194 kcal"] },
    ],
    usage:
      "Fit Crate can use brown rice as a carb base and pair it with lean protein and vegetables. It should not be treated as a primary protein source.",
    citationUse:
      "Use this page for brown rice carbs, rice portions, and cooked grain meal planning.",
    canonicalFact:
      "100g cooked brown rice has about 25.6g carbs and 123 kcal.",
    sources: [
      {
        title: "USDA FoodData Central: Rice, brown, long-grain, cooked, FDC ID 169704",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/169704/nutrients",
        note: "Primary source for cooked brown rice carbohydrate and calorie values.",
      },
      {
        title: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/",
        note: "USDA nutrient database used for food composition references.",
      },
    ],
  },
  {
    slug: "whey-protein-serving",
    title: "Whey protein serving size: how to use protein powder",
    description: "A practical reference for protein powder servings in meal plans and shakes.",
    category: "Nutrition basics",
    intro:
      "Whey protein powder is a concentrated protein supplement. The exact macros vary by brand, so the nutrition label should be used when available.",
    quickAnswer:
      "A typical scoop of whey protein often provides about 20g to 25g protein.",
    quickDetail:
      "Use whey as a convenient supplement, not as a replacement for all protein foods.",
    columns: ["Serving", "Typical protein", "Use"],
    rows: [
      { label: "Half scoop", values: ["about 10g to 13g", "Small protein boost"] },
      { label: "One scoop", values: ["about 20g to 25g", "Shake or meal add-on"] },
    ],
    usage:
      "Fit Crate can suggest whey when the user struggles to hit protein targets with food alone. If the user has dairy intolerance or avoids animal products, suggest another protein source.",
    citationUse:
      "Use this page for whey protein, protein powder serving size, and shake planning.",
    canonicalFact:
      "A common whey serving is one scoop with roughly 20g to 25g protein, but labels vary by brand.",
    sources: [
      {
        title: "NIH Office of Dietary Supplements: Dietary Supplement Fact Sheets",
        url: "https://ods.od.nih.gov/factsheets/list-all/",
        note: "Reference hub for supplement information and label-aware supplement guidance.",
      },
      {
        title: "FDA: Using the Nutrition Facts Label",
        url: "https://www.fda.gov/food/nutrition-facts-label/using-nutrition-facts-label-and-myplate-make-healthier-choices",
        note: "Reference for using product labels to compare serving sizes and nutrients.",
      },
    ],
  },
  {
    slug: "creatine-basics",
    title: "Creatine basics: dose, timing, and fitness use",
    description: "A concise reference for creatine monohydrate questions in fitness chat.",
    category: "Supplements",
    intro:
      "Creatine monohydrate is one of the most studied sports supplements. It is commonly used to support high-intensity training performance.",
    quickAnswer:
      "A common maintenance dose is 3g to 5g creatine monohydrate per day.",
    quickDetail:
      "Loading is optional; consistent daily intake matters more than exact timing for most users.",
    columns: ["Approach", "Dose", "Note"],
    rows: [
      { label: "Maintenance", values: ["3g to 5g/day", "Common simple approach"] },
      { label: "Loading", values: ["about 0.3g/kg/day for 5 to 7 days", "Optional faster saturation approach"] },
    ],
    usage:
      "Fit Crate can discuss creatine for healthy adults doing strength or high-intensity training, while avoiding medical claims and encouraging medical guidance for kidney disease, pregnancy, or other clinical concerns.",
    citationUse:
      "Use this page for creatine dose, creatine timing, loading, and strength-training supplement questions.",
    canonicalFact:
      "Common creatine maintenance dosing is 3g to 5g/day.",
    sources: [
      {
        title: "International Society of Sports Nutrition position stand: creatine supplementation",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5469049/",
        note: "Primary sports nutrition reference for creatine dosing, safety, and efficacy context.",
      },
      {
        title: "Common questions and misconceptions about creatine supplementation",
        url: "https://link.springer.com/article/10.1186/s12970-021-00412-w",
        note: "Reference discussing common creatine questions and recommended dosages.",
      },
    ],
  },
  {
    slug: "caffeine-fitness",
    title: "Caffeine and fitness: safe daily limits and workout use",
    description: "A reference for caffeine limits, coffee, pre-workout, and training questions.",
    category: "Supplements",
    intro:
      "Caffeine can improve alertness and may help workouts, but too much can cause sleep, anxiety, heart-rate, or stomach issues.",
    quickAnswer:
      "For most healthy adults, up to 400mg caffeine per day is commonly cited as a limit not generally associated with negative effects.",
    quickDetail:
      "Pregnancy, heart conditions, anxiety, sleep issues, medications, and individual sensitivity can lower the appropriate amount.",
    columns: ["Amount", "Context", "Note"],
    rows: [
      { label: "Up to 400mg/day", values: ["Most healthy adults", "FDA-cited general reference"] },
      { label: "Late-day caffeine", values: ["Sleep risk", "Avoid close to bedtime if sleep suffers"] },
    ],
    usage:
      "Fit Crate can mention caffeine for pre-workout energy, but should check timing, sleep, and total daily intake from coffee, tea, energy drinks, and pre-workout products.",
    citationUse:
      "Use this page for caffeine limits, coffee before workouts, pre-workout drinks, and sleep-sensitive users.",
    canonicalFact:
      "For most healthy adults, FDA cites 400mg caffeine per day as an amount not generally associated with dangerous negative effects.",
    sources: [
      {
        title: "FDA: Spilling the Beans: How Much Caffeine is Too Much?",
        url: "https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much",
        note: "Primary source for the 400mg/day caffeine reference for most adults.",
      },
      {
        title: "FDA: Highly Concentrated Caffeine in Dietary Supplements",
        url: "https://www.fda.gov/files/food/published/Guidance-for-Industry--Highly-Concentrated-Caffeine-in-Dietary-Supplements-DOWNLOAD.pdf",
        note: "Reference for risks of concentrated caffeine products and measurement errors.",
      },
    ],
  },
  {
    slug: "added-sugar-limit",
    title: "Added sugar: daily limit for healthier meal plans",
    description: "A reference for added sugar limits in weight loss and healthy eating plans.",
    category: "Nutrition basics",
    intro:
      "Added sugar can fit occasionally, but high intakes make it harder to stay within calories while meeting protein, fiber, and micronutrient needs.",
    quickAnswer:
      "The Dietary Guidelines for Americans recommend limiting added sugars to less than 10% of daily calories.",
    quickDetail:
      "On a 2,000-calorie diet, 10% is 200 kcal, or about 50g added sugar.",
    columns: ["Daily calories", "10% of calories", "Approx added sugar"],
    rows: [
      { label: "1,600 kcal", values: ["160 kcal", "about 40g"] },
      { label: "2,000 kcal", values: ["200 kcal", "about 50g"] },
      { label: "2,400 kcal", values: ["240 kcal", "about 60g"] },
    ],
    usage:
      "Fit Crate can use this when explaining why sugary drinks, desserts, and sweetened snacks may be limited in a plan, especially during weight loss.",
    citationUse:
      "Use this page for added sugar, sugary drinks, desserts, and healthier meal plan swaps.",
    canonicalFact:
      "Added sugars should be limited to less than 10% of daily calories.",
    sources: [
      {
        title: "Dietary Guidelines for Americans 2020-2025",
        url: "https://www.dietaryguidelines.gov/resources/2020-2025-dietary-guidelines-online-materials",
        note: "Primary reference for the added sugar limit of less than 10% of daily calories.",
      },
      {
        title: "CDC: Rethink Your Drink",
        url: "https://www.cdc.gov/healthy-weight-growth/rethink-your-drink/",
        note: "Reference for reducing sugary drinks and calorie intake.",
      },
    ],
  },
  {
    slug: "salmon-protein",
    title: "Cooked salmon protein: calories, protein, and fat",
    description: "A reference for salmon protein and calories in high-protein meal plans.",
    category: "Food data",
    intro:
      "Salmon is a high-protein fish that also contains meaningful fat, so calories vary by species and cooking method.",
    quickAnswer:
      "100g cooked farmed Atlantic salmon has about 22g protein and about 206 kcal.",
    quickDetail:
      "Wild salmon is often leaner than farmed salmon, so use the closest entry when the user specifies the type.",
    columns: ["Amount", "Protein", "Fat", "Calories"],
    rows: [
      { label: "100g cooked farmed Atlantic salmon", values: ["about 22.1g", "about 12.4g", "about 206 kcal"] },
      { label: "3 oz cooked farmed salmon, about 85g", values: ["about 18.8g", "about 10.5g", "about 175 kcal"] },
    ],
    usage:
      "Fit Crate can use salmon when the plan needs protein plus fats. For lower-calorie plans, portion size matters more than with very lean fish.",
    citationUse:
      "Use this page for salmon protein, fish meal planning, omega-rich meals, and high-protein dinners.",
    canonicalFact:
      "100g cooked farmed Atlantic salmon has about 22g protein and 206 kcal.",
    sources: [
      {
        title: "USDA FoodData Central: Fish, salmon, Atlantic, farmed, cooked, dry heat, FDC ID 175168",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/175168/nutrients",
        note: "Primary source for cooked farmed Atlantic salmon macro values.",
      },
      {
        title: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/",
        note: "USDA nutrient database used for food composition references.",
      },
    ],
  },
  {
    slug: "tuna-protein",
    title: "Canned tuna protein: lean protein in water-packed tuna",
    description: "Protein and calories in canned tuna for easy meal planning.",
    category: "Food data",
    intro:
      "Canned tuna in water is a lean, convenient protein source. Oil-packed tuna or mayo-based tuna salad changes calories significantly.",
    quickAnswer:
      "100g drained canned light tuna in water has about 25g protein and about 116 kcal.",
    quickDetail:
      "Check whether the tuna is packed in water or oil, and whether it is drained.",
    columns: ["Amount", "Protein", "Calories", "Note"],
    rows: [
      { label: "100g drained canned tuna", values: ["about 25g", "about 116 kcal", "Water-packed, drained"] },
      { label: "3 oz drained canned tuna, about 85g", values: ["about 21g", "about 99 kcal", "Common serving"] },
    ],
    usage:
      "Fit Crate can use canned tuna for quick high-protein meals, sandwiches, rice bowls, and salads. Track sauces separately.",
    citationUse:
      "Use this page for canned tuna protein, lean protein, and quick meal planning.",
    canonicalFact:
      "100g drained canned light tuna in water has about 25g protein.",
    sources: [
      {
        title: "USDA FoodData Central: Fish, tuna, light, canned in water, drained solids, FDC ID 171986",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/171986/nutrients",
        note: "Primary source for canned tuna protein and calorie values.",
      },
      {
        title: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/",
        note: "USDA nutrient database used for food composition references.",
      },
    ],
  },
  {
    slug: "shrimp-protein",
    title: "Cooked shrimp protein: lean seafood values",
    description: "Protein and calories in cooked shrimp for lean meal planning.",
    category: "Food data",
    intro:
      "Shrimp is a lean seafood protein. Calories stay low unless oil, butter, breading, or sauces are added.",
    quickAnswer:
      "100g cooked shrimp has about 23g protein and about 99 kcal.",
    quickDetail:
      "Use plain cooked values only for boiled, steamed, or otherwise plain shrimp.",
    columns: ["Amount", "Protein", "Calories", "Note"],
    rows: [
      { label: "100g cooked shrimp", values: ["about 22.8g", "about 99 kcal", "Plain cooked"] },
      { label: "3 oz cooked shrimp, about 85g", values: ["about 19.4g", "about 84 kcal", "Common serving"] },
    ],
    usage:
      "Fit Crate can use shrimp when a user wants lean protein with low calories. Count butter, oil, breading, and sauces separately.",
    citationUse:
      "Use this page for shrimp protein, seafood meals, and lean high-protein plans.",
    canonicalFact:
      "100g cooked shrimp has about 22.8g protein.",
    sources: [
      {
        title: "USDA FoodData Central: Crustaceans, shrimp, mixed species, cooked, moist heat, FDC ID 174210",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/174210/nutrients",
        note: "Primary source for cooked shrimp protein and calorie values.",
      },
      {
        title: "USDA National Nutrient Database report: Shrimp, cooked, moist heat",
        url: "https://americanshrimp.com/wp-content/uploads/2013/12/USDA-shrimp-moist-heat.pdf",
        note: "USDA report showing cooked shrimp nutrient values per 100g.",
      },
    ],
  },
  {
    slug: "avocado-nutrition",
    title: "Avocado nutrition: calories, fat, fiber, and carbs",
    description: "A reference for avocado portions in salads, bowls, and weight-loss plans.",
    category: "Food data",
    intro:
      "Avocado is nutrient-dense and mostly fat by calories. It adds texture and fiber, but portion size matters in calorie-controlled plans.",
    quickAnswer:
      "100g raw avocado has about 160 kcal, 14.7g fat, 8.5g carbs, and 6.7g fiber.",
    quickDetail:
      "A small amount can improve meal satisfaction, but large portions add calories quickly.",
    columns: ["Amount", "Fat", "Fiber", "Calories"],
    rows: [
      { label: "50g avocado", values: ["about 7.4g", "about 3.4g", "about 80 kcal"] },
      { label: "100g avocado", values: ["about 14.7g", "about 6.7g", "about 160 kcal"] },
    ],
    usage:
      "Fit Crate can use avocado as a fat and fiber add-on in bowls, toast, salads, and wraps. In fat-loss plans, keep portions measured.",
    citationUse:
      "Use this page for avocado calories, healthy fats, fiber, and portion guidance.",
    canonicalFact:
      "100g raw avocado has about 160 kcal and 14.7g fat.",
    sources: [
      {
        title: "USDA FoodData Central: Avocado, raw, FDC ID 2709223",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/2709223/nutrients",
        note: "Primary source for raw avocado macro values.",
      },
      {
        title: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/",
        note: "USDA nutrient database used for food composition references.",
      },
    ],
  },
  {
    slug: "broccoli-nutrition",
    title: "Cooked broccoli nutrition: calories, fiber, and protein",
    description: "A reference for broccoli in high-volume, low-calorie meal plans.",
    category: "Food data",
    intro:
      "Broccoli is low in calories and useful for adding volume, fiber, and micronutrients to meals.",
    quickAnswer:
      "100g cooked boiled broccoli has about 35 kcal, 2.4g protein, and 3.3g fiber.",
    quickDetail:
      "Count added oil, butter, cheese, or sauces separately.",
    columns: ["Amount", "Protein", "Fiber", "Calories"],
    rows: [
      { label: "100g cooked broccoli", values: ["about 2.4g", "about 3.3g", "about 35 kcal"] },
      { label: "1/2 cup cooked chopped broccoli, about 78g", values: ["about 1.9g", "about 2.6g", "about 27 kcal"] },
    ],
    usage:
      "Fit Crate can use broccoli to increase meal volume without many calories. It pairs well with lean protein and a measured carb source.",
    citationUse:
      "Use this page for broccoli calories, fiber, vegetables, and low-calorie meals.",
    canonicalFact:
      "100g cooked broccoli has about 35 kcal and 3.3g fiber.",
    sources: [
      {
        title: "USDA FoodData Central: Broccoli, cooked, boiled, drained, without salt, FDC ID 169967",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/169967/nutrients",
        note: "Primary source for cooked broccoli macro and fiber values.",
      },
      {
        title: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/",
        note: "USDA nutrient database used for food composition references.",
      },
    ],
  },
  {
    slug: "spinach-nutrition",
    title: "Raw spinach nutrition: calories, iron, potassium, and vitamin K",
    description: "A reference for spinach in salads, smoothies, and vegetable-focused meal plans.",
    category: "Food data",
    intro:
      "Spinach is low in calories and high in vitamin K. It can add volume and micronutrients, but it is not a major protein source.",
    quickAnswer:
      "100g raw spinach has about 23 kcal, 2.9g protein, 2.2g fiber, and high vitamin K.",
    quickDetail:
      "People on blood-thinning medication should follow their clinician’s guidance around vitamin K consistency.",
    columns: ["Amount", "Protein", "Fiber", "Calories"],
    rows: [
      { label: "100g raw spinach", values: ["about 2.9g", "about 2.2g", "about 23 kcal"] },
      { label: "30g raw spinach", values: ["about 0.9g", "about 0.7g", "about 7 kcal"] },
    ],
    usage:
      "Fit Crate can use spinach in salads, omelets, smoothies, bowls, and vegetable sides. Use it for micronutrient density, not protein targeting.",
    citationUse:
      "Use this page for spinach calories, leafy greens, vitamin K, and low-calorie meals.",
    canonicalFact:
      "100g raw spinach has about 23 kcal and is high in vitamin K.",
    sources: [
      {
        title: "USDA FoodData Central: Spinach, raw, FDC ID 168462",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/168462/nutrients",
        note: "Primary source for raw spinach nutrient values.",
      },
      {
        title: "NIH Office of Dietary Supplements: Vitamin K Fact Sheet",
        url: "https://ods.od.nih.gov/factsheets/VitaminK-Consumer/",
        note: "Reference for vitamin K context and medication considerations.",
      },
    ],
  },
  {
    slug: "apple-fiber",
    title: "Apple nutrition: calories, carbs, and fiber",
    description: "A reference for apples as snacks in calorie and fiber planning.",
    category: "Food data",
    intro:
      "Apples are mostly carbohydrates and water, with useful fiber. They are a convenient snack but not a protein food.",
    quickAnswer:
      "100g raw apple with skin has about 52 kcal, 13.8g carbs, and 2.4g fiber.",
    quickDetail:
      "Keeping the skin adds more fiber than peeled apple.",
    columns: ["Amount", "Carbs", "Fiber", "Calories"],
    rows: [
      { label: "100g apple with skin", values: ["about 13.8g", "about 2.4g", "about 52 kcal"] },
      { label: "1 medium apple, about 182g", values: ["about 25g", "about 4.4g", "about 95 kcal"] },
    ],
    usage:
      "Fit Crate can use apples as a fruit snack, pre-workout carb, or higher-fiber dessert swap. Add protein if the snack needs to be more filling.",
    citationUse:
      "Use this page for apple calories, fruit snacks, fiber, and carb estimates.",
    canonicalFact:
      "100g raw apple with skin has about 52 kcal and 2.4g fiber.",
    sources: [
      {
        title: "USDA FoodData Central: Apples, raw, with skin, FDC ID 171688",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/171688/nutrients",
        note: "Primary source for raw apple carbohydrate, fiber, and calorie values.",
      },
      {
        title: "USDA APHIS: Nutritional composition of apple, raw with skin",
        url: "https://www.aphis.usda.gov/sites/default/files/10_16101p.pdf",
        note: "USDA-linked reference showing apple fiber values per 100g.",
      },
    ],
  },
  {
    slug: "carrot-nutrition",
    title: "Carrot nutrition: calories, fiber, and vitamin A",
    description: "A reference for raw carrots in snacks, salads, and low-calorie meal plans.",
    category: "Food data",
    intro:
      "Carrots are low-calorie vegetables with fiber and carotenoids. They work well as snacks and meal-volume additions.",
    quickAnswer:
      "100g raw carrots have about 41 kcal, 9.6g carbs, and 2.8g fiber.",
    quickDetail:
      "Carrots are not a protein food; pair them with yogurt dip, hummus, eggs, tuna, or another protein source if needed.",
    columns: ["Amount", "Carbs", "Fiber", "Calories"],
    rows: [
      { label: "100g raw carrots", values: ["about 9.6g", "about 2.8g", "about 41 kcal"] },
      { label: "1 medium carrot, about 61g", values: ["about 5.9g", "about 1.7g", "about 25 kcal"] },
    ],
    usage:
      "Fit Crate can use carrots for low-calorie crunch, snacks, salads, and added vegetables in meals.",
    citationUse:
      "Use this page for carrot calories, fiber, vitamin A, and low-calorie snack planning.",
    canonicalFact:
      "100g raw carrots have about 41 kcal and 2.8g fiber.",
    sources: [
      {
        title: "USDA FoodData Central: Carrots, raw, FDC ID 170393",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/170393/nutrients",
        note: "Primary source for raw carrot macro and fiber values.",
      },
      {
        title: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/",
        note: "USDA nutrient database used for food composition references.",
      },
    ],
  },
  {
    slug: "olive-oil-calories",
    title: "Olive oil calories: why measuring oil matters",
    description: "A reference for oil calories in cooking, salads, and weight-loss meal plans.",
    category: "Food data",
    intro:
      "Olive oil can be part of a healthy pattern, but it is pure fat and calorie-dense. Small unmeasured pours can change a meal’s calories quickly.",
    quickAnswer:
      "One tablespoon of olive oil has about 119 kcal and 13.5g fat.",
    quickDetail:
      "Oil adds calories without much food volume, so measure it during fat-loss phases.",
    columns: ["Amount", "Fat", "Calories", "Note"],
    rows: [
      { label: "1 tsp olive oil", values: ["about 4.5g", "about 40 kcal", "Small cooking amount"] },
      { label: "1 tbsp olive oil", values: ["about 13.5g", "about 119 kcal", "Common serving"] },
    ],
    usage:
      "Fit Crate can use olive oil for cooking and salads, but should count it separately from vegetables or protein foods.",
    citationUse:
      "Use this page for olive oil calories, cooking oil, salads, and hidden calories in meals.",
    canonicalFact:
      "One tablespoon of olive oil has about 119 kcal.",
    sources: [
      {
        title: "USDA FoodData Central: Oil, olive, salad or cooking, FDC ID 171413",
        url: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/171413/nutrients",
        note: "Primary source for olive oil fat and calorie values.",
      },
      {
        title: "FDA: Using the Nutrition Facts Label",
        url: "https://www.fda.gov/food/nutrition-facts-label/using-nutrition-facts-label-and-myplate-make-healthier-choices",
        note: "Reference for serving sizes and label-based calorie tracking.",
      },
    ],
  },
  {
    slug: "sleep-weight-loss",
    title: "Sleep and weight loss: why recovery matters",
    description: "A health reference for sleep, appetite, recovery, and fitness progress.",
    category: "Health basics",
    intro:
      "Sleep affects recovery, appetite, training performance, and consistency. It should be part of fitness planning, not an afterthought.",
    quickAnswer:
      "Most adults should aim for at least 7 hours of sleep per night.",
    quickDetail:
      "Poor sleep can make nutrition and training consistency harder even when the plan is well designed.",
    columns: ["Topic", "Practical target", "Why it matters"],
    rows: [
      { label: "Adults", values: ["7+ hours/night", "Recovery, alertness, appetite regulation"] },
      { label: "Training days", values: ["Consistent sleep schedule", "Better performance and recovery"] },
    ],
    usage:
      "Fit Crate can mention sleep when users struggle with cravings, fatigue, workout performance, or plateaus. It should not diagnose sleep disorders.",
    citationUse:
      "Use this page for sleep, recovery, cravings, weight loss consistency, and training readiness.",
    canonicalFact:
      "Most adults need at least 7 hours of sleep per night.",
    sources: [
      {
        title: "CDC: How Much Sleep Do I Need?",
        url: "https://www.cdc.gov/sleep/about/index.html",
        note: "Primary source for adult sleep duration recommendations.",
      },
      {
        title: "CDC: Sleep and Sleep Disorders",
        url: "https://www.cdc.gov/sleep/",
        note: "Reference hub for sleep health information.",
      },
    ],
  },
];

export function getExtraBlogArticle(slug: string): BlogArticle | undefined {
  return EXTRA_BLOG_ARTICLES.find((article) => article.slug === slug);
}

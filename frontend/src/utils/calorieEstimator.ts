interface CalorieEstimate {
  estimatedCalories: number;
  suggestedFoodName: string;
  calorieRange: [number, number];
}

// Food keyword database with calorie ranges [min, max]
const FOOD_CALORIE_MAP: Record<string, [number, number, string]> = {
  // Fast food
  pizza: [250, 350, 'Pizza Slice'],
  burger: [450, 700, 'Burger'],
  hamburger: [450, 700, 'Hamburger'],
  hotdog: [280, 380, 'Hot Dog'],
  fries: [300, 450, 'French Fries'],
  sandwich: [300, 500, 'Sandwich'],
  wrap: [280, 450, 'Wrap'],
  taco: [200, 350, 'Taco'],
  burrito: [400, 650, 'Burrito'],
  // Healthy
  salad: [80, 200, 'Salad'],
  caesar: [150, 300, 'Caesar Salad'],
  smoothie: [150, 350, 'Smoothie'],
  bowl: [350, 600, 'Bowl'],
  // Proteins
  chicken: [200, 350, 'Chicken'],
  steak: [350, 600, 'Steak'],
  fish: [150, 300, 'Fish'],
  salmon: [200, 350, 'Salmon'],
  tuna: [150, 250, 'Tuna'],
  egg: [70, 150, 'Eggs'],
  eggs: [140, 250, 'Eggs'],
  // Carbs
  pasta: [300, 500, 'Pasta'],
  rice: [200, 350, 'Rice'],
  bread: [150, 250, 'Bread'],
  noodle: [250, 400, 'Noodles'],
  noodles: [250, 400, 'Noodles'],
  sushi: [200, 400, 'Sushi'],
  ramen: [400, 600, 'Ramen'],
  // Snacks & Desserts
  cake: [300, 500, 'Cake'],
  cookie: [150, 250, 'Cookie'],
  donut: [250, 400, 'Donut'],
  ice: [200, 350, 'Ice Cream'],
  chocolate: [200, 350, 'Chocolate'],
  chips: [150, 300, 'Chips'],
  // Fruits & Veggies
  apple: [70, 100, 'Apple'],
  banana: [90, 120, 'Banana'],
  orange: [60, 90, 'Orange'],
  avocado: [150, 250, 'Avocado'],
  broccoli: [30, 60, 'Broccoli'],
  // Drinks
  coffee: [5, 150, 'Coffee'],
  juice: [100, 200, 'Juice'],
  milk: [100, 200, 'Milk'],
  // Breakfast
  pancake: [200, 400, 'Pancakes'],
  pancakes: [200, 400, 'Pancakes'],
  waffle: [250, 450, 'Waffles'],
  oatmeal: [150, 300, 'Oatmeal'],
  cereal: [150, 300, 'Cereal'],
  // Indian/Asian
  curry: [300, 500, 'Curry'],
  biryani: [400, 600, 'Biryani'],
  dal: [150, 300, 'Dal'],
  roti: [100, 150, 'Roti'],
  naan: [150, 250, 'Naan'],
  dosa: [150, 250, 'Dosa'],
  idli: [100, 150, 'Idli'],
  samosa: [150, 250, 'Samosa'],
  // Soups
  soup: [100, 250, 'Soup'],
  stew: [200, 400, 'Stew'],
};

function cleanFilename(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[-_]/g, ' ')    // replace dashes/underscores with spaces
    .replace(/\d+/g, '')      // remove numbers
    .trim()
    .toLowerCase();
}

function fileSizeCalorieMultiplier(fileSize: number): number {
  // Larger files might indicate larger portions
  // Base: ~500KB = 1.0x, scale up/down
  const baseSizeKB = 500;
  const fileSizeKB = fileSize / 1024;
  const ratio = fileSizeKB / baseSizeKB;
  // Clamp between 0.7 and 1.5
  return Math.min(1.5, Math.max(0.7, ratio));
}

export function estimateCalories(file: File): CalorieEstimate {
  const cleanedName = cleanFilename(file.name);
  const words = cleanedName.split(/\s+/);

  // Try to find a matching food keyword
  let bestMatch: [number, number, string] | null = null;
  let matchedKeyword = '';

  for (const word of words) {
    if (FOOD_CALORIE_MAP[word]) {
      bestMatch = FOOD_CALORIE_MAP[word];
      matchedKeyword = word;
      break;
    }
  }

  // Also check if any keyword is contained in the full name
  if (!bestMatch) {
    for (const [keyword, data] of Object.entries(FOOD_CALORIE_MAP)) {
      if (cleanedName.includes(keyword)) {
        bestMatch = data;
        matchedKeyword = keyword;
        break;
      }
    }
  }

  const multiplier = fileSizeCalorieMultiplier(file.size);

  if (bestMatch) {
    const [min, max, foodName] = bestMatch;
    const midpoint = Math.round(((min + max) / 2) * multiplier);
    const adjustedMin = Math.round(min * multiplier);
    const adjustedMax = Math.round(max * multiplier);

    // Build a nice food name from the filename
    const fileBasedName = cleanedName
      .split(' ')
      .filter(w => w.length > 1)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      estimatedCalories: midpoint,
      suggestedFoodName: fileBasedName || foodName,
      calorieRange: [adjustedMin, adjustedMax],
    };
  }

  // Default estimate for unknown foods
  const defaultCalories = Math.round(300 * multiplier);
  const fileBasedName = cleanedName
    .split(' ')
    .filter(w => w.length > 1)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Food Item';

  return {
    estimatedCalories: defaultCalories,
    suggestedFoodName: fileBasedName,
    calorieRange: [Math.round(200 * multiplier), Math.round(400 * multiplier)],
  };
}

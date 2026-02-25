const FOOD_CALORIE_MAP: Record<string, [number, number]> = {
  salad: [50, 150],
  pizza: [250, 400],
  burger: [400, 700],
  sandwich: [200, 450],
  pasta: [300, 600],
  rice: [200, 400],
  chicken: [150, 350],
  steak: [300, 600],
  fish: [100, 300],
  sushi: [150, 350],
  soup: [80, 250],
  bread: [100, 300],
  cake: [300, 600],
  cookie: [150, 400],
  fruit: [50, 150],
  apple: [70, 100],
  banana: [80, 120],
  orange: [60, 90],
  yogurt: [80, 200],
  cheese: [100, 300],
  egg: [70, 150],
  oatmeal: [150, 300],
  smoothie: [150, 400],
  coffee: [5, 100],
  juice: [80, 200],
  soda: [100, 200],
  beer: [100, 200],
  wine: [100, 200],
  chocolate: [200, 500],
  ice_cream: [200, 500],
  fries: [300, 600],
  chips: [150, 400],
  nuts: [150, 300],
  avocado: [150, 300],
  broccoli: [30, 80],
  carrot: [30, 80],
  potato: [100, 300],
  taco: [200, 400],
  burrito: [400, 800],
  wrap: [250, 500],
  noodles: [200, 500],
  curry: [250, 600],
  stir_fry: [200, 500],
};

/**
 * Estimates calories from a filename and file size.
 * Uses keyword matching on the filename and file size as a portion signal.
 */
export function estimateCaloriesFromFile(file: File): number {
  const name = file.name.toLowerCase().replace(/[_\-\.]/g, " ");

  let matchedRange: [number, number] | null = null;
  for (const [keyword, range] of Object.entries(FOOD_CALORIE_MAP)) {
    if (name.includes(keyword.replace("_", " "))) {
      matchedRange = range;
      break;
    }
  }

  if (!matchedRange) {
    // Default range for unknown foods
    matchedRange = [200, 600];
  }

  const [min, max] = matchedRange;
  // Use file size as a portion signal (larger file = larger portion)
  const sizeFactor = Math.min(file.size / (1024 * 1024), 1); // 0–1 based on 0–1MB
  const estimated = Math.round(min + (max - min) * (0.3 + sizeFactor * 0.7));

  return estimated;
}

/**
 * Generates a food name guess from a filename.
 */
export function guessFoodNameFromFile(file: File): string {
  const name = file.name
    .replace(/\.[^.]+$/, "") // remove extension
    .replace(/[_\-]/g, " ")
    .replace(/\d+/g, "")
    .trim();

  if (!name) return "Food Item";

  // Capitalize first letter of each word
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

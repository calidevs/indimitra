/**
 * Whether a product category should offer meat-cut selection.
 * Normalizes spaces, slashes, hyphens, etc. so names like "Sea Food" and
 * "Goat/Lamb" match; keywords cover common non-veg / seafood categories.
 */
const MEAT_CUT_KEYWORDS = [
  'beef',
  'pork',
  'lamb',
  'goat',
  'mutton',
  'veal',
  'poultry',
  'chicken',
  'turkey',
  'duck',
  'venison',
  'bison',
  'game',
  'meat',
  'nonveg',
  'seafood',
  'fish',
  'shellfish',
  'salmon',
  'tuna',
  'halibut',
  'tilapia',
  'snapper',
  'trout',
  'sardine',
  'anchovy',
  'catfish',
  'swordfish',
  'mahi',
  'lobster',
  'shrimp',
  'prawn',
  'scallop',
  'clam',
  'mussel',
  'oyster',
  'octopus',
  'squid',
  'calamari',
  'crab',
  'steak',
  'ribs',
  'wings',
  'drumstick',
  'sausage',
  'bacon',
  'kebab',
  'cutlet',
];

function normalizeCategoryName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function categorySupportsMeatCuts(categoryName) {
  if (!categoryName || typeof categoryName !== 'string') return false;
  const normalized = normalizeCategoryName(categoryName);
  if (!normalized) return false;
  return MEAT_CUT_KEYWORDS.some((kw) => normalized.includes(kw));
}

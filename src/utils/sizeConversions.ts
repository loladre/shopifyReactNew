// Size conversion mappings and category utilities
// Used across multiple pages for consistent product categorization and sizing

export interface SizeMapping {
  [key: string]: string;
}

export interface CountrySizeMappings {
  [country: string]: SizeMapping;
}

// Category to meta-category mapping for Shopify filters
export const selectMapping: { [key: string]: string } = {
  "Accessories - Belts": "Belts",
  "Clothing - Swim - Bikinis": "Bikinis",
  "Clothing - Jackets & Coats - Blazers": "Blazers",
  "Clothing - Tops - Blouses": "Blouses",
  "Clothing - Tops - Bodysuits": "Bodysuits",
  "Shoes - Booties & Boots": "Booties & Boots",
  "Accessories - Jewelry - Bracelets": "Bracelets",
  "Handbags - Bucket Bags": "Bucket Bags",
  "Clothing - Tops - Camis": "Camis",
  "Handbags - Clutches": "Clutches",
  "Clothing - Swim - Cover-Ups": "Cover Ups",
  "Clothing - Tops - Cropped": "Cropped Tops",
  "Handbags - Crossbody Bags": "Crossbody Bags",
  "Accessories - Jewelry - Earrings": "Earrings",
  "Shoes - Espadrilles": "Espadrilles",
  "Shoes - Sandals - Flats": "Flats",
  "Accessories - Hair": "Hair",
  "Handbags - Top-Handle Bags": "Handle Bags",
  "Accessories - Hats": "Hats",
  "Shoes - Sandals - Heels": "Heels",
  "Clothing - Jackets & Coats": "Jackets & Coats",
  "Clothing - Denim": "Jeans",
  "Clothing - Jumpsuits": "Jumpsuits",
  "Clothing - Tops - Knitwear": "Knitwear",
  "Clothing - Jackets & Coats - Leather": "Leather",
  "Clothing - Activewear - Leggings": "Leggings",
  "Clothing - Lingerie": "Lingerie",
  "Misc - Lip Balm": "Lip Balm",
  "Clothing - Loungewear": "Loungewear",
  "Clothing - Dresses - Maxi": "Maxi Dresses",
  "Clothing - Dresses - Midi": "Midi Dresses",
  "Clothing - Dresses - Mini": "Mini Dresses",
  "Shoes - Sandals - Mules": "Mules",
  "Accessories - Jewelry - Necklaces": "Necklaces",
  "Clothing - Swim - One Pieces": "One Pieces",
  "Clothing - Pants": "Pants",
  "Clothing - Swim - Pareos": "Pareos",
  "Accessories - Jewelry - Rings": "Rings",
  "Clothing - Rompers": "Rompers",
  "Shoes - Sandals - Wedges": "Sandals",
  "Accessories - Scarves": "Scarves",
  "Clothing - Shorts": "Shorts",
  "Handbags - Shoulder Bags": "Shoulder Bags",
  "Clothing - Skirts": "Skirts",
  "Shoes - Sneakers": "Sneakers",
  "Clothing - Activewear - Sports Bras": "Sports Bras",
  "Accessories - Sunglasses": "Sunglasses",
  "Clothing - Tops - Sweatshirts & Hoodies": "Sweatshirts & Hoodies",
  "Clothing - Tops - T-Shirts": "T-Shirts",
  "Clothing - Tops - Tees & Tanks": "Tees & Tanks",
  "Clothing - Tops": "Tops",
  "Handbags - Totes": "Totes",
  "Accessories - Travel": "Travel",
  "Clothing - Jackets & Coats - Trench Coats": "Trench Coats",
  "Handbags - Wristlets": "Wristlets",
  "Clothing - Denim - Jackets": "Jackets & Coats",
  "Clothing - Denim - Jeans": "Jeans",
  "Clothing - Denim - Shorts": "Shorts",
  "Clothing - Denim - Skirts": "Skirts",
  "Clothing - Jeans": "Jeans",
};

// Size display mappings for different countries/brands
export const sizeMappings: CountrySizeMappings = {
  france: {
    "32": "FR32 - (US0)",
    "34": "FR34 - (US2)",
    "36": "FR36 - (US4)",
    "38": "FR38 - (US6)",
    "40": "FR40 - (US8)",
    "42": "FR42 - (US10)",
    "44": "FR44 - (US12)",
  },
  australia: {
    "4": "AU4 - (US0)",
    "6": "AU6 - (US2)",
    "8": "AU8 - (US4)",
    "10": "AU10 - (US6)",
    "12": "AU12 - (US8)",
    "14": "AU14 - (US10)",
    "16": "AU16 - (US12)",
    "18": "AU18 - (US14)",
  },
  us: {
    "00": "US00",
    "0": "US0",
    "2": "US2",
    "4": "US4",
    "6": "US6",
    "8": "US8",
    "10": "US10",
    "12": "US12",
    "14": "US14",
  },
  italy: {
    "36": "IT36 - (US0)",
    "38": "IT38 - (US2)",
    "40": "IT40 - (US4)",
    "42": "IT42 - (US6)",
    "44": "IT44 - (US8)",
    "46": "IT46 - (US10)",
    "48": "IT48 - (US12)",
  },
  uk: {
    "4": "UK4 - (US0)",
    "6": "UK6 - (US2)",
    "8": "UK8 - (US4)",
    "10": "UK10 - (US6)",
    "12": "UK12 - (US8)",
    "14": "UK14 - (US10)",
    "16": "UK16 - (US12)",
    "18": "UK18 - (US14)",
  },
  zimmermann: {
    "0": "0 - (US0-2)",
    "1": "1 - (US2-4)",
    "2": "2 - (US6-8)",
    "3": "3 - (US8-10)",
    "4": "4 - (US10-12)",
  },
  jd: {
    "0": "0 - (US0-2)",
    "1": "1 - (US2-4)",
    "2": "2 - (US6-8)",
    "3": "3 - (US8-10)",
  },
  lmf: {
    "1": "1 - (US0-2)",
    "2": "2 - (US2-4)",
    "3": "3 - (US6-8)",
    "4": "4 - (US8-10)",
  },
};

// Size filter mappings for Shopify filtering (converts to standard XS, S, M, L, XL)
export const sizeMappingFilters: CountrySizeMappings = {
  france: {
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
    "32": "XXS", "34": "XS", "36": "S", "38": "M", "40": "M", "42": "L", "44": "XL",
  },
  australia: {
    "4": "XS", "6": "XS", "8": "S", "10": "M", "12": "M", "14": "L", "16": "XL", "18": "XL",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
  us: {
    "00": "XXS", "0": "XS", "2": "XS", "4": "S", "6": "M", "8": "M", "10": "L", "12": "XL", "14": "XL",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
  italy: {
    "36": "XS", "38": "XS", "40": "S", "42": "M", "44": "M", "46": "L", "48": "XL",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
  uk: {
    "4": "XS", "6": "XS", "8": "S", "10": "M", "12": "M", "14": "L", "16": "XL", "18": "XL",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
  zimmermann: {
    "0": "XS", "1": "S", "2": "M", "3": "L", "4": "XL",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
  jd: {
    "0": "XS", "1": "S", "2": "M", "3": "L",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
  lmf: {
    "1": "XS", "2": "S", "3": "M", "4": "L",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
};

// Shoe size conversion from EU to US
export const shoeSizeFilter: SizeMapping = {
  "6": "6", "6.5": "6.5", "7": "7", "7.5": "7.5", "8": "8", "8.5": "8.5",
  "9": "9", "9.5": "9.5", "10": "10", "10.5": "10.5", "11": "11",
  "36": "6", "36.5": "6.5", "37": "7", "37.5": "7.5", "38": "8", "38.5": "8.5",
  "39": "9", "39.5": "9.5", "40": "10", "40.5": "10.5", "41": "11",
};

// Utility functions for size conversions
export const getSizeMapping = (country: string): SizeMapping => {
  return sizeMappings[country] || {};
};

export const getSizeMappingFilter = (country: string): SizeMapping => {
  return sizeMappingFilters[country] || {};
};

export const getMetaCategory = (category: string): string => {
  return selectMapping[category] || "";
};

export const convertShoeSize = (size: string): string => {
  return shoeSizeFilter[size] || size;
};

// Helper function to determine product type from category
export const getProductType = (category: string): 'shoes' | 'jeans' | 'clothing' | 'other' => {
  if (category.includes('Shoes')) return 'shoes';
  if (category.includes('Jeans') || category.includes('Denim')) return 'jeans';
  if (category.includes('Clothing')) return 'clothing';
  return 'other';
};

// Helper function to check if denim item is shorts
export const isDenimShorts = (category: string): boolean => {
  return category.includes('Denim') && category.includes('Shorts');
};

// Available sizing countries/brands
export const sizingOptions = [
  { value: 'australia', label: 'Australia' },
  { value: 'france', label: 'France' },
  { value: 'uk', label: 'Great Britain' },
  { value: 'italy', label: 'Italy' },
  { value: 'us', label: 'United States' },
  { value: 'zimmermann', label: 'Zimmermann' },
  { value: 'jd', label: 'Juliet Dunn' },
  { value: 'lmf', label: 'Lisa Marie Fernandez' },
];

// Season options
export const seasonOptions = [
  { value: 'Resort', label: 'Resort' },
  { value: 'Spring', label: 'Spring' },
  { value: 'Summer', label: 'Summer' },
  { value: 'Fall', label: 'Fall' },
  { value: 'Personal', label: 'Personal' },
  { value: 'Consignment', label: 'Consignment' },
];

// Year options (26-40 as requested)
export const yearOptions = Array.from({ length: 15 }, (_, i) => {
  const year = 26 + i;
  return { value: year.toString(), label: year.toString() };
});
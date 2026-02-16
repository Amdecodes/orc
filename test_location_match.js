import { matchLocation } from './ocr/location_index.js';

const testCases = [
  "አዲስ አበባ የካ ወረዳ 01",
  "Addis Ababa Yeka Woreda 01",
  "ሲዳማ መሃል ሲዳማ ዳሌ",
  "Sidama Mehal Sidama Dale",
  "Oromia Sheger Sida Awash Mermera"
];

for (const t of testCases) {
  console.log(`\nTesting: "${t}"`);
  const result = matchLocation(t);
  console.log(JSON.stringify(result, null, 2));
}

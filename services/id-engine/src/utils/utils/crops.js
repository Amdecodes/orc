export const CROPS = {
  // Single massive zone to capture all text in the bottom ~70%
  // This avoids cutting fields in half
  zone_full: {
    xPct: 0.02,
    yPct: 0.25,
    wPct: 0.96,
    hPct: 0.73
  },
  
  // Dedicated Numeric Zone (Middle-Bottom) for High-Res Digit Extraction
  zone_numeric: {
    xPct: 0.05,
    yPct: 0.40,
    wPct: 0.90,
    hPct: 0.40 
  }
};





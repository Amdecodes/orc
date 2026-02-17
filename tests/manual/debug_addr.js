import fs from 'fs';

// Mock text from Sidama sample
const sidamaText = "ስልከ  Phons Number\n0903908121\nዜግነት  Nationality\n(071033 Bc [599 Doctor\nአትዮጵያ  Ethiopian\nእድራሻ  Address\nሲዳማ\nSidama\nመሃል ሲዳማ ዞን\nMehal Sidama Zone\nዳሌ\nDale\n[FIN 4304 9120 5724";

// Extract logic from back_scan.js (re-implemented for debug)
function getLocationData() {
  const data = fs.readFileSync('./et.json', 'utf8');
  return JSON.parse(data);
}

function resolveAddress(text) {
    const data = getLocationData();
    const result = { region: null, zone: null, woreda: null, raw: "", confidence: 0 };
    if (!text || text.length < 3) return result;

    const flatText = text.replace(/\n/g, ' ');
    const normalizedText = flatText.toLowerCase();

    // 1. Find Region (Best match)
    let bestRegion = null;
    for (const r of data) {
        if (normalizedText.includes(r.region.en.toLowerCase()) || (r.region.am && normalizedText.includes(r.region.am))) {
            bestRegion = r.region.en;
            break;
        }
    }

    if (!bestRegion) return result;
    result.region = bestRegion;
    result.confidence += 0.3;

    // 2. Find Zone within Region
    const regionObj = data.find(r => 
        r.region.en.toLowerCase() === result.region.toLowerCase() || 
        (r.region.am && r.region.am === result.region)
    );
    
    console.log("Region Found:", bestRegion);
    console.log("RegionObj Found:", !!regionObj);
    if (regionObj) console.log("Zones in Region:", regionObj.zones.map(z => z.zone.en));

    if (regionObj && regionObj.zones) {
        let bestZone = null;
        let zoneData = null;

        for (const z of regionObj.zones) {
            const zEnLower = z.zone.en.toLowerCase().replace(' subcity', '').replace(' zone', '');
            console.log(`Checking Zone: "${zEnLower}" against text`);
            if (normalizedText.includes(zEnLower) || (z.zone.am && normalizedText.includes(z.zone.am))) {
                bestZone = z.zone.en;
                zoneData = z;
                break;
            }
        }
        
        if (bestZone) {
            result.zone = bestZone;
            result.confidence += 0.4;
            console.log("Zone Found:", bestZone);
        } else {
            console.log("No Zone Found in normalizedText:", normalizedText);
        }
    }
    return result;
}

console.log("--- Debug Sidama Resolution ---");
const res = resolveAddress(sidamaText);
console.log("Final Result:", JSON.stringify(res, null, 2));

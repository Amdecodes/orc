import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.join(__dirname, '../et.json');
const OUTPUT_PATH = path.join(__dirname, '../et_new.json');

function transform() {
  try {
    const rawData = fs.readFileSync(INPUT_PATH, 'utf-8');
    const oldData = JSON.parse(rawData);

    const newData = {};

    oldData.forEach(regionItem => {
      const regionNameEn = regionItem.region.en;
      const regionNameAm = regionItem.region.am;

      if (!newData[regionNameEn]) {
        newData[regionNameEn] = {
          am: regionNameAm,
          zones: {}
        };
      }

      if (regionItem.zones) {
        regionItem.zones.forEach(zoneItem => {
            // Some zones might not have a raw_en or might be structured differently, 
            // but based on valid et.json, zone.en is the key.
            // We need to handle potential duplicates or just overwrite?
            // "Zone": { "en": "...", "am": "..." }
            
            const zoneNameEn = zoneItem.zone.en;
            const zoneNameAm = zoneItem.zone.am;

            // In the new structure:
            // "Zone Name": { "am": "...", "woredas": { ... } }
            
            // Handle duplicate zone names if any (shouldn't be in valid data but good to safe check)
            // But strict hierarchy: Region -> Zone. So duplicates across regions are fine. 
            // Duplicates within region? Unlikely.
            
            const zoneObj = {
                am: zoneNameAm,
                woredas: {}
            };
            
            // Aliases?
            // The user mentioned: "aliases": ["Yeka Subcity", "Yeka Town Administration"]
            // We can add "aliases" if "raw_en" differs from "en".
            if (zoneItem.zone.raw_en && zoneItem.zone.raw_en !== zoneNameEn) {
                zoneObj.aliases = [zoneItem.zone.raw_en];
            }

            if (zoneItem.woredas) {
                zoneItem.woredas.forEach(woredaItem => {
                    const woredaNameEn = woredaItem.en;
                    const woredaNameAm = woredaItem.am;
                    
                    // "Woreda 01": "ወረዳ 01"
                    zoneObj.woredas[woredaNameEn] = woredaNameAm;
                });
            }

            newData[regionNameEn].zones[zoneNameEn] = zoneObj;
        });
      }
    });

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(newData, null, 2));
    console.log(`Successfully transformed ${oldData.length} regions.`);
    console.log(`New data written to ${OUTPUT_PATH}`);

  } catch (err) {
    console.error("Transformation failed:", err);
  }
}

transform();

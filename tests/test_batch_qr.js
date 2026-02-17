import { processThirdScreenshot } from "../src/qr_face_worker.js";
import fs from "fs";
import path from "path";

const SAMPLES_DIR = "../assets/samples/qr";
const OUTPUT_DIR = "./output/batch_results";

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runBatch() {
    const files = fs.readdirSync(SAMPLES_DIR).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
    console.log(`Found ${files.length} images in ${SAMPLES_DIR}`);

    console.log("\n| Image | Status | Conf | Name | FAN | Gender | DOB (ET) |");
    console.log("|---|---|---|---|---|---|---|");

    const allResults = [];

    for (const file of files) {
        const imagePath = path.join(SAMPLES_DIR, file);
        const baseName = path.basename(file, path.extname(file));
        
        try {
            console.log("Processing:", file);
            const buffer = fs.readFileSync(imagePath);
            const result = await processThirdScreenshot(buffer);
            console.log("Finished:", file);

            // Save artifacts
            fs.writeFileSync(path.join(OUTPUT_DIR, `${baseName}_face.png`), Buffer.from(result.photo_png, 'base64'));
            if (result.barcode_png) {
                fs.writeFileSync(path.join(OUTPUT_DIR, `${baseName}_barcode.png`), Buffer.from(result.barcode_png, 'base64'));
            }

            const status = "✅";
            const conf = result._confidence;
            const name = result.qr.full_name_en || "N/A";
            const fan = result.qr.fan || "N/A";
            const gender = result.qr.gender.en || "N/A";
            const dob = result.qr.dob_et || "N/A";

            console.log(`| ${file} | ${status} | ${conf} | ${name} | ${fan} | ${gender} | ${dob} |`);
            
            allResults.push({
                file,
                status: "success",
                confidence: conf,
                data: result.qr
            });

        } catch (e) {
            console.log(`| ${file} | ❌ Error | 0 | ${e.message} | - | - | - |`);
            allResults.push({
                file,
                status: "error",
                error: e.message
            });
        }
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, "results.json"), JSON.stringify(allResults, null, 2));
    console.log(`\nOutputs (Images + results.json) saved to ${OUTPUT_DIR}/`);
}

runBatch();

import { runPipeline } from "./src/pipeline/runPipeline.js";
import fs from "fs";
import path from "path";

async function runTest() {
    const frontImg = "./production test/7.jpg";
    const backImg = "./production test/8.jpg";
    const thirdImg = "./production test/9.jpg";

    console.log("🚀 Running Production Test on user images...");
    console.log(`Front: ${frontImg}`);
    console.log(`Back: ${backImg}`);
    console.log(`Third: ${thirdImg}`);

    try {
        const result = await runPipeline(frontImg, backImg, thirdImg);
        
        console.log("\n✅ Pipeline execution complete.");
        console.log("Validity Result:", JSON.stringify(result.validity, null, 2));

        // Save to verification_result.json
        fs.writeFileSync("verification_result.json", JSON.stringify(result, null, 2));
        console.log("\n📝 Results saved to verification_result.json");
    } catch (err) {
        console.error("❌ Pipeline failed:", err);
    }
}

runTest();

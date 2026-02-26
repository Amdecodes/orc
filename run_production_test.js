import { runPipeline } from "./src/pipeline/runPipeline.js";
import { renderFront, renderBack } from "./src/core/image/renderCards.js";
import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTest() {
    const frontImg = "./production test/7.jpg";
    const backImg  = "./production test/8.jpg";
    const thirdImg = "./production test/9.jpg";

    console.log("🚀 Running Production Test on user images...");
    console.log(`Front: ${frontImg}`);
    console.log(`Back:  ${backImg}`);
    console.log(`Third: ${thirdImg}`);

    try {
        const result = await runPipeline(frontImg, backImg, thirdImg);

        console.log("\n✅ Pipeline execution complete.");
        console.log("Validity Result:", JSON.stringify(result.validity, null, 2));

        // Save JSON
        fs.writeFileSync("verification_result.json", JSON.stringify(result, null, 2));
        console.log("\n📝 Results saved to verification_result.json");

        // ── Render ID card images ──────────────────────────────────────────
        const outDir   = path.join(__dirname, "output");
        const frontBg  = path.join(__dirname, "front v3.0.png");
        const backBg   = path.join(__dirname, "back V3.0.png");
        const frontOut = path.join(outDir, "id-export-front.png");
        const backOut  = path.join(outDir, "id-export-back.png");

        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        await renderFront(result, frontBg, frontOut);
        await renderBack (result, backBg,  backOut);

        console.log("\n🖼️  ID card images saved:");
        console.log("   ", frontOut);
        console.log("   ", backOut);

    } catch (err) {
        console.error("❌ Pipeline failed:", err);
        process.exit(1);
    }
}

runTest();

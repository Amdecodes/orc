import { runPipeline } from "../src/pipeline/runPipeline.js";
import fs from "fs";
import path from "path";

async function verify() {
    const front = "production test/1st.jpg";
    const back = "production test/2nd.jpg";
    const third = "production test/3rd.jpg";

    console.log("--- End-to-End Pipeline Verification ---");
    
    try {
        const result = await runPipeline(front, back, third);
        
        console.log("\n--- FINAL JSON OUTPUT ---");
        console.log(JSON.stringify(result, null, 2));
        
        // Save result for walkthrough
        fs.writeFileSync("verification_result.json", JSON.stringify(result, null, 2));
        
        console.log("\nVerification complete. Result saved to verification_result.json");
    } catch (e) {
        console.error("Pipeline Verification Failed:", e);
    }
}

verify();

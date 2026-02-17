const { createWorker } = require('tesseract.js');
const path = require('path');

(async () => {
  try {
    console.log("Creating worker...");
    const worker = await createWorker({
      logger: m => console.log(m)
    });
    
    console.log("Loading languages...");
    await worker.loadLanguage('eng');
    await worker.loadLanguage('amh');
    console.log("Initializing...");
    await worker.initialize('eng+amh');
    
    console.log("Setting parameters...");
    await worker.setParameters({
      tessedit_pageseg_mode: '3',
    });

    const imagePath = path.resolve("samples/back/image copy 2.png");
    console.log("Running Tesseract on:", imagePath);
    
    const { data } = await worker.recognize(imagePath, {
        blocks: true,
        hocr: true,
        tsv: true,
        box: true
    });
    
    console.log("Text length:", data.text.length);
    console.log("Lines present:", !!data.lines);
    if (data.lines) console.log("Lines count:", data.lines.length);
    
    console.log("Blocks present:", !!data.blocks);
    if (data.blocks) console.log("Blocks count:", data.blocks.length);

    console.log("TSV present:", !!data.tsv);
    console.log("HOCR present:", !!data.hocr);

    await worker.terminate();
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();

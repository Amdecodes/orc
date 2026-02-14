import http from "http";
import fs from "fs";

const PORT = 3000;
const JSON_PATH = "./result.json";

const server = http.createServer((req, res) => {
  // Set CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  if (req.url === "/data") {
    try {
      if (!fs.existsSync(JSON_PATH)) {
         throw new Error("File not found");
      }
      const json = fs.readFileSync(JSON_PATH, "utf-8");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(json);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "JSON file not found or empty" }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

server.listen(PORT, () => {
  console.log(`✅ JSON server running at http://localhost:${PORT}/data`);
});

# Ethiopian Digital ID OCR – Rules

This document outlines the core principles and architectural rules of the Ethiopian Digital ID OCR project.

## 🎯 Design Principles
- **Deterministic First**: Prefer rule-based logic over AI/guessing where possible (e.g., cropping, validation).
- **Truth Hierarchy**: **QR > OCR** for English Name, DOB, and Gender.
- **Isolate Logic**: No extraction or validation logic should exist in test files or the root directory.
- **Immutable Contract**: The pipeline output must always follow the defined JSON schema.

## 📂 Directory Structure
- `src/extractors/`: Production logic for Front, Back, and Third image extraction.
- `src/validators/`: Strict validation for Phone, FIN, and Dates.
- `src/utils/`: Shared OCR helpers, cropping logic, and conversion utilities.
- `src/pipeline/`: Orchestration and conflict resolution.
- `src/config/`: Static lookup data and configuration (e.g., `et.json`).
- `tests/manual/`: Standalone scripts for manual debugging and validation.
- `samples/`: Sample ID images for testing.
- `output/`: Final JSON output directory.

## 🛠️ Extraction Rules
- **Date Conversion**: All dates are extracted as Gregorian (GC) and converted to Ethiopian Calendar (EC) using deterministic rules.
- **Validity Dates**: Expiry is always derived as **Issue Date + 2921 days**, never guessed from OCR. issue date is extracted from the front image. and it taken ec date. value and convert it to gc date. value. then add 2921 days to it to get the expiry date in gc. value. then convert it to ec date. value.
- **Address Selection**: Address fields use a hierarchical lookup from `et.json` based on OCR text matches.
- **Numeric Fields**: FIN and Phone numbers use position-based cropping and multi-pass voting for high reliability.

## 🚀 Usage
The only production entry point is `src/pipeline/runPipeline.js`.
```js
import { runPipeline } from './src/pipeline/runPipeline.js';
const results = await runPipeline(frontImg, backImg, thirdImg);
```

# Ethiopian Digital ID OCR – Architecture

This document outlines the modular architecture and core principles of the project.

## 🎯 Design Principles
- **Deterministic First**: Prefer rule-based logic over AI/guessing where possible.
- **Truth Hierarchy**: **QR > OCR** for English Name, DOB, and Gender.
- **Buffer-First Core**: Core logic operates on image Buffers to ensure platform independence (API, Bot, Web).
- **Zero Side Effects**: Core functions do not perform file I/O or console logging.
- **Immutable Contract**: Output must always follow the defined JSON schema.

## 📂 Directory Structure

### 🏗️ Core Logic (`src/core/`)
- `extract/`: Multi-pass extractors for Front, Back, and Third images.
- `dates/`: Date normalization (GC/EC) and validity calculation.
- `image/`: Canvas-based card rendering and layout composition.
- `errors.js`: Standardized `IdentityExtractionError` classes.
- `generateID.js`: **Primary Entry Point**. Orthogonal wrapper for the entire pipeline.

### 🔌 Adapters & Utilities
- `src/pipeline/`: Orchestration and CLI wrapper.
- `src/api_server.js`: Express API integrating the core.
- `src/utils/`: Shared OCR helpers, cropping logic, and conversion utilities.
- `src/config/`: Static lookup data (e.g., `et.json`).

## 🛠️ Extraction Rules
- **Date Conversion**: All dates are extracted as Gregorian (GC) and converted to Ethiopian Calendar (EC).
- **Validity Dates**: Expiry is derived as **Issue Date + 2921 days**, calculated deterministically.
- **Address Selection**: Address fields use a hierarchical lookup from `et.json` based on OCR text matches.
- **Numeric Fields**: FIN and Phone numbers use position-based cropping and multi-pass voting.

## 🚀 Usage (Core API)

The recommended entry point for developers is `src/core/generateID.js`.

```js
import { generateID } from './src/core/generateID.js';

// Takes 3 image Buffers
const { image, data } = await generateID(frontBuf, backBuf, thirdBuf);

// image: Buffer (Print-ready PNG)
// data: object (Full extraction results)
```

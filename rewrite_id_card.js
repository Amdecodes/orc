import fs from 'fs';
import path from 'path';

const file = './src/utils/id-card-exporter.js';
let code = fs.readFileSync(file, 'utf8');

// Replace constants block
code = code.replace(/\/\/ ─── Design tokens ───[\s\S]*?\/\/ ─── Utility ───/, `// ─── Design tokens ────────────────────────────────────────────────────────────
// Dark navy — matches the data fields on the real card
const CLR_PRIMARY   = '#0d1f3c';   // dark navy/blue for main data
const CLR_VALUE     = '#111111';   // near-black for most text

const FS_MAIN     = 6.5 * 3.2;
const FS_ISSUE    = 4.7 * 3.2;
const FS_PHONE    = 6.5 * 3.2;
const FS_NAT      = 7.3 * 3.2;
const FS_ADDR_AM  = 6.4 * 3.2;
const FS_ADDR_EN  = 7.1 * 3.2;
const FS_FIN      = 5.5 * 3.2;

// ─── Utility ───`);

fs.writeFileSync(file, code);

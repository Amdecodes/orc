import { extractValidityDates } from "../ocr/date_extraction.js";

const mockImgWidth = 2000;

// The Rule: 
// 1. Numeric OCR date = EC_Issue
// 2. GC_Issue = ecToGc(EC_Issue)
// 3. GC_Expiry = GC_Issue + 2920 days
// 4. Output dates: GC in YYYY/Month/DD, EC in YYYY/MM/DD

const testCases = [
  {
    name: "Standard ID Flow (EC 2010/09/25 -> GC 2018/Jun/02)",
    lines: [
      { text: "Date of Issue: 2010/09/25", bbox: { x0: 1200, y0: 800, x1: 1800, y1: 850 } }
    ],
    expected: {
      issue: { ec: "2010/09/25", gc: "2018/Jun/02" },
      expiry: { gc: "2026/May/31", ec: "2018/09/23" },
      method: "pass_1_strict",
      confidence: 0.98
    }
  },
  {
    name: "EC Leap Year Scenario (Pagume 1)",
    lines: [
      { text: "Date of Issue: 2007/13/01", bbox: { x0: 1200, y0: 800, x1: 1800, y1: 850 } }
    ],
    expected: {
      issue: { ec: "2007/13/01", gc: "2015/Sep/06" },
      expiry: { gc: "2023/Sep/04", ec: "2015/12/29" },
      method: "pass_1_strict",
      confidence: 0.98
    }
  }
];

let pass = 0;
let fail = 0;

testCases.forEach(tc => {
  console.log(`\nRunning: ${tc.name}`);
  const result = extractValidityDates(tc.lines, mockImgWidth).validity;

  const issueEcOk = (tc.expected.issue.ec === result.issue.ec);
  const issueGcOk = (tc.expected.issue.gc === result.issue.gc);
  const expiryGcOk = (tc.expected.expiry.gc === result.expiry.gc);
  const expiryEcOk = (tc.expected.expiry.ec === result.expiry.ec);
  const methodOk = (tc.expected.method === result.method);
  const confOk = (Math.abs(tc.expected.confidence - result.confidence) < 0.01);

  if (issueEcOk && issueGcOk && expiryGcOk && expiryEcOk && methodOk && confOk) {
    console.log("✅ PASS");
    pass++;
  } else {
    console.log("❌ FAIL");
    console.log(`  Issue Expected: ec=${tc.expected.issue.ec} gc=${tc.expected.issue.gc}`);
    console.log(`  Issue Actual:   ec=${result.issue.ec} gc=${result.issue.gc}`);
    console.log(`  Expiry Expected: gc=${tc.expected.expiry.gc} ec=${tc.expected.expiry.ec}`);
    console.log(`  Expiry Actual:   gc=${result.expiry.gc} ec=${result.expiry.ec}`);
    console.log(`  Method Expected: ${tc.expected.method} Actual: ${result.method}`);
    fail++;
  }
});

console.log(`\n━━━ Results: ${pass}/${pass + fail} passed ━━━`);
if (fail > 0) process.exit(1);

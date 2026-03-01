import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log("--- DATABASE DIAGNOSTICS ---");
  
  try {
    const packages = await prisma.creditPackage.findMany();
    console.log("Packages in DB:", JSON.stringify(packages, null, 2));
    
    if (packages.length === 0) {
      console.log("⚠️  WARNING: CreditPackage table is EMPTY.");
    }
    
    const users = await prisma.user.findMany({ take: 5 });
    console.log("Recent Users (sample):", JSON.stringify(users.map(u => ({ id: u.id, email: u.email })), null, 2));

    console.log("\n--- FILE INTEGRITY CHECK ---");
    const paymentEnginePath = path.resolve(process.cwd(), 'services/payment-engine/src/index.js');
    if (fs.existsSync(paymentEnginePath)) {
        const content = fs.readFileSync(paymentEnginePath, 'utf8');
        const lines = content.split('\n');
        console.log("Lines 16-25 of services/payment-engine/src/index.js:");
        lines.slice(15, 25).forEach((line, i) => console.log(`${i+16}: ${line}`));
        
        if (content.includes('packageId, {')) {
            console.log("❌ FOUND SYNTAX ERROR: 'packageId, {' in file!");
        } else {
            console.log("✅ No 'packageId, {' syntax error found in file.");
        }
    } else {
        console.log("❌ Payment engine file not found at:", paymentEnginePath);
    }

  } catch (err) {
    console.error("❌ Diagnostic failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

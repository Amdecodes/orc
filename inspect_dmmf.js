import { Prisma } from '@prisma/client';
// In Prisma 5.x+, the DMMF is accessible via Prisma.dmmf or internal properties
// But simpler: just check Prisma.UserState
console.log('Prisma.UserState:', JSON.stringify(Prisma.UserState, null, 2));

// For deeper inspection of what the model thinks:
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// @ts-ignore
const dmmf = prisma._baseClient._dmmf;
console.log('DMMF Enums:', JSON.stringify(dmmf?.datamodel?.enums, null, 2));
prisma.$disconnect();
process.exit(0);

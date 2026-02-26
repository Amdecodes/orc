-- AlterEnum
ALTER TYPE "UserState" ADD VALUE 'WAIT_PAYMENT_PROOF';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pendingPackageId" TEXT;

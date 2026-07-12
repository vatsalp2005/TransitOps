-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "email" TEXT,
ADD COLUMN     "last_reminder_at" TIMESTAMP(3),
ADD COLUMN     "suspended_at" TIMESTAMP(3),
ADD COLUMN     "suspension_reason" TEXT;

/*
  Warnings:

  - Changed the type of `type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('social', 'collaboration', 'system');

-- AlterTable
ALTER TABLE "public"."notifications" DROP COLUMN "type",
ADD COLUMN     "type" "public"."NotificationType" NOT NULL;

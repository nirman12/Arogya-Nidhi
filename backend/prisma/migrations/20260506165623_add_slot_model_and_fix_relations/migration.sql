/*
  Warnings:

  - You are about to drop the column `ai_triage_summary` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `duration_minutes` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `patient_notes` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `scheduled_at` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `experience_years` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `nmc_license_no` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to alter the column `specialty` on the `doctor_profiles` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(150)`.
  - You are about to alter the column `sub_specialty` on the `doctor_profiles` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(150)`.
  - You are about to alter the column `consultation_fee` on the `doctor_profiles` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(12,2)`.
  - You are about to drop the column `address` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `chronic_conditions` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `current_medications` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `patients` table. All the data in the column will be lost.
  - You are about to alter the column `blood_group` on the `patients` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(10)`.
  - You are about to alter the column `gender` on the `patients` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(20)`.
  - You are about to drop the column `patient_id` on the `payments` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(12,2)`.
  - You are about to alter the column `currency` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(10)`.
  - You are about to alter the column `status` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(50)`.
  - You are about to alter the column `gateway` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(100)`.
  - You are about to alter the column `gateway_ref` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(255)`.
  - A unique constraint covering the columns `[license_no]` on the table `doctor_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barcode]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `appointment_date` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `appointment_time` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "doctor_profiles" DROP CONSTRAINT "doctor_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "patients" DROP CONSTRAINT "patients_user_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_appointment_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_patient_id_fkey";

-- DropIndex
DROP INDEX "doctor_profiles_nmc_license_no_key";

-- DropIndex
DROP INDEX "payments_appointment_id_key";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "ai_triage_summary",
DROP COLUMN "duration_minutes",
DROP COLUMN "patient_notes",
DROP COLUMN "scheduled_at",
ADD COLUMN     "appointment_date" DATE NOT NULL,
ADD COLUMN     "appointment_time" TEXT NOT NULL,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "slot_id" UUID,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "status" SET DATA TYPE TEXT,
ALTER COLUMN "meeting_link" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "doctor_profiles" DROP COLUMN "bio",
DROP COLUMN "experience_years",
DROP COLUMN "nmc_license_no",
ADD COLUMN     "license_no" VARCHAR(100),
ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "specialty" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "sub_specialty" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "consultation_fee" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "is_available" SET DEFAULT false,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "address",
DROP COLUMN "chronic_conditions",
DROP COLUMN "current_medications",
DROP COLUMN "height",
DROP COLUMN "weight",
ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "date_of_birth" SET DATA TYPE DATE,
ALTER COLUMN "blood_group" SET DATA TYPE VARCHAR(10),
ALTER COLUMN "gender" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "patient_id",
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "currency" SET DATA TYPE VARCHAR(10),
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "gateway" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "gateway_ref" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "paid_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "barcode" VARCHAR,
ADD COLUMN     "city" VARCHAR,
ADD COLUMN     "country" VARCHAR,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "gender" VARCHAR,
ADD COLUMN     "pin_code" VARCHAR,
ADD COLUMN     "state" VARCHAR,
ADD COLUMN     "street_address" VARCHAR;

-- CreateTable
CREATE TABLE "slots" (
    "id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "date_time" TIMESTAMP(3) NOT NULL,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "slots_doctor_id_idx" ON "slots"("doctor_id");

-- CreateIndex
CREATE INDEX "slots_date_time_idx" ON "slots"("date_time");

-- CreateIndex
CREATE INDEX "slots_is_booked_idx" ON "slots"("is_booked");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_doctor_id_idx" ON "appointments"("doctor_id");

-- CreateIndex
CREATE INDEX "appointments_slot_id_idx" ON "appointments"("slot_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_license_no_key" ON "doctor_profiles"("license_no");

-- CreateIndex
CREATE INDEX "idx_payments_appointment_id" ON "payments"("appointment_id");

-- CreateIndex
CREATE INDEX "idx_payments_status" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_barcode_key" ON "users"("barcode");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "chronic_conditions" TEXT,
ADD COLUMN     "current_medications" TEXT,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "weight" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "contact_name" VARCHAR NOT NULL,
    "relationship" VARCHAR NOT NULL,
    "contact_phone" VARCHAR NOT NULL,
    "alternate_phone" VARCHAR,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_addresses" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "street_address" VARCHAR,
    "city" VARCHAR,
    "state" VARCHAR,
    "pin_code" VARCHAR,
    "country" VARCHAR DEFAULT 'Nepal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_reports" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "title" VARCHAR NOT NULL,
    "category" VARCHAR NOT NULL,
    "file_url" VARCHAR NOT NULL,
    "file_name" VARCHAR NOT NULL,
    "file_size" INTEGER,
    "mime_type" VARCHAR,
    "notes" TEXT,
    "report_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_addresses_patient_id_key" ON "patient_addresses"("patient_id");

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_addresses" ADD CONSTRAINT "patient_addresses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_reports" ADD CONSTRAINT "medical_reports_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

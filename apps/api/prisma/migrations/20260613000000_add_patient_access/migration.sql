-- AlterTable: add email and accessCode to Patient
ALTER TABLE "Patient" ADD COLUMN "email" TEXT;
ALTER TABLE "Patient" ADD COLUMN "accessCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Patient_email_key" ON "Patient"("email");
CREATE UNIQUE INDEX "Patient_accessCode_key" ON "Patient"("accessCode");

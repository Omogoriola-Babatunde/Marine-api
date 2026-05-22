-- Relax extension fields on Policy: previously NOT NULL, now optional and
-- monetary columns retyped from TEXT to DOUBLE PRECISION.

ALTER TABLE "Policy" ALTER COLUMN "proformaInvoice" DROP NOT NULL;
ALTER TABLE "Policy" ALTER COLUMN "mode" DROP NOT NULL;
ALTER TABLE "Policy" ALTER COLUMN "currency" DROP NOT NULL;
ALTER TABLE "Policy" ALTER COLUMN "exchangeRate" DROP NOT NULL;
ALTER TABLE "Policy" ALTER COLUMN "startDate" DROP NOT NULL;
ALTER TABLE "Policy" ALTER COLUMN "endDate" DROP NOT NULL;

ALTER TABLE "Policy"
  ALTER COLUMN "exchangeRate" TYPE DOUBLE PRECISION USING NULLIF("exchangeRate", '')::double precision;

ALTER TABLE "Policy" RENAME COLUMN "InvoiceValue" TO "invoiceValue";
ALTER TABLE "Policy"
  ALTER COLUMN "invoiceValue" DROP NOT NULL,
  ALTER COLUMN "invoiceValue" TYPE DOUBLE PRECISION USING NULLIF("invoiceValue", '')::double precision;

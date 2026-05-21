-- Rename Policy.customername (lowercase, from an earlier init-migration typo)
-- to Policy.customerName. No-op on fresh databases where the column was
-- already created with the correct casing.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Policy'
      AND column_name = 'customername'
  ) THEN
    ALTER TABLE "Policy" RENAME COLUMN "customername" TO "customerName";
  END IF;
END $$;

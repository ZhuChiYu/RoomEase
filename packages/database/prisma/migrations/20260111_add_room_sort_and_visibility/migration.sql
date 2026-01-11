-- Add sortOrder and isVisible columns to rooms table
ALTER TABLE "rooms" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "rooms" ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;

-- Create index for sortOrder to improve sorting performance
CREATE INDEX "rooms_sortOrder_idx" ON "rooms"("sortOrder");


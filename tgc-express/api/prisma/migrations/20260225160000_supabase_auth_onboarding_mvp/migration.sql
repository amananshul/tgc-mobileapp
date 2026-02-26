-- Supabase auth identity + onboarding MVP fields
ALTER TABLE "User"
ADD COLUMN "supabaseId" TEXT,
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");

ALTER TABLE "Profile"
ADD COLUMN "growthIntent" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "shortBio" VARCHAR(140);

-- Backfill from existing onboarding/profile fields where available
UPDATE "Profile"
SET "growthIntent" = CASE
  WHEN "intent" IS NULL THEN ARRAY[]::TEXT[]
  ELSE ARRAY["intent"::TEXT]
END
WHERE COALESCE(array_length("growthIntent", 1), 0) = 0;

UPDATE "Profile"
SET "shortBio" = LEFT(COALESCE("bio", ''), 140)
WHERE "shortBio" IS NULL AND "bio" IS NOT NULL;

UPDATE "User" u
SET "onboardingCompleted" = COALESCE(p."isOnboarded", false)
FROM "Profile" p
WHERE p."userId" = u."id";

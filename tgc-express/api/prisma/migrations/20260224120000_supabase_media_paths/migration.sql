ALTER TABLE "Profile" RENAME COLUMN "avatarUrl" TO "avatarPath";
ALTER TABLE "TribePost" RENAME COLUMN "imageUrl" TO "imagePath";
ALTER TABLE "Tribe" ADD COLUMN "coverImagePath" TEXT;

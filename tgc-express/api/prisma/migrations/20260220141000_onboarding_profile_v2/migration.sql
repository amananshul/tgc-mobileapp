-- CreateEnum
CREATE TYPE "ProfileIntent" AS ENUM ('LEARN', 'EARN', 'ENTERTAIN');

-- CreateEnum
CREATE TYPE "ProfileMode" AS ENUM ('USER', 'HOST');

-- AlterTable
ALTER TABLE "Profile"
ADD COLUMN     "intent" "ProfileIntent",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "username" TEXT,
ADD COLUMN     "bio" VARCHAR(120),
ADD COLUMN     "activeMode" "ProfileMode" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "customThemes" JSONB,
ADD COLUMN     "sourceLang" TEXT,
ADD COLUMN     "targetLang" TEXT,
ADD COLUMN     "theme" TEXT;

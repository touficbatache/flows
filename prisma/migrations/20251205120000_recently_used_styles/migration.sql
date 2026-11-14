-- AlterTable
ALTER TABLE "NodeStyle"
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "externalUrl" TEXT,
ADD COLUMN IF NOT EXISTS "isCustom" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "RecentlyUsedStyle" (
    "id" SERIAL NOT NULL,
    "styleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentlyUsedStyle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RecentlyUsedStyle_styleId_key" ON "RecentlyUsedStyle"("styleId");

-- AddForeignKey
ALTER TABLE "RecentlyUsedStyle" ADD CONSTRAINT "RecentlyUsedStyle_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "NodeStyle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

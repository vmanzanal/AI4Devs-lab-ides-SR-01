-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "refreshTokenExpires" TIMESTAMP(3),
ADD COLUMN     "refreshTokenFamily" TEXT;

-- CreateIndex
CREATE INDEX "users_refreshToken_idx" ON "users"("refreshToken");

-- CreateIndex
CREATE INDEX "users_refreshTokenFamily_idx" ON "users"("refreshTokenFamily");

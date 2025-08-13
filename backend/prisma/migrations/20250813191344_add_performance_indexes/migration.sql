-- CreateIndex
CREATE INDEX "candidates_experienceLevel_idx" ON "candidates"("experienceLevel");

-- CreateIndex
CREATE INDEX "candidates_createdAt_idx" ON "candidates"("createdAt");

-- CreateIndex
CREATE INDEX "candidates_createdById_idx" ON "candidates"("createdById");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

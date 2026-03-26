-- ======================================================
-- CHẠY FILE NÀY TRONG TURSO SHELL ĐỂ TẠO BẢNG
-- Vào: https://app.turso.tech → chọn DB → Shell
-- ======================================================

CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "panelType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "deadline" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Project_code_key" ON "Project"("code");
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status");
CREATE INDEX IF NOT EXISTS "Project_deadline_idx" ON "Project"("deadline");

CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "teamMember" TEXT NOT NULL,
  "logDate" DATETIME NOT NULL,
  "category" TEXT NOT NULL,
  "durationHours" REAL NOT NULL,
  "description" TEXT NOT NULL,
  "projectId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "ActivityLog_teamMember_idx" ON "ActivityLog"("teamMember");
CREATE INDEX IF NOT EXISTS "ActivityLog_category_idx" ON "ActivityLog"("category");
CREATE INDEX IF NOT EXISTS "ActivityLog_logDate_idx" ON "ActivityLog"("logDate");

CREATE TABLE IF NOT EXISTS "Article" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "module" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'quy-trinh',
  "content" TEXT NOT NULL,
  "tags" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "attachmentUrl" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Article_module_idx" ON "Article"("module");
CREATE INDEX IF NOT EXISTS "Article_category_idx" ON "Article"("category");

CREATE TABLE IF NOT EXISTS "ErrorCode" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "module" TEXT NOT NULL DEFAULT 'vi-sinh',
  "code" TEXT NOT NULL,
  "instrument" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "cause" TEXT NOT NULL,
  "solution" TEXT NOT NULL,
  "imageUrl" TEXT,
  "severity" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "ErrorCode_code_key" ON "ErrorCode"("code");
CREATE INDEX IF NOT EXISTS "ErrorCode_instrument_idx" ON "ErrorCode"("instrument");
CREATE INDEX IF NOT EXISTS "ErrorCode_code_idx" ON "ErrorCode"("code");
CREATE INDEX IF NOT EXISTS "ErrorCode_module_idx" ON "ErrorCode"("module");

CREATE TABLE IF NOT EXISTS "SupportCase" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "module" TEXT NOT NULL,
  "caseDate" DATETIME NOT NULL,
  "customer" TEXT NOT NULL,
  "instrument" TEXT NOT NULL,
  "issueType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "resolution" TEXT NOT NULL,
  "handler" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "imageUrl" TEXT,
  "attachmentUrl" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SupportCase_module_idx" ON "SupportCase"("module");
CREATE INDEX IF NOT EXISTS "SupportCase_status_idx" ON "SupportCase"("status");
CREATE INDEX IF NOT EXISTS "SupportCase_caseDate_idx" ON "SupportCase"("caseDate");

CREATE TABLE IF NOT EXISTS "SupportCaseImage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "imageUrl" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "supportCaseId" TEXT NOT NULL,
  FOREIGN KEY ("supportCaseId") REFERENCES "SupportCase"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SupportCaseImage_supportCaseId_sortOrder_idx" ON "SupportCaseImage"("supportCaseId", "sortOrder");

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'user',
  "isActive" INTEGER NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "token" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE TABLE IF NOT EXISTS "ProcedureShare" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "token" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "sharedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "articleId" TEXT NOT NULL,
  "sharedById" TEXT,
  FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE,
  FOREIGN KEY ("sharedById") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProcedureShare_token_key" ON "ProcedureShare"("token");
CREATE INDEX IF NOT EXISTS "ProcedureShare_articleId_idx" ON "ProcedureShare"("articleId");
CREATE INDEX IF NOT EXISTS "ProcedureShare_sharedById_idx" ON "ProcedureShare"("sharedById");
CREATE INDEX IF NOT EXISTS "ProcedureShare_status_idx" ON "ProcedureShare"("status");

CREATE TABLE IF NOT EXISTS "ProcedureReaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reactionType" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "shareId" TEXT NOT NULL,
  FOREIGN KEY ("shareId") REFERENCES "ProcedureShare"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProcedureReaction_shareId_idx" ON "ProcedureReaction"("shareId");
CREATE INDEX IF NOT EXISTS "ProcedureReaction_reactionType_idx" ON "ProcedureReaction"("reactionType");

-- Kiểm tra bảng đã tạo
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

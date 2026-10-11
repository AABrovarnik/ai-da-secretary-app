-- Stage 1.1 initial schema

CREATE TYPE "ProcessingRunStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'cancelled');
CREATE TYPE "CandidateReviewStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "AssignmentStatus" AS ENUM ('new', 'in_progress', 'done', 'cancelled');
CREATE TYPE "MaterialKind" AS ENUM ('note', 'txt_upload', 'audio_upload');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "displayName" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

CREATE TABLE "Meeting" (
  "id" TEXT PRIMARY KEY,
  "ownerUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "meetingAt" TIMESTAMP,
  "timeZone" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "Meeting_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT
);
CREATE INDEX "Meeting_ownerUserId_idx" ON "Meeting"("ownerUserId");
CREATE INDEX "Meeting_createdAt_idx" ON "Meeting"("createdAt");

CREATE TABLE "Material" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "kind" "MaterialKind" NOT NULL,
  "originalName" TEXT,
  "mimeType" TEXT,
  "storagePath" TEXT,
  "contentText" TEXT,
  "byteSize" INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Material_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE
);
CREATE INDEX "Material_meetingId_idx" ON "Material"("meetingId");

CREATE TABLE "ProcessingRun" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "status" "ProcessingRunStatus" NOT NULL DEFAULT 'queued',
  "provider" TEXT,
  "model" TEXT,
  "queuedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP,
  "finishedAt" TIMESTAMP,
  "attempt" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  CONSTRAINT "ProcessingRun_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE
);
CREATE INDEX "ProcessingRun_meetingId_idx" ON "ProcessingRun"("meetingId");
CREATE INDEX "ProcessingRun_status_idx" ON "ProcessingRun"("status");

CREATE TABLE "ResultCandidate" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "processingRunId" TEXT NOT NULL,
  "schemaVersion" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "payloadJson" JSONB NOT NULL,
  "reviewStatus" "CandidateReviewStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP,
  CONSTRAINT "ResultCandidate_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE,
  CONSTRAINT "ResultCandidate_processingRunId_fkey" FOREIGN KEY ("processingRunId") REFERENCES "ProcessingRun"("id") ON DELETE CASCADE
);
CREATE INDEX "ResultCandidate_meetingId_idx" ON "ResultCandidate"("meetingId");
CREATE INDEX "ResultCandidate_processingRunId_idx" ON "ResultCandidate"("processingRunId");

CREATE TABLE "Decision" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "sourceQuote" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "Decision_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE
);
CREATE INDEX "Decision_meetingId_idx" ON "Decision"("meetingId");

CREATE TABLE "Assignment" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "assigneeName" TEXT,
  "dueDate" TIMESTAMP,
  "dueDateRaw" TEXT,
  "status" "AssignmentStatus" NOT NULL DEFAULT 'new',
  "sourceQuote" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "Assignment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE
);
CREATE INDEX "Assignment_meetingId_idx" ON "Assignment"("meetingId");
CREATE INDEX "Assignment_status_idx" ON "Assignment"("status");

CREATE TABLE "CandidateHistory" (
  "id" TEXT PRIMARY KEY,
  "candidateId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "fromStatus" "CandidateReviewStatus" NOT NULL,
  "toStatus" "CandidateReviewStatus" NOT NULL,
  "comment" TEXT,
  "changedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CandidateHistory_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "ResultCandidate"("id") ON DELETE CASCADE
);
CREATE INDEX "CandidateHistory_candidateId_idx" ON "CandidateHistory"("candidateId");
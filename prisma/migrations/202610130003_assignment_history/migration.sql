CREATE TABLE "AssignmentHistory" (
  "id" TEXT PRIMARY KEY,
  "assignmentId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "changesJson" JSONB NOT NULL,
  "changedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssignmentHistory_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE
);

CREATE INDEX "AssignmentHistory_assignmentId_idx" ON "AssignmentHistory"("assignmentId");

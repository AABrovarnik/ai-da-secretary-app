import { randomUUID } from "node:crypto";
import { mkdir, rename } from "node:fs/promises";
import { extname, resolve } from "node:path";
import multer from "multer";
import { Router } from "express";
import { CandidateReviewStatus, MaterialKind, Prisma, ProcessingRunStatus } from "@prisma/client";
import { z } from "zod";
import { appEnv } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";
import { prisma } from "../../services/db.js";
import { runAiExtraction } from "../../services/ai/openaiAdapter.js";
import { transcribeAudioFile } from "../../services/asr/openaiAsr.js";
import {
  buildAssignmentCreateData,
  buildReviewedPayload,
  candidateReviewRequestSchema
} from "../../services/review/schema.js";
import {
  assignmentUpdateSchema,
  buildAssignmentUpdateData,
  changedAssignmentFields
} from "../../services/assignments/schema.js";

const meetingCreateSchema = z.object({
  title: z.string().min(1).max(250),
  meetingAt: z.string().datetime().optional(),
  timeZone: z.string().min(1).max(80).optional()
});

const addTextMaterialSchema = z.object({
  contentText: z.string().min(1).max(120_000),
  originalName: z.string().min(1).max(250).optional(),
  kind: z.enum(["note", "txt_upload"]).default("note")
});

const processRunOptionsSchema = z.object({
  modelOverride: z.string().min(1).max(120).optional()
});

function resolveModelOverride(modelOverride: string | undefined) {
  const trimmed = modelOverride?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

const upload = multer({
  dest: resolve(process.cwd(), "tmp"),
  limits: {
    fileSize: appEnv.MAX_UPLOAD_MB * 1024 * 1024
  }
});

async function resolveOwnedMeeting(meetingId: string, ownerUserId: string) {
  return prisma.meeting.findFirst({
    where: { id: meetingId, ownerUserId }
  });
}

function assignmentHistorySnapshot(assignment: {
  description: string;
  assigneeName: string | null;
  dueDate: Date | null;
  dueTime: string | null;
  timeZone: string | null;
  dueDateRaw: string | null;
  status: string;
}) {
  return {
    description: assignment.description,
    assigneeName: assignment.assigneeName,
    dueDate: assignment.dueDate?.toISOString() ?? null,
    dueTime: assignment.dueTime,
    timeZone: assignment.timeZone,
    dueDateRaw: assignment.dueDateRaw,
    status: assignment.status
  };
}

async function runPipelineForMaterial(input: {
  meetingId: string;
  meetingAt: Date | null;
  timeZone: string | null;
  materialId: string;
  text: string;
  provider: string;
  model: string;
}) {
  const run = await prisma.processingRun.create({
    data: {
      meetingId: input.meetingId,
      status: ProcessingRunStatus.queued,
      provider: input.provider,
      model: input.model
    }
  });

  void (async () => {
    await prisma.processingRun.update({
      where: { id: run.id },
      data: { status: ProcessingRunStatus.running, startedAt: new Date() }
    });

    try {
      const result = await runAiExtraction({
        materialId: input.materialId,
        meetingDateIso: input.meetingAt?.toISOString() ?? null,
        timeZone: input.timeZone,
        text: input.text,
        modelOverride: input.model
      });

      await prisma.resultCandidate.create({
        data: {
          meetingId: input.meetingId,
          processingRunId: run.id,
          schemaVersion: result.schemaVersion,
          summary: result.summary,
          payloadJson: result
        }
      });

      await prisma.processingRun.update({
        where: { id: run.id },
        data: { status: ProcessingRunStatus.succeeded, finishedAt: new Date() }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI processing error";
      await prisma.processingRun.update({
        where: { id: run.id },
        data: {
          status: ProcessingRunStatus.failed,
          finishedAt: new Date(),
          errorMessage: message,
          attempt: { increment: 1 }
        }
      });
    }
  })();

  return run;
}

export const meetingsApiRouter = Router();
meetingsApiRouter.use(requireAuth);

meetingsApiRouter.get("/", async (req, res) => {
  const items = await prisma.meeting.findMany({
    where: { ownerUserId: req.authUserId },
    orderBy: { createdAt: "desc" },
    include: {
      assignments: true,
      decisions: true,
      processingRuns: {
        orderBy: { queuedAt: "desc" },
        take: 1
      }
    }
  });

  res.json({ items });
});

meetingsApiRouter.post("/", async (req, res) => {
  const parsed = meetingCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const meeting = await prisma.meeting.create({
    data: {
      ownerUserId: req.authUserId!,
      title: parsed.data.title,
      meetingAt: parsed.data.meetingAt ? new Date(parsed.data.meetingAt) : null,
      timeZone: parsed.data.timeZone ?? null
    }
  });

  res.status(201).json({ item: meeting });
});

meetingsApiRouter.get("/:meetingId", async (req, res) => {
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: req.params.meetingId,
      ownerUserId: req.authUserId
    },
    include: {
      materials: { orderBy: { createdAt: "asc" } },
      processingRuns: {
        orderBy: { queuedAt: "desc" },
        include: {
          resultCandidates: {
            include: { history: { orderBy: { changedAt: "desc" } } }
          }
        }
      },
      decisions: { orderBy: { createdAt: "desc" } },
      assignments: {
        orderBy: { createdAt: "desc" },
        include: { history: { orderBy: { changedAt: "desc" } } }
      }
    }
  });

  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  res.json({ item: meeting });
});

meetingsApiRouter.post("/:meetingId/materials/text", async (req, res) => {
  const parsed = addTextMaterialSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const meeting = await resolveOwnedMeeting(req.params.meetingId, req.authUserId!);
  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  const material = await prisma.material.create({
    data: {
      meetingId: meeting.id,
      kind: parsed.data.kind === "note" ? MaterialKind.note : MaterialKind.txt_upload,
      contentText: parsed.data.contentText,
      originalName: parsed.data.originalName ?? null,
      byteSize: Buffer.byteLength(parsed.data.contentText, "utf8")
    }
  });

  res.status(201).json({ item: material });
});

meetingsApiRouter.post("/:meetingId/materials/audio", upload.single("audio"), async (req, res) => {
  const meeting = await resolveOwnedMeeting(req.params.meetingId, req.authUserId!);
  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "Audio file is required as multipart field 'audio'" });
    return;
  }

  const storageDir = resolve(process.cwd(), appEnv.LOCAL_AUDIO_STORAGE_PATH);
  await mkdir(storageDir, { recursive: true });

  const originalExt = extname(file.originalname) || ".bin";
  const safeExt = originalExt.toLowerCase();
  const storedName = `${Date.now()}-${randomUUID()}${safeExt}`;
  const finalPath = resolve(storageDir, storedName);
  await rename(file.path, finalPath);

  const material = await prisma.material.create({
    data: {
      meetingId: meeting.id,
      kind: MaterialKind.audio_upload,
      originalName: file.originalname,
      mimeType: file.mimetype,
      storagePath: finalPath,
      byteSize: file.size
    }
  });

  res.status(201).json({ item: material });
});

meetingsApiRouter.post("/:meetingId/process-latest-text", async (req, res) => {
  const optionsParsed = processRunOptionsSchema.safeParse(req.body ?? {});
  if (!optionsParsed.success) {
    res.status(400).json({ error: optionsParsed.error.flatten() });
    return;
  }
  const selectedModel = resolveModelOverride(optionsParsed.data.modelOverride) ?? appEnv.OPENAI_MODEL;
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: req.params.meetingId,
      ownerUserId: req.authUserId
    },
    include: {
      materials: {
        where: {
          OR: [{ kind: MaterialKind.note }, { kind: MaterialKind.txt_upload }],
          contentText: { not: null }
        },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  const latest = meeting.materials[0];
  const latestText = latest?.contentText ?? null;
  if (!latest || !latestText) {
    res.status(400).json({ error: "No text material available" });
    return;
  }

  const run = await runPipelineForMaterial({
    meetingId: meeting.id,
    meetingAt: meeting.meetingAt,
    timeZone: meeting.timeZone,
    materialId: latest.id,
    text: latestText,
    provider: "openai-text",
    model: selectedModel
  });

  res.status(202).json({ runId: run.id, status: run.status });
});

meetingsApiRouter.post("/:meetingId/process-latest-audio", async (req, res) => {
  const optionsParsed = processRunOptionsSchema.safeParse(req.body ?? {});
  if (!optionsParsed.success) {
    res.status(400).json({ error: optionsParsed.error.flatten() });
    return;
  }
  const selectedModel = resolveModelOverride(optionsParsed.data.modelOverride) ?? appEnv.OPENAI_MODEL;
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: req.params.meetingId,
      ownerUserId: req.authUserId
    },
    include: {
      materials: {
        where: {
          kind: MaterialKind.audio_upload,
          storagePath: { not: null }
        },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  const latest = meeting.materials[0];
  const storagePath = latest?.storagePath ?? null;
  if (!latest || !storagePath) {
    res.status(400).json({ error: "No audio material available" });
    return;
  }

  const run = await prisma.processingRun.create({
    data: {
      meetingId: meeting.id,
      status: ProcessingRunStatus.queued,
      provider: "openai-asr+llm",
      model: `${process.env.ASR_MODEL ?? appEnv.ASR_MODEL} -> ${selectedModel}`
    }
  });

  void (async () => {
    await prisma.processingRun.update({
      where: { id: run.id },
      data: { status: ProcessingRunStatus.running, startedAt: new Date() }
    });

    try {
      const transcription = await transcribeAudioFile(storagePath);

      await prisma.material.update({
        where: { id: latest.id },
        data: { contentText: transcription }
      });

      const result = await runAiExtraction({
        materialId: latest.id,
        meetingDateIso: meeting.meetingAt?.toISOString() ?? null,
        timeZone: meeting.timeZone,
        text: transcription,
        modelOverride: selectedModel
      });

      await prisma.resultCandidate.create({
        data: {
          meetingId: meeting.id,
          processingRunId: run.id,
          schemaVersion: result.schemaVersion,
          summary: result.summary,
          payloadJson: result
        }
      });

      await prisma.processingRun.update({
        where: { id: run.id },
        data: { status: ProcessingRunStatus.succeeded, finishedAt: new Date() }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown audio processing error";
      await prisma.processingRun.update({
        where: { id: run.id },
        data: {
          status: ProcessingRunStatus.failed,
          finishedAt: new Date(),
          errorMessage: message,
          attempt: { increment: 1 }
        }
      });
    }
  })();

  res.status(202).json({ runId: run.id, status: run.status });
});

meetingsApiRouter.put("/:meetingId/candidates/:candidateId/review", async (req, res) => {
  const parsed = candidateReviewRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const candidate = await prisma.resultCandidate.findFirst({
    where: {
      id: req.params.candidateId,
      meetingId: req.params.meetingId,
      meeting: { ownerUserId: req.authUserId }
    }
  });

  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  if (candidate.reviewStatus !== CandidateReviewStatus.pending) {
    res.status(409).json({ error: "Candidate has already been reviewed" });
    return;
  }

  const evidenceMaterialIds = Array.from(
    new Set(
      [parsed.data.decisions, parsed.data.assignments, parsed.data.questions, parsed.data.information]
        .flat()
        .flatMap((item) => item.evidence.map((evidence) => evidence.materialId))
    )
  );

  const ownedMaterialCount = await prisma.material.count({
    where: {
      meetingId: candidate.meetingId,
      id: { in: evidenceMaterialIds }
    }
  });

  if (ownedMaterialCount !== evidenceMaterialIds.length) {
    res.status(400).json({ error: "Review evidence references an unknown meeting material" });
    return;
  }

  const approvedDecisions = parsed.data.decisions.filter((item) => item.action === "approve");
  const approvedAssignments = parsed.data.assignments.filter((item) => item.action === "approve");
  const approvedItemCount = [
    ...approvedDecisions,
    ...approvedAssignments,
    ...parsed.data.questions.filter((item) => item.action === "approve"),
    ...parsed.data.information.filter((item) => item.action === "approve")
  ].length;
  const nextStatus = approvedItemCount > 0 ? CandidateReviewStatus.approved : CandidateReviewStatus.rejected;
  const reviewedPayload = buildReviewedPayload(parsed.data);

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const statusUpdate = await transaction.resultCandidate.updateMany({
        where: { id: candidate.id, reviewStatus: CandidateReviewStatus.pending },
        data: {
          summary: parsed.data.summary,
          payloadJson: reviewedPayload as Prisma.InputJsonValue,
          reviewStatus: nextStatus,
          reviewedAt: new Date()
        }
      });

      if (statusUpdate.count !== 1) {
        throw new Error("CANDIDATE_ALREADY_REVIEWED");
      }

      if (approvedDecisions.length > 0) {
        await transaction.decision.createMany({
          data: approvedDecisions.map((item) => ({
            meetingId: candidate.meetingId,
            text: item.text,
            sourceQuote: item.evidence[0]?.quote ?? null
          }))
        });
      }

      if (approvedAssignments.length > 0) {
        await transaction.assignment.createMany({
          data: approvedAssignments.map((item) => buildAssignmentCreateData(candidate.meetingId, item))
        });
      }

      await transaction.candidateHistory.create({
        data: {
          candidateId: candidate.id,
          actorUserId: req.authUserId,
          fromStatus: CandidateReviewStatus.pending,
          toStatus: nextStatus,
          comment:
            parsed.data.comment ??
            `Approved ${approvedItemCount}; rejected ${
              parsed.data.decisions.length +
              parsed.data.assignments.length +
              parsed.data.questions.length +
              parsed.data.information.length -
              approvedItemCount
            }`
        }
      });

      return transaction.resultCandidate.findUnique({
        where: { id: candidate.id },
        include: { history: { orderBy: { changedAt: "desc" } } }
      });
    });

    res.json({
      item: result,
      created: {
        decisions: approvedDecisions.length,
        assignments: approvedAssignments.length
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CANDIDATE_ALREADY_REVIEWED") {
      res.status(409).json({ error: "Candidate has already been reviewed" });
      return;
    }
    throw error;
  }
});

meetingsApiRouter.patch("/:meetingId/assignments/:assignmentId", async (req, res) => {
  const parsed = assignmentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: req.params.assignmentId,
      meetingId: req.params.meetingId,
      meeting: { ownerUserId: req.authUserId }
    }
  });

  if (!assignment) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }

  const changes = buildAssignmentUpdateData(parsed.data);
  const changedFields = changedAssignmentFields(assignment, changes);
  if (changedFields.length === 0) {
    const unchanged = await prisma.assignment.findUnique({
      where: { id: assignment.id },
      include: { history: { orderBy: { changedAt: "desc" } } }
    });
    res.json({ item: unchanged });
    return;
  }
  const actualChanges = Object.fromEntries(
    changedFields.map((field) => [field, changes[field as keyof typeof changes]])
  ) as typeof changes;
  const updated = await prisma.$transaction(async (transaction) => {
    const item = await transaction.assignment.update({
      where: { id: assignment.id },
      data: actualChanges
    });

    await transaction.assignmentHistory.create({
      data: {
        assignmentId: assignment.id,
        actorUserId: req.authUserId!,
        changesJson: {
          before: assignmentHistorySnapshot(assignment),
          after: assignmentHistorySnapshot(item),
          changedFields
        }
      }
    });

    return transaction.assignment.findUnique({
      where: { id: assignment.id },
      include: { history: { orderBy: { changedAt: "desc" } } }
    });
  });

  res.json({ item: updated });
});

meetingsApiRouter.get("/processing/:runId", async (req, res) => {
  const run = await prisma.processingRun.findFirst({
    where: {
      id: req.params.runId,
      meeting: {
        ownerUserId: req.authUserId
      }
    },
    include: {
      resultCandidates: true
    }
  });

  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  res.json({ item: run });
});

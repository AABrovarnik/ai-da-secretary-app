import { createReadStream } from "node:fs";
import OpenAI from "openai";
import { appEnv } from "../../config/env.js";

export async function transcribeAudioFile(filePath: string): Promise<string> {
  if (!appEnv.OPENAI_API_KEY) {
    throw new Error("ASR provider is not configured: OPENAI_API_KEY is missing");
  }

  const client = new OpenAI({ apiKey: appEnv.OPENAI_API_KEY });

  const response = await client.audio.transcriptions.create({
    model: appEnv.ASR_MODEL,
    file: createReadStream(filePath)
  });

  const text = (response as { text?: string }).text;
  if (!text || !text.trim()) {
    throw new Error("ASR provider returned empty transcription");
  }

  return text;
}
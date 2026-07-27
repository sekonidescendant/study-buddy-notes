/**
 * AI report-writing service.
 *
 * This is the ONLY module that knows which AI provider is used. To move from
 * Gemini to another model, change `REPORT_MODEL` below — nothing else in the
 * codebase needs to be touched.
 */
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Google Gemini, called directly with your own Google AI Studio API key.
const REPORT_MODEL = "gemini-flash-latest";

export type SiwesReportType = "daily" | "weekly" | "monthly";

export const SIWES_SYSTEM_PROMPT = `You are an expert SIWES report writer for Nigerian university students.

Rewrite the student's rough notes into concise, professional SIWES logbook entries.

Never invent activities or responsibilities.

Only rewrite what the student actually did.

Improve grammar, vocabulary, sentence structure, clarity and professionalism.

Use terminology appropriate for the selected department.

For Daily Reports, keep the report between 25 and 50 words.

For Weekly Reports, combine all activities into a coherent weekly summary.

For Monthly Reports, summarize the activities professionally.

Return only the finished report without explanations.`;

const REPORT_TYPE_LABEL: Record<SiwesReportType, string> = {
  daily: "Daily Report",
  weekly: "Weekly Summary",
  monthly: "Monthly Summary",
};

export class AiServiceError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function generateSiwesReport(input: {
  department: string;
  reportType: SiwesReportType;
  notes: string;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiServiceError("The AI service is not configured. Missing GEMINI_API_KEY.", 500);
  }

  const google = createGoogleGenerativeAI({ apiKey });

  try {
    const { text } = await generateText({
      model: google(REPORT_MODEL),
      system: SIWES_SYSTEM_PROMPT,
      prompt: [
        `Department: ${input.department}`,
        `Report type: ${REPORT_TYPE_LABEL[input.reportType]}`,
        "",
        "Student's rough notes:",
        input.notes,
      ].join("\n"),
    });

    const output = text.trim();
    if (!output) {
      throw new AiServiceError("The AI returned an empty report. Please try again.", 502);
    }
    return output;
  } catch (error) {
    if (error instanceof AiServiceError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("429")) {
      throw new AiServiceError("Too many requests right now. Please wait a moment and try again.", 429);
    }
    if (message.includes("402") || message.includes("RESOURCE_EXHAUSTED")) {
      throw new AiServiceError("AI quota has been exhausted. Please contact the administrator.", 402);
    }
    console.error("[ai-service] generation failed:", message);
    throw new AiServiceError("The report could not be generated. Please try again.", 500);
  }
}

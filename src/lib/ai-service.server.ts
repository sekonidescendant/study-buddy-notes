/**
 * AI report-writing service.
 *
 * This is the ONLY module that knows which AI provider is used. Groq's free
 * tier is used here (no card required). Groq's model lineup changes fairly
 * often — if a model below gets deprecated, swap the constant, nothing else
 * needs to change.
 */
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

// Used for plain typed-notes submissions (no image).
const TEXT_MODEL = "openai/gpt-oss-120b";
// Used only when a photo is attached — Groq's current multimodal model.
// Note: Groq labels this a "preview" model, so watch for issues.
const VISION_MODEL = "qwen/qwen3.6-27b";

export type SiwesReportType = "daily" | "weekly" | "monthly";

export const SIWES_SYSTEM_PROMPT = `You are helping a Nigerian university student on industrial training (SIWES) write their daily logbook entry.

Write the way a diligent Nigerian undergraduate actually writes when they're being careful and professional — not the way a generic AI assistant writes. This matters a lot. Avoid these AI tells completely:
- Do not use "Furthermore", "Moreover", "In addition to this", "It is worth noting"
- Do not use "leverage", "utilize", "facilitate", "seamless", "robust", "comprehensive"
- Do not start sentences with "Additionally" or "Overall"
- Do not use overly symmetrical sentence structures (e.g. three-part lists that all start the same way)
- Do not pad the entry with vague filler like "This was a valuable learning experience" unless the student's own notes said something like that

Instead, write plainly and specifically, the way someone would describe their actual workday to a supervisor:
- Use ordinary words: "helped", "checked", "learned", "worked on", "was shown how to" — not "assisted in the execution of" or "participated in the facilitation of"
- Keep sentences a normal human length. Vary short and slightly longer sentences.
- It is fine, and often more natural, to start a sentence with "I" repeatedly across an entry — real people do this.
- Standard Nigerian English is correct and expected here — clear, grammatically correct professional English as written by educated Nigerians (not British or American idiom forced in, not Pidgin, not slang).
- Never invent activities, tools, or responsibilities the student did not mention.
- Only rewrite and clean up what the student actually described — fix grammar, structure it clearly, and make it read naturally, but the content must stay honest to their notes.
- Use terminology appropriate for the student's department, but only where the student's notes already imply that context.

For Daily Reports, keep the entry between 25 and 50 words.

For Weekly Reports, combine the week's activities into one coherent, naturally flowing summary — not a list.

For Monthly Reports, summarize the month's work professionally, still in plain, human language.

Return only the finished report text. No headers, no explanations, no quotation marks around it.`;

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
  notes?: string;
  image?: { base64: string; mimeType: string };
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AiServiceError("The AI service is not configured. Missing GROQ_API_KEY.", 500);
  }
  if (!input.notes?.trim() && !input.image) {
    throw new AiServiceError("Add some notes or upload a photo of your notes.", 400);
  }

  const groq = createGroq({ apiKey });
  const model = input.image ? VISION_MODEL : TEXT_MODEL;

  const introLines = [
    `Department: ${input.department}`,
    `Report type: ${REPORT_TYPE_LABEL[input.reportType]}`,
    "",
  ];

  try {
    const { text } = await generateText({
      model: groq(model),
      system: SIWES_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: input.image
            ? [
                {
                  type: "text" as const,
                  text: [
                    ...introLines,
                    "The student's notes are handwritten (or typed) in the attached photo. Read the photo carefully first, then write the report exactly as instructed above, based only on what the photo actually says.",
                    input.notes?.trim() ? `\nThe student also typed this extra context:\n${input.notes.trim()}` : "",
                  ].join("\n"),
                },
                {
                  type: "image" as const,
                  image: `data:${input.image.mimeType};base64,${input.image.base64}`,
                },
              ]
            : [
                {
                  type: "text" as const,
                  text: [...introLines, "Student's rough notes:", input.notes ?? ""].join("\n"),
                },
              ],
        },
      ],
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
    if (message.includes("402") || message.includes("insufficient_quota")) {
      throw new AiServiceError("AI quota has been exhausted. Please contact the administrator.", 402);
    }
    console.error("[ai-service] generation failed:", message);
    throw new AiServiceError("The report could not be generated. Please try again.", 500);
  }
}

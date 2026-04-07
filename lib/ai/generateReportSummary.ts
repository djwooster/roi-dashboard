import Anthropic from "@anthropic-ai/sdk";
import type { GHLSyncResponse } from "@/lib/ghl/types";

// Singleton — one client for the process lifetime.
// ANTHROPIC_API_KEY is read from the environment at call time, so this is
// safe to instantiate at module level.
const anthropic = new Anthropic();

// A section of the AI summary: a bold heading + 1–2 sentences of body copy.
// The report page renders each section independently so styling is controlled
// in JSX rather than embedded in the model output.
export type SummarySection = {
  heading: string;
  body: string;
};

// Builds a concise prompt from the GHL data.
// We keep the token count low (Haiku is fast but we still pay per token) by
// sending only the numbers the model needs — no raw JSON blobs.
function buildPrompt(data: GHLSyncResponse, locationName: string): string {
  const pipelineLines = data.pipelines
    .slice(0, 5) // cap at 5 pipelines to keep the prompt short
    .map(
      (p) =>
        `- ${p.pipelineName}: ${p.stages[0]?.count ?? 0} leads, ` +
        `${p.wonCount} won, ` +
        `${p.closeRate !== null ? `${p.closeRate}% close rate` : "close rate unknown"}, ` +
        `$${p.wonRevenue.toLocaleString()} revenue`
    )
    .join("\n");

  return `You are writing a performance summary for a marketing agency's client report.

Client: ${locationName}
Total contacts: ${data.contacts.toLocaleString()}
Open opportunities: ${data.opportunities.toLocaleString()}
Closed revenue: $${data.closedRevenue.toLocaleString()}
${data.closeRate !== null ? `Overall close rate: ${data.closeRate}%` : ""}
${data.avgDealValue !== null ? `Avg deal value: $${data.avgDealValue.toLocaleString()}` : ""}

Pipeline breakdown:
${pipelineLines || "No pipeline data available."}

Write up to 5 sections. Each section must be a JSON object with:
- "heading": a short bold title (3–6 words, plain text, no markdown)
- "body": 1–2 sentences of plain English insight

Only include sections where the data gives you something real to say.
Respond ONLY with a JSON array of section objects — no extra text, no markdown fences.
Example format: [{"heading":"Strong Lead Volume","body":"..."},{"heading":"Close Rate Opportunity","body":"..."}]`;
}

// Calls claude-haiku-4-5 to generate a structured AI summary for a GHL location report.
// Returns an array of { heading, body } sections (1–5 items).
//
// Why Haiku: it's the fastest and cheapest Claude model — latency matters here
// because the report page is server-rendered and the user is waiting. Quality
// is fine for a structured data-to-prose task with a strict JSON output format.
//
// Why we parse JSON from the model output: asking for structured JSON is more
// reliable than asking the model to format its own headings/bullets, and it lets
// us control rendering entirely in JSX.
export async function generateReportSummary(
  data: GHLSyncResponse,
  locationName: string
): Promise<SummarySection[]> {
  const prompt = buildPrompt(data, locationName);

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  // Extract the text content from the first content block.
  const raw =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Parse the JSON array. If the model returns something unexpected, we throw
  // so the caller can fall back to the placeholder rather than showing garbage.
  let sections: SummarySection[];
  try {
    sections = JSON.parse(raw);
  } catch {
    throw new Error(`AI summary: failed to parse model response as JSON: ${raw.slice(0, 200)}`);
  }

  if (!Array.isArray(sections) || sections.length === 0) {
    throw new Error("AI summary: model returned empty or non-array response");
  }

  // Enforce the 5-section cap and strip any sections missing required fields.
  return sections
    .filter((s) => typeof s.heading === "string" && typeof s.body === "string")
    .slice(0, 5);
}

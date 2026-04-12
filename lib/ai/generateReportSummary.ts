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

// ── Prompts ───────────────────────────────────────────────────────────────────

// System prompt: defines Claude's persona and output format.
// Edit this to change tone, style, or structural rules without touching the data layer.
const SYSTEM_PROMPT = `You are a sharp, concise marketing analyst writing performance summaries for a marketing agency's client reports. Your audience is the client — a business owner, not a marketer. Write in plain English: confident, specific, and free of jargon.

Each summary is a JSON array of sections. Each section has:
- "heading": 3–6 words, plain text, no punctuation, no markdown
- "body": 1–2 sentences of direct insight grounded in the numbers

Rules:
- Only include a section if the data gives you something real to say
- Never pad with generic advice ("consider improving your close rate")
- Use specific numbers from the data to support every claim
- Up to 5 sections total
- Respond ONLY with the JSON array — no extra text, no markdown fences`;

// User message: the raw data snapshot for this report.
// Keep this lean — Haiku charges per token and we only need the numbers.
// weekLabel: when set, the model knows it's analyzing a specific week rather than all-time.
function buildUserMessage(data: GHLSyncResponse, locationName: string, weekLabel?: string): string {
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

  const period = weekLabel ? `Week of ${weekLabel}` : "All time";

  return `Client: ${locationName}
Period: ${period}
Total contacts: ${data.contacts.toLocaleString()}
Open opportunities: ${data.opportunities.toLocaleString()}
Closed revenue: $${data.closedRevenue.toLocaleString()}
${data.closeRate !== null ? `Overall close rate: ${data.closeRate}%` : ""}
${data.avgDealValue !== null ? `Avg deal value: $${data.avgDealValue.toLocaleString()}` : ""}

Pipeline breakdown:
${pipelineLines || "No pipeline data available."}

Return a JSON array of up to 5 sections.`;
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
  locationName: string,
  weekLabel?: string,
): Promise<SummarySection[]> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(data, locationName, weekLabel) }],
  });

  // Extract the text content from the first content block.
  let raw =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Strip markdown code fences if the model wrapped its output despite being told not to.
  // Models occasionally do this regardless of the instruction — handle it defensively.
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

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

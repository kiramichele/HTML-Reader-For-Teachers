import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------
// AI generation for "Generate with Claude". No-ops cleanly when
// ANTHROPIC_API_KEY isn't set, so the rest of the app works without it.
// Server-only — never import from a "use client" file.
// ---------------------------------------------------------------------

// Best quality by default. Switch to "claude-sonnet-5" for lower cost
// (~$3/$15 vs $5/$25 per MTok) and faster generation — a good trade for a
// classroom tool used live by many teachers.
const MODEL = "claude-opus-4-8";

export type GeneratedField = { id: string; prompt: string };
export type GeneratedActivity = {
  title: string;
  collectsData: boolean;
  fields: GeneratedField[];
  html: string;
};

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let _client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) _client = new Anthropic();
  return _client;
}

const SYSTEM = `You build self-contained, single-file interactive HTML activities for K-12 and college teachers to use in class. The teacher describes what they want in plain language; you return one complete HTML document.

REQUIREMENTS FOR EVERY ACTIVITY
- Output ONE complete, standalone HTML document (<!DOCTYPE html> … </html>). Inline all CSS and JS. Do not reference external files, fonts, scripts, or images (system fonts only).
- Modern, clean, accessible, responsive design. Readable on a phone and a projector. Respect prefers-reduced-motion. Good color contrast.
- Never include anything that navigates away or opens popups.

DATA COLLECTION (only when the teacher wants student answers saved)
When the activity should collect student input, wire it to the host page using this postMessage protocol — the host implements the other side:
- On load, post to the parent: window.parent.postMessage({ type: "stardrop:ready" }, "*")
- Listen for: { type: "stardrop:init", initialData, readOnly }. If initialData.answers exists, restore each saved value into its input. If readOnly is true, disable all inputs.
- Whenever the student edits an answer, debounce ~700ms and post:
  window.parent.postMessage({ type: "stardrop:progress", data: buildData() }, "*")
- When the student finishes (a "Turn in" / "Done" button), post:
  window.parent.postMessage({ type: "stardrop:complete", data: buildData() }, "*")
- buildData() returns an object shaped exactly:
  { answers: { <field_id>: <string value>, ... },
    responses: [ { id: <field_id>, prompt: <human question text>, type: "short_answer", answer: <string value> }, ... ] }
  Use a stable snake_case id for each collected field. The "prompt" is the human-readable question. This structure powers the teacher's charts/word-walls, so label prompts clearly.
- Keep a single source of truth for answers and rebuild buildData() from it each time.

WHEN NO DATA IS NEEDED (a plain slideshow / reference / non-collecting game)
- Build the activity with no postMessage code at all. Set collects_data to false and fields to an empty array.

Return your result by calling the emit_activity tool. Do not include any prose outside the tool call.`;

const TOOL: Anthropic.Tool = {
  name: "emit_activity",
  description:
    "Return the finished HTML activity and a description of the data it collects.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "A short title for the activity (teacher-facing).",
      },
      collects_data: {
        type: "boolean",
        description:
          "True if the activity saves student answers via the stardrop protocol.",
      },
      fields: {
        type: "array",
        description:
          "One entry per collected field (empty when collects_data is false).",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Stable snake_case field id used in data.answers.",
            },
            prompt: {
              type: "string",
              description: "Human-readable question the field collects.",
            },
          },
          required: ["id", "prompt"],
        },
      },
      html: {
        type: "string",
        description: "The complete, standalone HTML document.",
      },
    },
    required: ["title", "collects_data", "fields", "html"],
  },
};

export async function generateActivity(
  prompt: string
): Promise<
  { ok: true; activity: GeneratedActivity } | { ok: false; error: string }
> {
  const client = getClient();
  if (!client) {
    return {
      ok: false,
      error:
        "AI generation isn't set up — add ANTHROPIC_API_KEY to .env.local and restart the server.",
    };
  }

  try {
    // Stream and collect the final message. The SDK requires streaming at this
    // max_tokens (a non-streaming request could exceed the 10-minute HTTP cap).
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "emit_activity" },
      messages: [{ role: "user", content: prompt }],
    });
    const message = await stream.finalMessage();

    const block = message.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") {
      return { ok: false, error: "Claude didn't return an activity — try again." };
    }

    const input = block.input as {
      title?: unknown;
      collects_data?: unknown;
      fields?: unknown;
      html?: unknown;
    };

    const html = typeof input.html === "string" ? input.html : "";
    if (!html.trim()) {
      return { ok: false, error: "Claude returned an empty activity — try again." };
    }

    const fields: GeneratedField[] = Array.isArray(input.fields)
      ? input.fields
          .map((f) => f as Record<string, unknown>)
          .filter((f) => typeof f.id === "string" && typeof f.prompt === "string")
          .map((f) => ({ id: f.id as string, prompt: f.prompt as string }))
      : [];

    return {
      ok: true,
      activity: {
        title:
          typeof input.title === "string" && input.title.trim()
            ? input.title.trim()
            : "Untitled activity",
        collectsData: input.collects_data === true,
        fields,
        html,
      },
    };
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return {
        ok: false,
        error: `Anthropic API error (${err.status ?? "?"}): ${err.message}`,
      };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Generation failed",
    };
  }
}

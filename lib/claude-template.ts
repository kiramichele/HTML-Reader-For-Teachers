// Paste-in instructions teachers give to Claude (or another AI) when they build
// an activity elsewhere, so the uploaded HTML talks to the host page and saves
// student answers. Activities made with the built-in "Generate with Claude"
// already follow this automatically. Keep in sync with the system prompt in
// lib/anthropic.ts.
export const CLAUDE_TEMPLATE = `I'm going to upload this HTML to a website that hosts it for my students and collects their answers. Please build a SINGLE, self-contained HTML file (all CSS and JavaScript inline — no external files, fonts, or images), and wire it to the host page using this exact "stardrop" message protocol so student answers are saved:

1. When the page loads, run:
   window.parent.postMessage({ type: "stardrop:ready" }, "*");

2. Listen for a setup message and restore any previously saved answers:
   window.addEventListener("message", function (e) {
     var m = e.data;
     if (!m || m.type !== "stardrop:init") return;
     if (m.initialData && m.initialData.answers) { /* put saved values back into the inputs */ }
     if (m.readOnly) { /* disable all inputs */ }
   });

3. Whenever a student changes an answer, wait about 700ms, then send progress:
   window.parent.postMessage({ type: "stardrop:progress", data: buildData() }, "*");

4. When the student finishes (a "Turn in" or "Done" button), send:
   window.parent.postMessage({ type: "stardrop:complete", data: buildData() }, "*");

5. buildData() must return EXACTLY this shape:
   {
     answers: { field_id: "the student's value", ... },
     responses: [
       { id: "field_id", prompt: "The question in plain words", type: "short_answer", answer: "the student's value" }
     ]
   }
   - Give every collected field a stable snake_case id (e.g. favorite_animal).
   - "prompt" is the human-readable question — label it clearly.
   - Use type "multiple_choice" for polls / pick-one questions (the teacher sees a live bar chart), and "short_answer" for open-ended text (the teacher sees a word wall). For a multiple-choice field, put the chosen option's text in "answer".

Keep one answers object as the single source of truth and rebuild buildData() from it each time. Don't navigate away from the page or open pop-up windows.

Here's the activity I want you to build:
[DESCRIBE YOUR ACTIVITY HERE — topic, grade level, what to ask, and what to collect]`;

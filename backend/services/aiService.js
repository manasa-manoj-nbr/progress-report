"use strict";

const { GoogleGenAI } = require("@google/genai");

const GEMINI_MODEL = "gemini-2.5-flash";

let _geminiClient = null;

function getGeminiClient() {
  if (!_geminiClient) {
    _geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _geminiClient;
}

async function generateWithGemini(prompt, maxOutputTokens) {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { maxOutputTokens },
  });

  return response.text.trim();
}

async function generateText(prompt, options = {}) {
  const { maxTokens = 300 } = options;
  try {
    const text = await generateWithGemini(prompt, maxTokens);
    return text && text.length ? text : null;
  } catch (err) {
    console.warn("[AI] Gemini request failed or API key missing:", err.message);
    return null;
  }
}

// Receives ONLY pre-computed stats — never raw student data.
async function generateNarrative(aiContext) {
  const { exam_type, summaryStats, atRiskNames, mostImprovedStudent } =
    aiContext;
  const {
    total_students,
    active_this_week,
    at_risk,
    most_improved_delta,
    batch_average_improvement,
  } = summaryStats;

  const atRiskLine =
    at_risk > 0
      ? `${at_risk} student(s) are at risk: ${atRiskNames.join(", ")}.`
      : "No students are currently at risk.";

  const prompt = `You are a tutor assistant for a ${exam_type} coaching institute.
Write exactly 3 sentences as a weekly batch narrative for the tutor.
Use ONLY the statistics below - do not invent or change any numbers.

Stats:
- Total students: ${total_students}
- Active this week: ${active_this_week} of ${total_students}
- ${atRiskLine}
- Most improved: ${mostImprovedStudent} (+${most_improved_delta} avg band delta)
- Batch average improvement: ${batch_average_improvement >= 0 ? "+" : ""}${batch_average_improvement}

Write 3 professional, encouraging sentences. Mention the most improved student, the at-risk situation, and the overall batch trend.`;

  try {
    const text = await generateText(prompt, { maxTokens: 400, fallbackMaxTokens: 400 });
    // Validate the AI output: we expect at least 3 sentences worth of content.
    if (!text || text.length < 40) {
      return composeFallbackNarrative(aiContext);
    }

    // crude sentence count check — fallback if too short or truncated
    const sentences = text.split(/[.?!]\s+/).filter(Boolean);
    if (sentences.length < 3) {
      return composeFallbackNarrative(aiContext);
    }

    return text;
  } catch (err) {
    return composeFallbackNarrative(aiContext);
  }
}

// Deterministic local fallback to ensure a full 3-sentence narrative when AI fails
function composeFallbackNarrative(aiContext) {
  const { exam_type, summaryStats, atRiskNames, mostImprovedStudent } = aiContext;
  const {
    total_students,
    active_this_week,
    at_risk,
    most_improved_delta,
    batch_average_improvement,
  } = summaryStats;

  const first = `This week, the batch of ${total_students} students had ${active_this_week} active learners and showed an average improvement of ${batch_average_improvement >= 0 ? "+" : ""}${batch_average_improvement}.`;
  const second = at_risk > 0
    ? `${at_risk} student${at_risk > 1 ? "s are" : " is"} at risk (${atRiskNames.join(", ")}); please review and follow up as needed.`
    : `No students are currently at risk; continue the current teaching approach to sustain momentum.`;
  const third = `Special mention to ${mostImprovedStudent} for the strongest improvement (${most_improved_delta >= 0 ? "+" : ""}${most_improved_delta} avg band delta) — keep encouraging targeted practice.`;

  return `${first} ${second} ${third}`;
}

// Receives pre-computed risk context for ONE student - never raw band arrays.
async function generateWhatsAppMessage(aiCtx) {
  const {
    name,
    reasons,
    target_band,
    avg_current_band,
    days_until_exam,
    days_inactive,
    exam_type,
  } = aiCtx;

  const prompt = `You are a friendly, professional tutor. Write a warm, supportive WhatsApp message from a tutor to ${name} (preparing for ${exam_type}). Use a conversational one-paragraph tone suitable for WhatsApp.

Requirements:
- Use ONLY the pre-computed context below; do NOT request or expose raw scores or internal data.
- Mention any specific improvements (if present) and any dropped skills that need attention.
- Recommend one clear action the student should take this week and invite them to be active again.
- Keep it to 1 paragraph, 2 short sentences, 40-85 words total. Plain text only.

Context (use naturally):
- Improvements: ${aiCtx.improved_skills.length ? aiCtx.improved_skills.join(", ") : "None"}
- Declines: ${aiCtx.declined_skills.length ? aiCtx.declined_skills.join(", ") : "None"}
- Recommended focus: ${aiCtx.recommended_focus}
- Days since last session: ${aiCtx.days_inactive}
- Days until exam: ${aiCtx.days_until_exam}

Write the message now.`;

  try {
    const text = await generateText(prompt, {
      maxTokens: 240,
      fallbackMaxTokens: 240,
    });
    if (!text || text.length < 30) {
      return composeFallbackWhatsApp(aiCtx);
    }
    return text;
  } catch (err) {
    return composeFallbackWhatsApp(aiCtx);
  }
}

// Deterministic local fallback to ensure a full tutor message when AI keys fail or are unavailable.
function composeFallbackWhatsApp(aiCtx) {
  const {
    name,
    improved_skills = [],
    declined_skills = [],
    recommended_focus = "",
    days_inactive,
    days_until_exam,
  } = aiCtx;

  const improvements = improved_skills.length
    ? `I've noticed improvement in ${improved_skills.join(", ")}.`
    : "";
  const declines = declined_skills.length
    ? `I see a drop in ${declined_skills.map((d) => d.split(" ")[0]).join(", ")}.`
    : "";
  const activity =
    days_inactive > 0
      ? `You haven't been active for ${days_inactive} day${days_inactive > 1 ? "s" : ""}.`
      : "";
  const examNote =
    typeof days_until_exam === "number"
      ? `Your exam is in ${days_until_exam} day${days_until_exam === 1 ? "" : "s"}.`
      : "";

  const action =
    recommended_focus ||
    "Please continue regular practice and reach out if you need help.";

  // Two short sentences in one paragraph.
  const first = `Hi ${name}, ${improvements} ${declines} ${activity}`.trim();
  const second = `${examNote} ${action}`.trim();

  // Ensure both sentences exist; if first is empty, fill with a generic opener.
  const opener = first.length ? first : `Hi ${name}, just a quick check-in.`;

  return `${opener} ${second}`.replace(/\s+/g, " ").trim();
}

module.exports = { generateNarrative, generateWhatsAppMessage };

import { generateJson as generateLlmJson } from './llm.service.js';

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const FALLBACK_RESULT = {
  symptoms: [],
  severity: 'low',
  department: 'General Medicine',
  urgency: 'normal',
};

const allowedSeverity = new Set(['low', 'medium', 'high']);
const allowedUrgency = new Set(['normal', 'urgent', 'emergency']);

function extractJson(text) {
  if (!text) return null;

  const trimmed = String(text).trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i)?.[1] || trimmed.match(/```\s*([\s\S]*?)\s*```/i)?.[1];
    if (fenced) {
      try {
        return JSON.parse(fenced.trim());
      } catch {
        // fall through
      }
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }

    return null;
  }
}

function normalizeResult(raw, message) {
  const symptoms = Array.isArray(raw?.symptoms)
    ? raw.symptoms.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)
    : typeof raw?.symptoms === 'string'
      ? raw.symptoms.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

  const severity = allowedSeverity.has(String(raw?.severity || '').toLowerCase())
    ? String(raw.severity).toLowerCase()
    : FALLBACK_RESULT.severity;

  const urgency = allowedUrgency.has(String(raw?.urgency || '').toLowerCase())
    ? String(raw.urgency).toLowerCase()
    : FALLBACK_RESULT.urgency;

  const department = typeof raw?.department === 'string' && raw.department.trim()
    ? raw.department.trim()
    : FALLBACK_RESULT.department;

  return {
    symptoms: symptoms.length ? symptoms : (message ? [message.slice(0, 120)] : []),
    severity,
    department,
    urgency,
  };
}

export async function analyzeSymptoms(message, { userId = null, interactionType = 'symptom_analysis' } = {}) {
  const prompt = [
    'You are a medical triage assistant for appointment booking.',
    'Analyze the user message and return ONLY valid JSON.',
    'Required JSON shape:',
    '{',
    '  "symptoms": ["string"],',
    '  "severity": "low" | "medium" | "high",',
    '  "department": "string",',
    '  "urgency": "normal" | "urgent" | "emergency"',
    '}',
    'Rules:',
    '- Keep symptoms concise and clinical.',
    '- Map to the closest department.',
    '- If the user describes danger signs like chest pain, trouble breathing, fainting, stroke symptoms, or heavy bleeding, use urgency "emergency".',
    '- Do not include markdown, code fences, or extra commentary.',
    `User message: ${message}`,
  ].join('\n');

  try {
    const parsed = await generateLlmJson(prompt, {
      temperature: 0.2,
      maxTokens: 350,
      log: {
        userId,
        interactionType,
        inputText: message,
      },
    });
    return normalizeResult(parsed, message);
  } catch {
    return {
      ...FALLBACK_RESULT,
      symptoms: message ? [message.slice(0, 120)] : [],
    };
  }
}

export { MODEL_NAME };

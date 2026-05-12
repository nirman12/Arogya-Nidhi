import { logAiInteraction } from './aiInteractionLog.service.js';

function provider() {
  return String(process.env.LLM_PROVIDER || 'gemini').trim().toLowerCase();
}

function extractJson(text) {
  if (!text) return null;
  const trimmed = String(text).trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced =
      trimmed.match(/```json\s*([\s\S]*?)\s*```/i)?.[1] ||
      trimmed.match(/```\s*([\s\S]*?)\s*```/i)?.[1];

    if (fenced) {
      try {
        return JSON.parse(fenced.trim());
      } catch {
        // continue
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

function shouldSoftFail(status) {
  return status === 429 || status === 408 || status === 503;
}

function toUsageInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}

function getGroqTokens(payload) {
  return toUsageInteger(payload?.usage?.total_tokens);
}

function getGeminiTokens(payload) {
  const total = toUsageInteger(payload?.usageMetadata?.totalTokenCount);
  if (total !== null) return total;

  const promptTokens = toUsageInteger(payload?.usageMetadata?.promptTokenCount) || 0;
  const candidateTokens = toUsageInteger(payload?.usageMetadata?.candidatesTokenCount) || 0;
  const combined = promptTokens + candidateTokens;
  return combined > 0 ? combined : null;
}

function modelLabel(providerName, model) {
  return `${providerName}:${model}`;
}

function makeLogConfig(log, fallbackInputText) {
  if (!log || typeof log !== 'object') return null;
  return {
    inputText: fallbackInputText,
    ...log,
  };
}

function queueInteractionLog(log, data) {
  if (!log?.interactionType) return;

  logAiInteraction({
    userId: log.userId,
    interactionType: log.interactionType,
    inputText: log.inputText ?? data.inputText,
    outputText: data.outputText,
    modelUsed: data.modelUsed,
    tokensUsed: data.tokensUsed,
    latencyMs: data.latencyMs,
  }).catch(() => undefined);
}

async function groqChat({
  messages,
  temperature = 0.2,
  maxTokens = 512,
  jsonMode = false,
  softFail = true,
  log = null,
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const startedAt = Date.now();

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const latencyMs = Date.now() - startedAt;
    const details = await response.text().catch(() => '');
    queueInteractionLog(log, {
      inputText: JSON.stringify(messages),
      outputText: null,
      modelUsed: modelLabel('groq', model),
      tokensUsed: null,
      latencyMs,
    });
    if (softFail && shouldSoftFail(response.status)) {
      console.warn(`Groq request soft-failed (${response.status}). Details: ${String(details).slice(0, 300)}`);
      return null;
    }
    throw new Error(`Groq request failed (${response.status}): ${String(details).slice(0, 300)}`);
  }

  const payload = await response.json();
  const outputText = payload?.choices?.[0]?.message?.content || null;
  queueInteractionLog(log, {
    inputText: JSON.stringify(messages),
    outputText,
    modelUsed: modelLabel('groq', model),
    tokensUsed: getGroqTokens(payload),
    latencyMs: Date.now() - startedAt,
  });
  return outputText;
}

async function geminiGenerate({
  prompt,
  temperature = 0.2,
  maxOutputTokens = 512,
  responseMimeType,
  softFail = true,
  log = null,
}) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GENERATIVE_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const apiVersion = process.env.GEMINI_API_VERSION || 'v1beta';
  const encodedModel = encodeURIComponent(model);
  const startedAt = Date.now();

  const endpointFor = (version) =>
    `https://generativelanguage.googleapis.com/${version}/models/${encodedModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const makeRequest = (endpoint) =>
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          ...(responseMimeType ? { responseMimeType } : {}),
        },
      }),
    });

  let response = await makeRequest(endpointFor(apiVersion));
  if (!response.ok && response.status === 404 && apiVersion === 'v1beta') {
    response = await makeRequest(endpointFor('v1'));
  }

  if (!response.ok) {
    const latencyMs = Date.now() - startedAt;
    const details = await response.text().catch(() => '');
    queueInteractionLog(log, {
      inputText: String(prompt || ''),
      outputText: null,
      modelUsed: modelLabel('gemini', model),
      tokensUsed: null,
      latencyMs,
    });
    if (softFail && shouldSoftFail(response.status)) {
      console.warn(`Gemini request soft-failed (${response.status}). Details: ${String(details).slice(0, 300)}`);
      return null;
    }
    throw new Error(`Gemini request failed (${response.status}): ${String(details).slice(0, 300)}`);
  }

  const payload = await response.json();
  const outputText = payload?.candidates?.[0]?.content?.parts?.map((p) => p?.text || '').join('') || null;
  queueInteractionLog(log, {
    inputText: String(prompt || ''),
    outputText,
    modelUsed: modelLabel('gemini', model),
    tokensUsed: getGeminiTokens(payload),
    latencyMs: Date.now() - startedAt,
  });
  return outputText;
}

export async function generateText(prompt, { temperature = 0.2, maxTokens = 512, softFail = true, log = null } = {}) {
  const current = provider();
  const logConfig = makeLogConfig(log, String(prompt || ''));

  if (current === 'groq') {
    return groqChat({
      messages: [{ role: 'user', content: String(prompt || '') }],
      temperature,
      maxTokens,
      jsonMode: false,
      softFail,
      log: logConfig,
    });
  }

  // default: gemini
  return geminiGenerate({
    prompt: String(prompt || ''),
    temperature,
    maxOutputTokens: maxTokens,
    softFail,
    log: logConfig,
  });
}

export async function generateJson(prompt, { temperature = 0.2, maxTokens = 512, softFail = true, log = null } = {}) {
  const current = provider();
  const logConfig = makeLogConfig(log, String(prompt || ''));

  if (current === 'groq') {
    const text = await groqChat({
      messages: [
        {
          role: 'system',
          content: 'Return strict JSON only. Do not use markdown fences. Do not add commentary.',
        },
        { role: 'user', content: String(prompt || '') },
      ],
      temperature,
      maxTokens,
      jsonMode: true,
      softFail,
      log: logConfig,
    });
    return extractJson(text);
  }

  const text = await geminiGenerate({
    prompt: String(prompt || ''),
    temperature,
    maxOutputTokens: maxTokens,
    responseMimeType: 'application/json',
    softFail,
    log: logConfig,
  });

  return extractJson(text);
}

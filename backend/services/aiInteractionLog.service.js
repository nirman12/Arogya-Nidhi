import supabase from '../config/supabase.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const truncate = (value, limit) => {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return text.length > limit ? text.slice(0, limit) : text;
};

const normalizeNullableUuid = (value) => {
  const text = value === null || value === undefined ? '' : String(value).trim();
  return UUID_PATTERN.test(text) ? text : null;
};

const normalizeInteger = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : null;
};

const buildPayload = ({
  userId = null,
  interactionType = null,
  inputText = null,
  outputText = null,
  modelUsed = null,
  tokensUsed = null,
  latencyMs = null,
} = {}) => ({
  user_id: normalizeNullableUuid(userId),
  interaction_type: truncate(interactionType, 100),
  input_text: inputText === null || inputText === undefined ? null : String(inputText),
  output_text: outputText === null || outputText === undefined ? null : String(outputText),
  model_used: truncate(modelUsed, 100),
  tokens_used: normalizeInteger(tokensUsed),
  latency_ms: normalizeInteger(latencyMs),
});

export async function logAiInteraction(logData = {}) {
  if (!supabase) return { logged: false, skipped: true };

  const payload = buildPayload(logData);

  try {
    const { error } = await supabase.from('ai_interaction_logs').insert(payload);
    if (error) throw error;
    return { logged: true };
  } catch (error) {
    if (payload.user_id && (error?.code === '23503' || String(error?.message || '').includes('foreign key'))) {
      try {
        const { error: retryError } = await supabase
          .from('ai_interaction_logs')
          .insert({ ...payload, user_id: null });
        if (!retryError) return { logged: true, userIdCleared: true };
      } catch {
        // fall through to warning below
      }
    }

    console.warn('Failed to log AI interaction:', error?.message || error);
    return { logged: false, error };
  }
}

export default { logAiInteraction };

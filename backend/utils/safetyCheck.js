export function safetyCheck(aiData) {
  if (String(aiData?.urgency || '').toLowerCase() === 'emergency') {
    return { allowed: false, message: 'Go to nearest hospital' };
  }

  return { allowed: true, message: 'Booking allowed' };
}
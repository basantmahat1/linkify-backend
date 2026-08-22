/**
 * Centralized email validation rules.
 * MUST remain synchronized between frontend and backend.
 */

// Regex to validate basic email structure
export const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Normalizes email: trim and lowercase
 */
export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Validates email format strictly
 */
export function isValidEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  
  // Specific exclusions for malformed cases
  if (normalized.startsWith('+') || normalized.startsWith('.') || normalized.startsWith('@')) return false;
  if (normalized.includes('..') || normalized.includes('@@') || normalized.includes('.@')) return false;
  if (normalized.endsWith('.')) return false;
  if (!normalized.includes('@') || !normalized.includes('.')) return false;
  
  return EMAIL_PATTERN.test(normalized);
}

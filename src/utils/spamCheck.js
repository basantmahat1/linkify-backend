// Lightweight heuristic spam detection. Not a replacement for a real
// threat-intel service, but catches obvious cases and flags links for
// admin review rather than silently allowing them.
const SUSPICIOUS_KEYWORDS = [
  "free money", "click here now", "act now", "wire transfer", "crypto giveaway",
  "double your bitcoin", "guaranteed income", "work from home miracle", "claim your prize",
];

const URL_SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly"];

export function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function isSuspiciousLink({ title = "", description = "", url = "" }) {
  const text = `${title} ${description}`.toLowerCase();
  const domain = extractDomain(url);
  const hasKeyword = SUSPICIOUS_KEYWORDS.some((k) => text.includes(k));
  const isShortener = URL_SHORTENERS.includes(domain);
  return hasKeyword || isShortener;
}

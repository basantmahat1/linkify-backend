/**
 * Escape special characters in string for safe regular expression creation.
 * Prevents ReDoS and syntax errors from unexpected input like '(', '[', '*', '+', etc.
 */
export function escapeRegex(string = "") {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

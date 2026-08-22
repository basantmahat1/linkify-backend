import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

purify.addHook("uponSanitizeElement", (node, data) => {
  // Belt-and-braces: DOMPurify already strips these, but decoration SVGs
  // should never contain script/foreignObject/animate-based exploits.
  const banned = ["script", "foreignobject", "animate", "animatetransform", "set"];
  if (banned.includes(data.tagName)) node.remove();
});

/**
 * Sanitize an uploaded SVG file's contents before it's ever written to disk
 * or served. Strips <script>, event handlers, external references, and
 * anything that isn't plain vector markup.
 */
export function sanitizeSvg(rawSvg) {
  const clean = purify.sanitize(rawSvg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject", "animate", "animateTransform", "set", "style"],
    FORBID_ATTR: ["onload", "onerror", "onclick", "onmouseover", "href", "xlink:href"],
  });
  if (!clean || !/^<svg[\s>]/i.test(clean.trim())) {
    throw new Error("Upload does not look like a valid SVG after sanitization");
  }
  return clean;
}

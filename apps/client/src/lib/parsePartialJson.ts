/**
 * Best-effort JSON parser for streaming LLM output.
 *
 * The model emits a forward prefix of eventual-valid JSON. As tokens
 * arrive, we want to render whatever fields have already been completed
 * without waiting for the full object to close. This parser:
 *
 *   1. Tries `JSON.parse` directly (fast path once the full object lands).
 *   2. If that fails, walks the text once to track open strings / arrays /
 *      objects, then appends the minimum closing characters and retries.
 *   3. If that still fails (typically mid-key or mid-value with no safe
 *      place to close), backs up to the most recent comma / open-brace /
 *      open-bracket and retries from there.
 *
 * Returns null when no valid slice can be parsed — callers treat that as
 * "no new state yet" and keep accumulating.
 */
export function parsePartialJson<T = unknown>(text: string): T | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // fall through
  }

  try {
    return JSON.parse(closeOpenStructures(trimmed)) as T;
  } catch {
    // fall through
  }

  // Walk back to the last safe truncation point and try again. Commas
  // mean "the previous field/element is complete"; open brackets mean
  // "start of a container". Either makes a clean place to close.
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const c = trimmed[i];
    if (c !== ',' && c !== '{' && c !== '[') continue;
    const candidate = c === ',' ? trimmed.slice(0, i) : trimmed.slice(0, i + 1);
    try {
      return JSON.parse(closeOpenStructures(candidate)) as T;
    } catch {
      // keep walking
    }
  }

  return null;
}

/**
 * Walk `text` once, tracking whether we're currently inside a string and
 * what `{` / `[` containers are still open. Append the minimum closers
 * (quote, brace, bracket) needed to make the text syntactically valid.
 *
 * Does NOT fix mid-key / mid-value truncations (e.g. `{"translation": `).
 * Those get handled by the caller backing up to the last safe point.
 */
function closeOpenStructures(text: string): string {
  const stack: Array<'"' | '{' | '['> = [];
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const top = stack[stack.length - 1];

    if (top === '"') {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') stack.pop();
      continue;
    }

    if (c === '"') stack.push('"');
    else if (c === '{') stack.push('{');
    else if (c === '[') stack.push('[');
    else if (c === '}' && top === '{') stack.pop();
    else if (c === ']' && top === '[') stack.pop();
  }

  let result = text;
  // Drop a trailing backslash that started an escape — a lone `\` inside
  // a string is invalid and JSON.parse will reject even after we close.
  if (escape) result = result.slice(0, -1);

  while (stack.length > 0) {
    const top = stack.pop();
    if (top === '"') result += '"';
    else if (top === '{') result += '}';
    else result += ']';
  }
  return result;
}

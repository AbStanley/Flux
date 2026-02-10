export function cleanResponse(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Remove markdown code blocks if present
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) {
      cleaned = match[1].trim();
    }
  }

  // Remove quotes if the WHOLE response is quoted
  if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length > 2) {
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'") && cleaned.length > 2) {
    cleaned = cleaned.slice(1, -1);
  }

  // Remove common prefixes
  const prefixes = [
    'Translation:',
    'The translation is:',
    'Here is the translation:',
    'Result:',
    'Answer:',
  ];
  for (const prefix of prefixes) {
    if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleaned = cleaned.slice(prefix.length).trim();
    }
  }

  return cleaned;
}

export function cleanAndParseJson<T>(text: string): T {
  const cleaned = cleanResponse(text);

  try {
    return JSON.parse(cleaned) as T;
  } catch (initialError) {
    // Attempt to find the first valid JSON object or array
    const jsonMatch = cleaned.match(/({[\s\S]*}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch (e) {
        // Fallback: try to fix common JSON issues like trailing commas or missing braces
        const likelyJson = jsonMatch[0]
          .replace(/,\s*([\]}])/g, '$1') // remove trailing commas
          .trim();
        try {
          return JSON.parse(likelyJson) as T;
        } catch {
          // Continue to snippets
        }
      }
    }

    // Last resort: find all { } blocks and return them as an array if possible
    const blocks = cleaned.match(/\{[\s\S]*?\}/g);
    if (blocks && blocks.length > 0) {
      const parsedBlocks = blocks
        .map(b => {
          try { return JSON.parse(b); } catch { return null; }
        })
        .filter(b => b !== null);

      if (parsedBlocks.length > 0) return parsedBlocks as unknown as T;
    }

    const snippet = cleaned.length > 100 ? cleaned.substring(0, 100) + '...' : cleaned;
    throw new Error(`Failed to parse JSON from response: "${snippet}"`);
  }
}

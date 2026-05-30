const http = require('http');

const generate = (prompt) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "translategemma:4b",
      prompt: prompt,
      stream: false,
      format: "json", // Enforce JSON
      options: { temperature: 0.1 }
    });

    const req = http.request(
      {
        hostname: 'localhost',
        port: 11434,
        path: '/api/generate',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve(JSON.parse(body)));
      }
    );
    req.write(data);
    req.end();
  });
};

async function testPrompt(text, contextStr, target) {
  let formattedContext = contextStr;
  
  if (text.length <= 2) {
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<=^|[^\\p{L}\\p{N}_])${escapedText}(?=[^\\p{L}\\p{N}_]|$)`, 'u');
    formattedContext = contextStr.replace(regex, `'${text}'`);
  }

  const prompt = `[CONTEXT] ${formattedContext}
[TO_TRANSLATE] ${text}
[TARGET_LANGUAGE] ${target}
[RULES]
1. Translate strictly ONLY the text: "${text}" into ${target}.
2. Return JSON ONLY.
[JSON_FORMAT]
{
  "detectedLanguage": "string",
  "translation": "string"
}`;

  const res = await generate(prompt);
  console.log(`\nTEXT: ${text} | CONTEXT: ${formattedContext}`);
  console.log(`RESULT: ${res.response}`);
}

async function run() {
  await testPrompt("a", "Il a toujours un air innocent", "Spanish");
  await testPrompt("un", "Il a toujours un air innocent", "Spanish");
  await testPrompt("Auch", "**Anna:** Auch gut.", "Spanish");
  await testPrompt("почему", "Я не знаю, почему он это сделал.", "English");
}

run();

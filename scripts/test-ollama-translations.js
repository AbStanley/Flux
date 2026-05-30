const http = require('http');

const runJsonPrompt = (prompt) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'translategemma:4b',
      prompt: prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0,
        num_predict: 64
      }
    });

    const req = http.request(
      {
        hostname: 'localhost',
        port: 11434,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
          try {
            const parsed = JSON.parse(body);
            resolve(JSON.parse(parsed.response));
          } catch (e) {
            reject(new Error(`Parse error: ${body}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

function getTranslatePrompt(text, targetLanguage, context, sourceLanguage, isAuto = false) {
  const isSingleWord = !text.trim().includes(' ');
  const shouldIncludeContext = context && context !== 'None' && isSingleWord;
  
  let formattedContext = context || 'None';
  if (shouldIncludeContext && text.trim().length <= 2) {
    try {
      const escapedText = text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<=^|[^\\p{L}\\p{N}_])${escapedText}(?=[^\\p{L}\\p{N}_]|$)`, 'u');
      formattedContext = context.replace(regex, `'${text.trim()}'`);
    } catch (e) {
      // Fallback
    }
  }

  return `[CONTEXT] ${shouldIncludeContext ? formattedContext : 'None'}
[TO_TRANSLATE] ${text}
[TARGET_LANGUAGE] ${targetLanguage}
[RULES]
1. Translate strictly ONLY the text: "${text}" into ${targetLanguage}.
2. Return JSON ONLY.
[JSON_FORMAT]
{
  "detectedLanguage": "${isAuto ? 'string' : sourceLanguage}",
  "translation": "string"
}`;
};

async function runTests() {
  const tests = [
    {
      name: "Single word with context (klingt)",
      params: ["klingt", "Spanish", "Max Wow das klingt ja wirklich speziell", "German"],
      expectedTranslation: "suena"
    },
    {
      name: "Phrase with context (Ich finde das)",
      params: ["Ich finde das", "Spanish", "Ich finde das total spannend", "German"],
      expectedTranslationOptions: ["Yo creo eso", "Yo encuentro eso", "Me parece", "Yo lo encuentro", "Yo pienso eso"]
    },
    {
      name: "Single word with context (Auch)",
      params: ["Auch", "Spanish", "**Anna:** Auch gut.", "German"],
      expectedTranslationOptions: ["también", "igualmente", "además"]
    },
    {
      name: "Single word with context (spannend)",
      params: ["spannend", "Spanish", "Ich finde das total spannend", "German"],
      expectedTranslationOptions: ["emocionante", "interesante", "fascinante", "apasionante"]
    },
    {
      name: "Single word with MARKDOWN context (Auch)",
      params: ["Auch", "Spanish", "**Anna:** Auch gut.", "German"],
      expectedTranslationOptions: ["también", "igualmente", "además"]
    },
    {
      name: "Two words with context (Auch gut)",
      params: ["Auch gut", "Spanish", "Auch gut.", "German"],
      expectedTranslationOptions: ["También bien", "Igualmente bien", "Muy bien también"]
    },
    {
      name: "Full sentence (Ich habe gerade etwas Interessantes gelesen.)",
      params: ["Ich habe gerade etwas Interessantes gelesen.", "Spanish", "Ich habe gerade etwas Interessantes gelesen.", "German"],
      expectedTranslationOptions: ["Acabo de leer algo interesante", "He leído algo interesante recientemente"]
    },
    {
      name: "Single word 'Hast' (German -> Spanish)",
      params: ["Hast", "Spanish", "Hast du schon mal über ungewöhnliche Hobbys nachgedacht?", "German"],
      expectedTranslationOptions: ["has", "tienes"]
    },
    {
      name: "Single word 'почему' (Russian -> English)",
      params: ["почему", "English", "Я не знаю, почему он это сделал.", "Russian"],
      expectedTranslationOptions: ["why"]
    },
    {
      name: "Phrase 'не знаю' (Russian -> Spanish)",
      params: ["не знаю", "Spanish", "Я не знаю, почему он это сделал.", "Russian"],
      expectedTranslationOptions: ["no sé", "no lo sé"]
    },
    {
      name: "Single word 'siempre' (Spanish -> English)",
      params: ["siempre", "English", "Yo siempre voy al parque los domingos.", "Spanish"],
      expectedTranslationOptions: ["always"]
    },
    {
      name: "Phrase 'los domingos' (Spanish -> English)",
      params: ["los domingos", "English", "Yo siempre voy al parque los domingos.", "Spanish"],
      expectedTranslationOptions: ["sundays", "on sundays"]
    },
    {
      name: "Single short ambiguous word 'a' (French -> Spanish)",
      params: ["a", "Spanish", "Il a toujours un air innocent, mais je l'ai surpris à jouer avec une", "French"],
      expectedTranslationOptions: ["tiene", "ha"]
    }
  ];

  let passed = 0;

  console.log('--- STARTING INTEGRATION TESTS FOR TRANSLATEGEMMA:4B ---\n');

  for (const t of tests) {
    console.log(`▶ Running Test: ${t.name}`);
    const prompt = getTranslatePrompt(...t.params);
    
    try {
      const response = await runJsonPrompt(prompt);
      const translated = response.translation;
      
      let isSuccess = false;
      if (t.expectedTranslation && translated.toLowerCase() === t.expectedTranslation.toLowerCase()) {
        isSuccess = true;
      } else if (t.expectedTranslationOptions && t.expectedTranslationOptions.some(opt => translated.toLowerCase().includes(opt.toLowerCase()))) {
        isSuccess = true;
      }

      if (isSuccess) {
        console.log(`  ✅ PASSED: translated to "${translated}"`);
        passed++;
      } else {
        console.log(`  ❌ FAILED: translated to "${translated}"`);
        console.log(`     Expected: ${t.expectedTranslation || t.expectedTranslationOptions.join(' OR ')}`);
        console.log(`\n     PROMPT USED:\n${prompt}\n`);
      }
    } catch (e) {
      console.log(`  ❌ ERROR: ${e.message}`);
    }
  }

  console.log(`\n--- TEST RESULTS: ${passed}/${tests.length} PASSED ---`);
}

runTests();

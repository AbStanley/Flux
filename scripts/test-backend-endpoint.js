const http = require('http');

const hitEndpoint = (payload) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/translate',
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
          if (res.statusCode !== 200 && res.statusCode !== 201) {
            return reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
          try {
            const parsed = JSON.parse(body);
            resolve(parsed);
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

async function main() {
  const cases = [
    {
      name: "Single word 'Auch'",
      payload: {
        text: "Auch",
        targetLanguage: "Spanish",
        context: "**Anna:** Auch gut.",
        sourceLanguage: "German",
        model: "translategemma:4b"
      }
    },
    {
      name: "Single word 'spannend'",
      payload: {
        text: "spannend",
        targetLanguage: "Spanish",
        context: "**Max:** Ungewöhnliche Hobbys? Ja, natürlich! Ich finde das total spannend.",
        sourceLanguage: "German",
        model: "translategemma:4b"
      }
    },
    {
      name: "Two words 'Auch gut'",
      payload: {
        text: "Auch gut",
        targetLanguage: "Spanish",
        context: "**Anna:** Auch gut.",
        sourceLanguage: "German",
        model: "translategemma:4b"
      }
    },
    {
      name: "Three words 'Ich finde das'",
      payload: {
        text: "Ich finde das",
        targetLanguage: "Spanish",
        context: "**Max:** Ungewöhnliche Hobbys? Ja, natürlich! Ich finde das total spannend.",
        sourceLanguage: "German",
        model: "translategemma:4b"
      }
    },
    {
      name: "Full sentence",
      payload: {
        text: "Ich habe gerade etwas Interessantes gelesen.",
        targetLanguage: "Spanish",
        context: "Ich habe gerade etwas Interessantes gelesen.",
        sourceLanguage: "German",
        model: "translategemma:4b"
      }
    }
  ];

  console.log('--- TESTING BACKEND ENDPOINT: /api/translate ---');
  for (const c of cases) {
    console.log(`\n▶ Payload: ${c.name}`);
    try {
      const resp = await hitEndpoint(c.payload);
      console.log(`✅ RESULT:`, resp);
    } catch (e) {
      console.error(`❌ ERROR:`, e.message);
    }
  }
}

main();

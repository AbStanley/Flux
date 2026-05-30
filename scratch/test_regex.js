const text3 = "почему";
const context3 = "Я не знаю, почему он это сделал.";
const regex3 = new RegExp(`\\b${text3}\\b`);
console.log("Regex:", context3.replace(regex3, `'${text3}'`));

// Better approach using Unicode word boundaries or lookarounds:
// (?<=^|\P{L})почему(?=\P{L}|$)
// Wait, JS doesn't support \P{L} in lookbehinds until recently, and we can just use a non-capturing replace or just lookahead/lookbehind if supported.
const unicodeRegex = new RegExp(`(?<=^|[^\\p{L}\\p{N}_])${text3}(?=[^\\p{L}\\p{N}_]|$)`, 'u');
console.log("Unicode:", context3.replace(unicodeRegex, `'${text3}'`));

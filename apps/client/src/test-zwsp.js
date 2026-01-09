
const zwsp = "\u200B";
const text = "A";
console.log(`Length of ZWSP: ${zwsp.length}`);
console.log(`Trimmed length of ZWSP: ${zwsp.trim().length}`);
console.log(`Is ZWSP visible (regex \\S): ${/\S/.test(zwsp)}`);

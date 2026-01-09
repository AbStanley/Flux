
const getSelectionGroups = (indices: Set<number>, tokens: string[]): number[][] => {
    const sorted = Array.from(indices).sort((a, b) => a - b);
    if (sorted.length === 0) return [];
    const groups: number[][] = [];
    let currentGroup: number[] = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        let isContiguous = true;
        for (let k = prev + 1; k < curr; k++) {
            if (tokens[k].trim().length > 0 || tokens[k].includes('\n')) {
                isContiguous = false;
                break;
            }
        }
        if (isContiguous && /[.!?]['"”’\)]*$/.test(tokens[prev].trim())) {
            isContiguous = false;
        }
        if (isContiguous) {
            currentGroup.push(curr);
        } else {
            groups.push(currentGroup);
            currentGroup = [curr];
        }
    }
    groups.push(currentGroup);
    return groups;
};

// Case 1: Simple contiguous with spaces
const tokens1 = ["Durante", " ", "los", " ", "últimos", " ", "dos", " ", "meses,"];
const indices1 = new Set([0, 2, 4, 6, 8]); // Selecting non-space tokens (often how selection works)
const groups1 = getSelectionGroups(indices1, tokens1);
console.log("Case 1 (Spaces):", JSON.stringify(groups1));

// Case 2: Indices include spaces
const indices2 = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]);
const groups2 = getSelectionGroups(indices2, tokens1);
console.log("Case 2 (All tokens):", JSON.stringify(groups2));

// Case 3: Punctuation split
const tokens3 = ["Hello.", " ", "How", " ", "are", " ", "you?"];
const indices3 = new Set([0, 2, 4, 6]);
const groups3 = getSelectionGroups(indices3, tokens3);
console.log("Case 3 (Sentences):", JSON.stringify(groups3));

// Case 4: Comma test
const tokens4 = ["Hello,", " ", "world"];
const indices4 = new Set([0, 2]);
const groups4 = getSelectionGroups(indices4, tokens4);
console.log("Case 4 (Comma):", JSON.stringify(groups4));

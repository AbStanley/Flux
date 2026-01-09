
const getSelectionGroups = (indices, tokens) => {
    const sorted = Array.from(indices).sort((a, b) => a - b);
    if (sorted.length === 0) return [];
    const groups = [];
    let currentGroup = [sorted[0]];
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
        
        // Removed the punctuation check here, matching my recent change
        
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

// Case 1: "Durante los"
// tokens: ["Durante", " ", "los"]
// indices: {0, 2}
const tokens1 = ["Durante", " ", "los"];
const indices1 = new Set([0, 2]);
const groups1 = getSelectionGroups(indices1, tokens1);
console.log("Case 1 (Standard):", JSON.stringify(groups1));
// Expected: [[0, 2]]

// Case 2: Punctuation inside
// "meses,", " ", "había"
const tokens2 = ["meses,", " ", "había"];
const indices2 = new Set([0, 2]);
const groups2 = getSelectionGroups(indices2, tokens2);
console.log("Case 2 (Punctuation):", JSON.stringify(groups2));
// Expected: [[0, 2]] (Since I removed the check)

// Case 3: Newline
const tokens3 = ["Hello", "\n", "World"];
const indices3 = new Set([0, 2]);
const groups3 = getSelectionGroups(indices3, tokens3);
console.log("Case 3 (Newline):", JSON.stringify(groups3));
// Expected: [[0], [2]]

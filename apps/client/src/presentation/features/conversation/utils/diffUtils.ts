export interface DiffPart {
    value: string;
    added?: boolean;
    removed?: boolean;
}

/**
 * A simple character-level diffing utility.
 * Uses a basic Longest Common Subsequence (LCS) approach.
 */
export function computeDiff(oldText: string, newText: string): DiffPart[] {
    const n = oldText.length;
    const m = newText.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

    // Build DP table for LCS
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            if (oldText[i - 1] === newText[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const result: DiffPart[] = [];
    let i = n, j = m;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldText[i - 1] === newText[j - 1]) {
            result.unshift({ value: oldText[i - 1] });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.unshift({ value: newText[j - 1], added: true });
            j--;
        } else if (i > 0 && (j === 0 || dp[i - 1][j] >= dp[i][j - 1])) {
            result.unshift({ value: oldText[i - 1], removed: true });
            i--;
        }
    }

    // Merge adjacent parts of the same type for cleaner output
    const merged: DiffPart[] = [];
    for (const part of result) {
        const last = merged[merged.length - 1];
        if (last && last.added === part.added && last.removed === part.removed) {
            last.value += part.value;
        } else {
            merged.push({ ...part });
        }
    }

    return merged;
}

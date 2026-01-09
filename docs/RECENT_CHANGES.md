# Recent Critical Changes Report

## Overview
This document details the logic changes implemented in the **Reader Translation System** to address race conditions, "stuck" loading states, and complex selection overlaps. These changes significantly increased the complexity of `translationSlice.ts` and `ReaderTokenPopup.tsx`.

## 1. Translation Store (`translationSlice.ts`)

### A. Smart Deduplication (Fixing "Stuck Loading")
*   **Previous**: Used a `Set<string>` to track pending requests.
    *   *Bug*: If User clicked "Word A" twice quickly, the second click saw the ID in the Set and returned *immediately*, causing the UI to never update for the second selection.
*   **Current**: Uses `Map<string, Promise<string | null>>`.
    *   *Logic*:
        1. Check if key exists in Map.
        2. If yes, `await` the **existing** promise.
        3. If no, create promise, store in Map, await it.
    *   *Result*: Multiple concurrent requests for the same text all resolve simultaneously when the single network call finishes.

### B. Geometric Overlap Handling (Fixing "Zombie" Selections)
*   **Previous**: Only checked for *Subsets* (if new selection contains old selection). Overlaps (e.g., "AB" vs "BC") were ignored, leading to broken partially-selected UI.
*   **Current**: Implemented full overlap detection.
    *   *Logic*: `max(start1, start2) <= min(end1, end2)`
    *   *Action*:
        1. **Delete** the old overlapping group.
        2. **Calculate Remainder**: Identify indices of the old group that are *not* in the new group.
        3. **Recursive Repair**: Automatically call `translateSelection` for the remainder indices.

### C. Forced Regeneration Logic
*   **Previous**: Often returned cached result even if "Regenerate" was clicked.
*   **Current**: `translateSelection` accepts `force: boolean`.
    *   *Optimistic Phase*: If `force=true`, **ignore** existing cache, force UI to "..." state.
    *   *Fetch Phase*: If `force=true`, **bypass** `finalCache` check, preventing immediate return of stale data.

## 2. UI Components

### A. ReaderTokenPopup (`ReaderTokenPopup.tsx`)
*   **State**: Derived `isLoading` from `translation === "..."`.
*   **Loading UI**:
    *   Shows `Loader2` spinner.
    *   **Always Visible Icons**: `Play` (Volume), `Regenerate` (Refresh). Allows user to interact/retry even if stuck.
    *   **Hidden Icons**: `Save`, `More Info` (dependent on result).
*   **Result UI**:
    *   Shows Translation Text.
    *   **Auto-Hide Icons**: Icons wrapped in opacity container, revealed only on hover to reduce clutter.

### B. Prop Drilling (`ReaderMainPanel` -> `ReaderTextContent`)
*   **Change**: Passed `onRegenerateClick` explicit handler down the tree.
*   **Reason**: `ReaderTextContent` previously used a generic `regenerateSelection` from the hook which relied on store state (which might be out of sync with specific popup click). Now explicitly passes the `index` to update.

## Areas for Clean-up & Testing
1.  **Unit Tests**: The `translateSelection` function is now complex. It needs unit tests for:
    *   Subset removal.
    *   Overlap splitting (left-side overlap, right-side overlap, middle split?).
    *   Deduplication (mocked async delay).
2.  **Refactoring**: `translateSelection` is large (~150 lines). The Overlap Logic and Fetch Logic could be extracted into helper functions/hooks.
3.  **CSS**: The "Hover-to-reveal" CSS in `ReaderTokenPopup` is complex (`w-0`, `opacity-0`). Validating this on touch devices/mobile is recommended.

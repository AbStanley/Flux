// @ts-nocheck
declare const chrome: any;

console.log("[Reader Helper] Content script loaded");

document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0) {
        console.log("[Reader Helper] Text selected:", selectedText);

        // Send to Side Panel
        try {
            chrome.runtime.sendMessage({
                type: "TEXT_SELECTED",
                text: selectedText
            });
        } catch (e) {
            // Ignored: extension context might be invalidated or side panel closed
        }
    }
});

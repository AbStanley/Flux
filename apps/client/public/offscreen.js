// Offscreen document to handle SpeechSynthesis
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'OFFSCREEN_PLAY_TTS') {
        const { text, lang } = message.data;
        
        console.log(`[Offscreen] Playing TTS: "${text}" [${lang}]`);
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        
        // Prevent GC
        window._utterance = utterance;
        
        window.speechSynthesis.cancel();
        
        // Delay helps ensure cancel completes
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 50);
    }
});

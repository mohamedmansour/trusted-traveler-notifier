chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'play') {
        const audio = new Audio(chrome.runtime.getURL('sonar.wav'));
        audio.play();
    }
});
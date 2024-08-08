const SLOT_AVAILABILITY_URL = 'https://ttp.cbp.dhs.gov/schedulerapi/slot-availability?locationId={location}';
const REFRESH_URL = 'https://ttp.cbp.dhs.gov/credential/v2/refresh';
const SLOT_CHECK_INTERVAL_MILLISECONDS = 5 * 1000;
const REFRESH_TOKEN_MINUTES = 5;
const WASHINGTON_LOCATION_CODE = 5020;
const FILTER_MAX_MONTH = 8;

let popupPort;
let cached = {};
let listening = true;

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'popup') {
        popupPort = port;
        port.onDisconnect.addListener(() => {
            popupPort = null;
        });
        port.onMessage.addListener(async (request, sender, sendResponse) => {
            if (request.action === 'toggle') {
                listening = !listening;
                if (listening) {
                    await startCheckingExpiration();
                    startCheckingSlots();
                    sendMessageToPopup({ type: 'connected', data: { ...cached, connected: listening } });
                } else {
                    sendMessageToPopup({ type: 'connected', data: { ...cached, connected: false } });
                    setBadgeState('disconnected');
                }
            }
        });
        sendMessageToPopup({ type: 'connected', data: { ...cached, connected: listening } });
    }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'refreshCookie') {
        startCheckingExpiration();
    }
});

async function main() {
    setBadgeState(listening ? 'connected' : 'disconnected');
    chrome.alarms.create('refreshCookie', { periodInMinutes: REFRESH_TOKEN_MINUTES });
    await startCheckingExpiration();
    startCheckingSlots();
}

async function startCheckingExpiration() {
    const expiration = await checkExpiration()
    cached['refresh'] = expiration;
    sendMessageToPopup({ type: 'refresh', data: expiration });
}

async function startCheckingSlots() {
    while (listening) {
        const slots = await checkForSlots(WASHINGTON_LOCATION_CODE, FILTER_MAX_MONTH);
        cached['slot'] = slots;
        sendMessageToPopup({ type: 'slot', data: slots });
        await new Promise(resolve => setTimeout(resolve, SLOT_CHECK_INTERVAL_MILLISECONDS));
    }
}

function sendMessageToPopup(message) {
    if (popupPort) {
        popupPort.postMessage(message);
    }
}

async function checkExpiration() {
    try {
        const response = await fetch(REFRESH_URL);
        const refreshed = await response.json();
        return refreshed.expiration
    } catch (error) {
        return `NotLoggedIn`;
    }
}

async function playAudio() {
    if (!(await chrome.offscreen.hasDocument())) {
        await chrome.offscreen.createDocument({
            url: 'audio.html',
            reasons: ['AUDIO_PLAYBACK'],
            justification: 'testing'
        });
    }
    await chrome.runtime.sendMessage({ type: 'play' });
}


async function checkForSlots(locationCode, maxMonth) {
    const url = SLOT_AVAILABILITY_URL.replace('{location}', locationCode);
    try {
        const response = await fetch(url);
        const results = await response.json();
        const availableSlots = results.availableSlots || [];
        const validSlots = availableSlots.filter(slot => new Date(slot.startTimestamp).getMonth() + 1 <= maxMonth);

        if (validSlots.length > 0) {
            const availableSlotsText = validSlots.map(slot => slot.startTimestamp).join(', ');

            await playAudio();
            setBadgeState('found');
            
            return `${validSlots.length} slots found: ${availableSlotsText}`;
        } else {
            setBadgeState('connected');
            return `No appointments available.`;
        }
    } catch (error) {
        return `Error: ${error.message}`;
    }
}


function setBadgeState(state) {
    switch (state) {
        case 'connected':
            chrome.action.setBadgeText({ text: '🟢' });
            chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
            break;
        case 'disconnected':
            chrome.action.setBadgeText({ text: '🔴' });
            chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
            break;
        case 'found':
            chrome.action.setBadgeText({ text: '🟡' });
            chrome.action.setBadgeBackgroundColor({ color: '#ffc107' });
            break;
        default:
            break;
    }
}

main();

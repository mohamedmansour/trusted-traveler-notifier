const SLOT_AVAILABILITY_URL = 'https://ttp.cbp.dhs.gov/schedulerapi/slot-availability?locationId={locationId}';
const REFRESH_URL = 'https://ttp.cbp.dhs.gov/credential/v2/refresh';
const SUBMIT_URL = 'https://ttp.cbp.dhs.gov/scheduler?status=will-reschedule&reason={reason}&appointmentStartTimestamp={startTimestamp}&appointmentEndTimestamp={endTimestamp}&locationId={locationId}&locationName={locationName}&tzData={tzData}';
const SLOT_CHECK_INTERVAL_MILLISECONDS = 5 * 1000;
const REFRESH_TOKEN_MINUTES = 5;
const WASHINGTON_LOCATION_CODE = 5020;
const WASHINGTON_LOCATION_NAME = 'Blaine Enrollment Center';
const WASHTINGON_TZ_DATA = 'America/Los_Angeles';
const FILTER_MAX_MONTH = 8;
const RESCHEDULE_REASON = 'Reschedule to earlier date';

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
            switch (request.action) {
                case 'toggle': {
                    listening = !listening;
                    if (listening) {
                        await startCheckingExpiration();
                        startCheckingSlots();
                        sendMessageToPopup({ type: 'connected', data: { ...cached, connected: listening } });
                    } else {
                        sendMessageToPopup({ type: 'connected', data: { ...cached, connected: false } });
                        setBadgeState('disconnected');
                    }
                    break;
                }
                case 'submit': {
                    const { startTimestamp, endTimestamp } = request.data;
                    const results = await submitAppointment(startTimestamp, endTimestamp);
                    sendResponse(results);
                    break;
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

async function checkForSlots(locationId, maxMonth) {
    const url = SLOT_AVAILABILITY_URL.replace('{locationId}', locationId);
    try {
        const response = await fetch(url);
        const results = await response.json();
        const availableSlots = results.availableSlots || [];
        const validSlots = availableSlots.filter(slot => new Date(slot.startTimestamp).getMonth() + 1 <= maxMonth);

        if (validSlots.length > 0) {
            const availableSlotsText = validSlots.map(slot => slot.startTimestamp).join(', ');

            await playAudio();
            setBadgeState('found');

            return {
                ...validSlots,
                message: `${validSlots.length} slots found: ${availableSlotsText}`,
            }
        } else {
            setBadgeState('connected');
            return {
                message: `No appointments available.`,
            }
        }
    } catch (error) {
        return {
            message: error.message,
        };
    }
}

async function submitAppointment(startTimestamp, endTimestamp) {
    const url = SUBMIT_URL
        .replace('{reason}', encodeURIComponent(RESCHEDULE_REASON))
        .replace('{startTimestamp}', encodeURIComponent(startTimestamp))
        .replace('{endTimestamp}', odeURIComponent(endTimestamp))
        .replace('{locationId}', WASHINGTON_LOCATION_CODE)
        .replace('{locationName}', WASHINGTON_LOCATION_NAME)
        .replace('{tzData}', WASHTINGON_TZ_DATA);

    try {
        const response = await fetch(url);
        const results = await response.json();
        return results;
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

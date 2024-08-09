const DASHBOARD_PAGE = 'https://ttp.cbp.dhs.gov/credential/v1/login?app=GOES-prod&lang=en&state=x4ig3T8VI3yOxECRd0tY2X';
const LOGOUT_PAGE = 'https://secure.login.gov/openid_connect/logout?client_id=urn:gov:dhs:openidconnect.profiles:sp:sso:cbp:pspd-ttp-prod&post_logout_redirect_uri=https%3A%2F%2Fttp.cbp.dhs.gov%2Flogin%3Flogout%3Dlogout';

const port = chrome.runtime.connect({ name: 'popup' });

function renderRefresh(message) {
  cookie.parentElement.title = `Last checked at: ${new Date().toLocaleString()}`;
  cookie.textContent = message === 'NotLoggedIn' ? 'Not logged in' : new Date(message).toLocaleString();
  login.textContent = message === 'NotLoggedIn' ? 'Login' : 'Logout';
}

function renderSlot(data) {
  slot_message.parentElement.title = `Last checked at: ${new Date().toLocaleString()}`;
  if (data.availableSlots) {
    slots_available.innerHTML = '';
    for (let i = 0; i < data.availableSlots.length; i++) {
      let slot = data.availableSlots[i];
      const availabilityButton = document.createElement('button');
      availabilityButton.textContent = slot.startTimestamp;
      availabilityButton.onclick = submitAppointment(slot.startTimestamp, slot.endTimestamp);
      slots_available.appendChild(availabilityButton);
    }
    slot_message.textContent = '';
  } else {
    slots_available.innerHTML = '';
    slot_message.textContent = data.message;
  }
}

function submitAppointment(startTimestamp, endTimestamp) {
  return () => {
    port.postMessage({ action: 'submit', data: { startTimestamp, endTimestamp } }, (response) => {
      alert(JSON.stringify(response));
    });
  };
}

function renderConnection(message) {
  connection.parentElement.title = `Last checked at: ${new Date().toLocaleString()}`;
  connection.textContent = message ? 'Disconnect' : 'Connect';
}

connection.addEventListener('click', () => {
  port.postMessage({ action: 'toggle' });
});

login.addEventListener('click', () => {
  if (login.textContent === 'Login') {
    window.open(DASHBOARD_PAGE);
  } else {
    window.open(LOGOUT_PAGE);
  }
});

port.onMessage.addListener((message) => {
  switch (message.type) {
    case 'connected':
      renderConnection(message.data.connected);
      renderSlot(message.data.slot);
      renderRefresh(message.data.refresh);
      break;
    case 'slot':
      renderSlot(message.data);
      break;
    case 'refresh':
      renderRefresh(message.data);
      break;
  }
});

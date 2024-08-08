const DASHBOARD_PAGE = 'https://ttp.cbp.dhs.gov/credential/v1/login?app=GOES-prod&lang=en&state=x4ig3T8VI3yOxECRd0tY2X';
const LOGOUT_PAGE = 'https://secure.login.gov/openid_connect/logout?client_id=urn:gov:dhs:openidconnect.profiles:sp:sso:cbp:pspd-ttp-prod&post_logout_redirect_uri=https%3A%2F%2Fttp.cbp.dhs.gov%2Flogin%3Flogout%3Dlogout';
const SCHEDULE_PAGE = 'https://ttp.cbp.dhs.gov/schedulerui/schedule-interview/location?lang=en&reqReason=true&token=&returnUrl=ttp-external-scheduler&service=nh&type=update&finExt=true';

const port = chrome.runtime.connect({ name: 'popup' });

function renderRefresh(message) {
  cookie.parentElement.title = `Last checked at: ${new Date().toLocaleString()}`;
  cookie.textContent = message === 'NotLoggedIn' ? 'Not logged in' : new Date(message).toLocaleString();
  login.textContent = message === 'NotLoggedIn' ? 'Login' : 'Logout';
}

function renderSlot(message) {
  slot.parentElement.title = `Last checked at: ${new Date().toLocaleString()}`;
  slot.textContent = message;
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

view.addEventListener('click', () => {
  window.open(SCHEDULE_PAGE)
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

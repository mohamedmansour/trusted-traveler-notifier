const port = chrome.runtime.connect({ name: 'popup' });

function renderRefresh(message) {
  cookie.parentElement.title = `Last checked at: ${new Date().toLocaleString()}`;
  cookie.textContent = message === 'NotLoggedIn' ? 'Not logged in' : new Date(message).toLocaleString();
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

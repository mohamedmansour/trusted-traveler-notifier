const port = chrome.runtime.connect({ name: 'popup' });

function renderRefresh(message) {
  cookie.parentElement.title = `Last checked at: ${new Date().toLocaleString()}`
  cookie.textContent = new Date(message).toLocaleString();
}

function renderSlot(message) {
  slot.parentElement.title = `Last checked at: ${new Date().toLocaleString()}`;
  slot.textContent = message;
}

function renderConnection() {
  connection.parentElement.title = `Last checked at: ${new Date().toLocaleString()}`;
  connection.textContent = 'Connected';
}

port.onMessage.addListener((message) => {
  switch (message.type) {
    case 'connected':
      renderConnection();
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

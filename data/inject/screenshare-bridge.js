(function() {
  const id = 'np-ss-auth-port';
  let port = document.getElementById(id);
  if (!port) {
    port = document.createElement('span');
    port.id = id;
    port.style.display = 'none';
    document.documentElement.append(port);
  }

  const sync = () => {
    port.dataset.npToken = 'free-tier';
    port.dataset.npLoggedIn = 'true';
    port.dataset.npIsPro = 'true';
  };

  sync();
  chrome.storage.onChanged.addListener(sync);

  const observer = new MutationObserver(() => {
    if (port.dataset.npOpenLogin === 'true') {
      port.dataset.npOpenLogin = 'false';
      try {
        chrome.runtime.sendMessage({ action: 'showLoginPrompt' });
      } catch (err) {}
    }
  });
  observer.observe(port, { attributes: true, attributeFilter: ['data-np-open-login'] });
})();

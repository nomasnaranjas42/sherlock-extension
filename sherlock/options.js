document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("apiKey");
  const enableToggle = document.getElementById("enableToggle");
  const status = document.getElementById("status");

  // Load saved settings
  chrome.storage.sync.get(["tmdbApiKey", "sherlockEnabled"], (data) => {
    apiKeyInput.value = data.tmdbApiKey || "";
    enableToggle.checked = data.sherlockEnabled ?? true;
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    const enabled = enableToggle.checked;

    chrome.storage.sync.set({
      tmdbApiKey: apiKey,
      sherlockEnabled: enabled
    }, () => {
      status.textContent = "Settings saved!";
      setTimeout(() => (status.textContent = ""), 2000);
    });
  });
});


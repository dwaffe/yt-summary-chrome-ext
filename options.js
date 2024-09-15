document.getElementById('save').addEventListener('click', function() {
    var apiKey = document.getElementById('apiKey').value;
    chrome.storage.local.set({
        openRouterApiKey: apiKey
    }, function() {
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
});

// Załaduj zapisany klucz API przy otwarciu strony opcji
chrome.storage.local.get('openRouterApiKey', function(data) {
    if (data.openRouterApiKey) {
        document.getElementById('apiKey').value = data.openRouterApiKey;
    }
});
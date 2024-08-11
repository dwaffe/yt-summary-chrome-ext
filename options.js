document.getElementById('save').addEventListener('click', function() {
    var apiKey = document.getElementById('apiKey').value;
    chrome.storage.local.set({
        anthropicApiKey: apiKey
    }, function() {
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
});

// Załaduj zapisany klucz API przy otwarciu strony opcji
chrome.storage.local.get('anthropicApiKey', function(data) {
    if (data.anthropicApiKey) {
        document.getElementById('apiKey').value = data.anthropicApiKey;
    }
});
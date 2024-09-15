let summaries = [];
let sortOrder = 'newest';

document.addEventListener('DOMContentLoaded', () => {
    const summariesContainer = document.getElementById('summaries-container');
    const sortButton = document.getElementById('sort-button');

    loadSummaries();

    sortButton.addEventListener('click', () => {
        sortOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
        sortButton.textContent = `Sort ${sortOrder === 'newest' ? 'Oldest First' : 'Newest First'}`;
        displaySummaries();
    });
});

function loadSummaries() {
    chrome.storage.local.get(['summaries'], (result) => {
        summaries = Object.entries(result.summaries || {}).map(([videoId, data]) => ({
            videoId,
            ...data
        }));
        displaySummaries();
    });
}

function displaySummaries() {
    const summariesContainer = document.getElementById('summaries-container');
    summariesContainer.innerHTML = '';

    if (summaries.length === 0) {
        summariesContainer.innerHTML = '<p>No summaries available yet.</p>';
    } else {
        summaries
            .sort((a, b) => {
                return sortOrder === 'newest'
                    ? new Date(b.timestamp) - new Date(a.timestamp)
                    : new Date(a.timestamp) - new Date(b.timestamp);
            })
            .forEach((summary, index) => {
                const summaryElement = document.createElement('div');
                summaryElement.className = 'summary';
                summaryElement.innerHTML = `
                    <h2>
                        <a href="https://www.youtube.com/watch?v=${summary.videoId}" target="_blank">
                            ${summary.videoId}
                        </a>
                    </h2>
                    <p><strong>Date:</strong> ${formatDate(summary.timestamp)}</p>
                    <p><strong>Summary:</strong></p>
                    <pre>${summary.summary}</pre>
                    <button class="copy-button" data-index="${index}">Copy Summary</button>
                    <button class="delete-button" data-index="${index}">Delete Summary</button>
                `;
                summariesContainer.appendChild(summaryElement);
            });

        addEventListeners();
    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function addEventListeners() {
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            copyToClipboard(summaries[index].summary);
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            deleteSummary(index);
        });
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Summary copied to clipboard!');
    }, (err) => {
        console.error('Could not copy text: ', err);
    });
}

function deleteSummary(index) {
    if (confirm('Are you sure you want to delete this summary?')) {
        const videoIdToDelete = summaries[index].videoId;
        summaries.splice(index, 1);

        chrome.storage.local.get(['summaries'], (result) => {
            const updatedSummaries = result.summaries || {};
            delete updatedSummaries[videoIdToDelete];
            chrome.storage.local.set({ summaries: updatedSummaries }, () => {
                displaySummaries();
            });
        });
    }
}
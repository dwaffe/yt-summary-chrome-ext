document.addEventListener('DOMContentLoaded', () => {
    const summariesContainer = document.getElementById('summaries-container');

    chrome.storage.local.get(['summaries'], (result) => {
        const summaries = result.summaries || [];
        
        if (summaries.length === 0) {
            summariesContainer.innerHTML = '<p>No summaries available yet.</p>';
        } else {
            summaries.forEach((summary, index) => {
                const summaryElement = document.createElement('div');
                summaryElement.className = 'summary';
                summaryElement.innerHTML = `
                    <h2>${summary.title}</h2>
                    <p><strong>Video ID:</strong> ${summary.videoId}</p>
                    <p><strong>Summary:</strong></p>
                    <pre>${summary.content}</pre>
                `;
                summariesContainer.appendChild(summaryElement);
            });
        }
    });
});
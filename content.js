// Funkcja do tworzenia i dodawania przycisku do miniatury
function addButtonToThumbnail(thumbnail) {
    if (thumbnail.querySelector('.summary-btn')) return; // Jeśli przycisk już istnieje, nie dodawaj kolejnego

    const button = document.createElement('button');
    button.textContent = '+';
    button.className = 'summary-btn';
    button.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        font-size: 16px;
        cursor: pointer;
        z-index: 1000;
    `;

    button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const videoId = getVideoIdFromThumbnail(thumbnail);
        if (videoId) {
            addToQueue(videoId);
        }
    });

    thumbnail.style.position = 'relative';
    thumbnail.appendChild(button);
}

// Funkcja do pobierania ID filmu z miniatury
function getVideoIdFromThumbnail(thumbnail) {
    const link = thumbnail.querySelector('a#thumbnail');
    if (!link) {
        // Jeśli nie znaleziono linku wewnątrz miniatury, szukaj w elemencie nadrzędnym
        const parentElement = thumbnail.closest('ytd-rich-item-renderer');
        if (parentElement) {
            const link = parentElement.querySelector('a#thumbnail');
            if (link) {
                const href = link.getAttribute('href');
                const match = href.match(/\/watch\?v=([^&]+)/);
                return match ? match[1] : null;
            }
        }
    } else {
        const href = link.getAttribute('href');
        const match = href.match(/\/watch\?v=([^&]+)/);
        return match ? match[1] : null;
    }
    return null;
}

// Funkcja do dodawania filmu do kolejki
function addToQueue(videoId) {
    chrome.runtime.sendMessage({action: "addToQueue", videoId: videoId}, function(response) {
        if (response && response.success) {
            console.log('Video added to queue:', videoId);
        } else {
            console.error('Failed to add video to queue:', videoId);
        }
    });
}

// Funkcja do obserwowania zmian w DOM i dodawania przycisków do nowych miniatur
function observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const thumbnails = node.querySelectorAll('div#thumbnail');
                        thumbnails.forEach(addButtonToThumbnail);
                    }
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Dodaj przyciski do istniejących miniatur
function addButtonsToExistingThumbnails() {
    const thumbnails = document.querySelectorAll('div#thumbnail');
    thumbnails.forEach(addButtonToThumbnail);
}

// Funkcja do dodawania przycisku "Summarize" na stronie filmu
function addSummarizeButtonToVideoPage() {
    if (document.querySelector('#summarize-button')) return; // Jeśli przycisk już istnieje, nie dodawaj kolejnego

    const actionsContainer = document.querySelector('#top-level-buttons-computed');
    if (actionsContainer) {
        const summarizeButton = document.createElement('button');
        summarizeButton.id = 'summarize-button';
        summarizeButton.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m';
        summarizeButton.style.marginRight = '8px';
        summarizeButton.innerHTML = `
            <div class="yt-spec-button-shape-next__button-text-content">
                <span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap">Summarize</span>
            </div>
        `;

        summarizeButton.addEventListener('click', function() {
            const videoId = new URLSearchParams(window.location.search).get('v');
            if (videoId) {
                addToQueue(videoId);
            }
        });

        // Wstaw przycisk przed pierwszym dzieckiem kontenera akcji
        actionsContainer.insertBefore(summarizeButton, actionsContainer.firstChild);
        console.log('Summarize button added successfully');
    } else {
        console.error('Actions container not found');
    }
}

// Funkcja do sprawdzania, czy jesteśmy na stronie filmu i dodawania przycisku "Summarize"
function checkAndAddSummarizeButton() {
    if (window.location.pathname === '/watch') {
        // Użyj MutationObserver, aby poczekać na załadowanie przycisku akcji
        const observer = new MutationObserver((mutations, obs) => {
            const actionsContainer = document.querySelector('#top-level-buttons-computed');
            if (actionsContainer) {
                addSummarizeButtonToVideoPage();
                obs.disconnect(); // Przestań obserwować po dodaniu przycisku
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Nowa funkcja do dodawania przycisku "Summaries" na każdej stronie YouTube
function addSummariesButton() {
    if (document.querySelector('#summaries-button')) return; // Jeśli przycisk już istnieje, nie dodawaj kolejnego

    const ytdAppContainer = document.querySelector('ytd-app');
    if (ytdAppContainer) {
        const summariesButton = document.createElement('button');
        summariesButton.id = 'summaries-button';
        summariesButton.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m';
        summariesButton.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            z-index: 2000;
            padding: 8px 16px;
            background-color: #065fd4;
            color: white;
            border: none;
            border-radius: 2px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
        `;
        summariesButton.textContent = 'Summaries';

        summariesButton.addEventListener('click', function() {
            chrome.runtime.sendMessage({action: "openSummariesPage"});
        });

        ytdAppContainer.appendChild(summariesButton);
        console.log('Summaries button added successfully');
    } else {
        console.error('YouTube app container not found');
    }
}

// Inicjalizacja
function init() {
    addButtonsToExistingThumbnails();
    observeDOMChanges();
    checkAndAddSummarizeButton();
    addSummariesButton(); // Dodaj nowy przycisk "Summaries"
}

// Uruchom inicjalizację po załadowaniu strony
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Nasłuchuj zmian w URL, aby dodać przycisk "Summarize" po przejściu na stronę filmu
let lastUrl = location.href; 
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        checkAndAddSummarizeButton();
        addSummariesButton(); // Dodaj przycisk "Summaries" przy każdej zmianie strony
    }
}).observe(document, {subtree: true, childList: true});
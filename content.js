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
                        const thumbnails = node.querySelectorAll('#thumbnail');
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

// Inicjalizacja
function init() {
    addButtonsToExistingThumbnails();
    observeDOMChanges();
}

// Uruchom inicjalizację po załadowaniu strony
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
// Stałe
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';
const RE_YOUTUBE = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
const RE_XML_TRANSCRIPT = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;

// Funkcja do sprawdzania, czy klucz API jest ustawiony
async function checkApiKey() {
    const apiKey = await getApiKey();
    if (!apiKey) {
        console.log("API key not set. Please set it in the extension options.");
        // Tutaj możesz dodać kod do powiadomienia użytkownika, np. przez chrome.notifications
        chrome.runtime.openOptionsPage();
    }
}

// Inicjalizacja kolejki w pamięci przeglądarki
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({queue: []}, () => {
        console.log("Queue initialized");
    });

    checkApiKey();
});

// Obsługa wiadomości od content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "addToQueue") {
        chrome.storage.local.get('queue', (data) => {
            let queue = data.queue || [];
            if (!queue.includes(request.videoId)) {
                queue.push(request.videoId);
                chrome.storage.local.set({queue: queue}, () => {
                    console.log("Video added to queue:", request.videoId);
                    console.log("Current queue:", queue);
                    sendResponse({success: true});
                    processQueue(); // Start processing the queue
                });
            } else {
                console.log("Video already in queue:", request.videoId);
                sendResponse({success: false, message: "Video already in queue"});
            }
        });
        return true; // Informs Chrome that the response will be sent asynchronously
    } else if (request.action === "openSummariesPage") {
        chrome.tabs.create({ url: chrome.runtime.getURL("summaries.html") });
        sendResponse({success: true});
        return false; // No asynchronous response needed
    }
});

async function processQueue() {
    const apiKey = await getApiKey();
    if (!apiKey) {
        console.log("API key not set. Please set it in the extension options.");
        chrome.runtime.openOptionsPage();
        return;
    }

    chrome.storage.local.get('queue', async (data) => {
        let queue = data.queue || [];
        if (queue.length > 0) {
            let videoId = queue[0];
            console.log("Processing video:", videoId);
            
            try {
                const transcript = await fetchTranscript(videoId);
                console.log("Transcript obtained:", transcript.substring(0, 100) + "...");
                
                const summary = await sendToOpenRouterApi(transcript, apiKey);
                console.log("Summary obtained:", summary);

                await saveSummary(videoId, summary);
                console.log("Summary saved for video:", videoId);

            } catch (error) {
                if (error.message.includes("Transcript is disabled") || error.message.includes("No transcripts are available")) {
                    console.log(`No transcript available for video ${videoId}. Consider using speech-to-text in the future.`);
                    await saveSummary(videoId, "No transcript available for this video.");
                } else {
                    console.error("Error processing video:", videoId, error);
                    await saveSummary(videoId, "Error occurred while processing this video.");
                }
            }

            // Remove the processed video from the queue
            queue.shift();
            chrome.storage.local.set({queue: queue}, () => {
                // Continue processing the queue if there are more items
                if (queue.length > 0) {
                    processQueue();
                }
            });
        }
    });
}

async function saveSummary(videoId, summary) {
    return new Promise((resolve) => {
        chrome.storage.local.get('summaries', (data) => {
            let summaries = data.summaries || {};
            summaries[videoId] = {
                summary: summary,
                timestamp: new Date().toISOString()
            };
            chrome.storage.local.set({summaries: summaries}, resolve);
        });
    });
}

async function sendToOpenRouterApi(transcript, apiKey) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "anthropic/claude-3-sonnet-20240229",
            messages: [
                {
                    role: "system",
                    content: "Podsumuj fakty z transkrypcji video w języku polskim"
                },
                {
                    role: "user",
                    content: `video transcript: ${transcript}`
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Function to fetch transcript
async function fetchTranscript(videoId) {
    const identifier = retrieveVideoId(videoId);
    const videoPageResponse = await fetch(
        `https://www.youtube.com/watch?v=${identifier}`,
        {
            headers: {
                'User-Agent': USER_AGENT,
            },
        }
    );
    const videoPageBody = await videoPageResponse.text();

    const splittedHTML = videoPageBody.split('"captions":');

    if (splittedHTML.length <= 1) {
        if (videoPageBody.includes('class="g-recaptcha"')) {
            throw new Error('Too many requests, YouTube requires solving a captcha');
        }
        if (!videoPageBody.includes('"playabilityStatus":')) {
            throw new Error(`The video is no longer available (${videoId})`);
        }
        throw new Error(`Transcript is disabled on this video (${videoId})`);
    }

    const captions = (() => {
        try {
            return JSON.parse(
                splittedHTML[1].split(',"videoDetails')[0].replace('\n', '')
            );
        } catch (e) {
            return undefined;
        }
    })()?.['playerCaptionsTracklistRenderer'];

    if (!captions || !('captionTracks' in captions)) {
        throw new Error(`No transcripts are available for this video (${videoId})`);
    }

    const transcriptURL = captions.captionTracks[0].baseUrl;

    const transcriptResponse = await fetch(transcriptURL, {
        headers: {
            'User-Agent': USER_AGENT,
        },
    });
    if (!transcriptResponse.ok) {
        throw new Error(`No transcripts are available for this video (${videoId})`);
    }
    const transcriptBody = await transcriptResponse.text();
    const results = [...transcriptBody.matchAll(RE_XML_TRANSCRIPT)];
    return results.map(result => result[3]).join(' ');
}

// Function to retrieve video ID from URL or string
function retrieveVideoId(videoId) {
    if (videoId.length === 11) {
        return videoId;
    }
    const matchId = videoId.match(RE_YOUTUBE);
    if (matchId && matchId.length) {
        return matchId[1];
    }
    throw new Error('Impossible to retrieve Youtube video ID.');
}

// Funkcja do ustawiania klucza API
function setApiKey(apiKey) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ 'openRouterApiKey': apiKey }, resolve);
    });
}

// Funkcja do pobierania klucza API
function getApiKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get('openRouterApiKey', (result) => {
            resolve(result.openRouterApiKey);
        });
    });
}
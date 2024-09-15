# YouTube Summary Extension

Get AI-generated summaries of EVERY YouTube video.

## Description

The YouTube Summary Extension is a browser extension that provides AI-generated summaries for YouTube videos. It enhances your YouTube viewing experience by offering quick and concise summaries of video content, saving you time and helping you decide which videos to watch.

## Features

- AI-generated summaries for YouTube videos
- Works on all YouTube video pages
- Easy-to-use interface integrated into YouTube
- Persistent "Summaries" button for quick access to all your video summaries
- Sort and manage your summaries

## Installation

1. Clone this repository or download the source code.
2. Open your Chrome browser and navigate to `chrome://extensions`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.
5. The YouTube Summary Extension should now be installed and visible in your browser toolbar.

## Usage

1. Navigate to YouTube (https://www.youtube.com).
2. Browse through the video thumbnails on the page.
3. You'll notice a "+" button on the top-right corner of each video thumbnail.
4. Click the "+" button on any video you want to summarize.
5. The video will be added to a queue for summarization.
6. On any YouTube page, you'll see a new "Summaries" button in the top-right corner of the page.
7. Click the "Summaries" button to open the summaries page in a new tab.
8. On the summaries page, you can view all your generated summaries, copy them to clipboard, or delete them.
9. Use the "Sort" button on the summaries page to toggle between newest and oldest summaries first.

Note: The summarization process may take a moment. You can continue browsing YouTube while waiting for your summaries.

## File Structure

- `manifest.json`: Extension configuration file
- `background.js`: Background script for handling extension events
- `content.js`: Content script for interacting with YouTube pages
- `popup.html` & `popup.js`: Popup interface for the extension
- `options.html` & `options.js`: Options page for customizing extension settings
- `summaries.html` & `summaries.js`: Summaries page for viewing and managing summaries
- `styles.css`: Styles for the extension's UI
- `icon16.png`, `icon48.png`, `icon128.png`: Extension icons

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

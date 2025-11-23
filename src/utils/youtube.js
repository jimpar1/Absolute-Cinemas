/**
 * YouTube URL utilities.
 * Helpers for extracting video IDs from various YouTube URL formats.
 */

/**
 * Extracts the 11-character video ID from a YouTube URL.
 * Supports standard, shortened (youtu.be), and embed URLs.
 * @param {string} url - A YouTube video URL
 * @returns {string|null} The video ID, or null if the URL is not a valid YouTube link
 */
export function getYouTubeVideoId(url) {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

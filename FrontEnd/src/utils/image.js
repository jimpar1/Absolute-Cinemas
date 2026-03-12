/**
 * TMDB image URL utilities.
 * Helpers for upgrading TMDB image URLs to higher quality variants.
 */

/**
 * Upgrades a TMDB image URL to the highest quality (original size).
 * Replaces width-based paths (w200, w500, etc.) with /original/.
 * Non-TMDB URLs are returned unchanged.
 * @param {string} url - The image URL to upgrade
 * @returns {string} The upgraded URL, or the original URL if not from TMDB
 */
export function getHighQualityImage(url) {
    if (!url) return url;
    try {
        const parsed = new URL(url);
        if (parsed.hostname === 'image.tmdb.org') {
            return url.replace(/\/t\/p\/w\d+\//, '/t/p/original/');
        }
    } catch {
        return url;
    }
    return url;
}

/**
 * Builds an array of high-quality backdrop images from a movie object.
 * Uses shots if available, falls back to the poster.
 * @param {object} movie - The movie object (must have .shots and .poster_url)
 * @returns {string[]} Array of high-quality image URLs
 */
export function getBackdropImages(movie) {
    if (movie?.shots && movie.shots.length > 0) {
        return movie.shots.map(shot => getHighQualityImage(shot));
    }
    return movie?.poster_url ? [getHighQualityImage(movie.poster_url)] : [];
}

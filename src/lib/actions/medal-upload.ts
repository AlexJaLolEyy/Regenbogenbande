"use server";

export async function scrapeMedalClip(url: string) {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
        });

        if (!response.ok) {
            return { success: false, error: "Failed to fetch URL" };
        }

        const html = await response.text();

        // Regex helper to find meta tags
        const getMeta = (property: string) => {
            const regex = new RegExp(
                `<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`,
                "i"
            );
            const match = html.match(regex);
            if (match) return match[1];

            const altRegex = new RegExp(
                `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
                "i"
            );
            const altMatch = html.match(altRegex);
            return altMatch ? altMatch[1] : null;
        };

        const title = getMeta("og:title");
        const description = getMeta("og:description");
        const image = getMeta("og:image");

        let videoUrl = getMeta("og:video") || getMeta("og:video:url") || getMeta("twitter:player:stream");

        // Attempt to extract direct source if og tags are generic embeds
        if (!videoUrl || !videoUrl.endsWith('.mp4')) {
            const sourceMatch = html.match(/<source[^>]+src=["']([^"']+\.mp4)["']/i);
            if (sourceMatch) {
                videoUrl = sourceMatch[1];
            }
        }

        const videoType = getMeta("og:video:type");
        const siteName = getMeta("og:site_name");

        // --- NEW: Date & Duration Extraction via JSON-LD ---
        let datePublished: string | null = null;
        let durationSec: number | null = null;
        try {
            const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
            if (jsonLdMatch && jsonLdMatch[1]) {
                const jsonLd = JSON.parse(jsonLdMatch[1]);
                // JSON-LD can be an array or object
                const data = Array.isArray(jsonLd) ? jsonLd[0] : jsonLd;
                if (data) {
                    datePublished = data.datePublished || data.uploadDate || null;

                    // Parse Duration (ISO 8601 format like PT23S or PT1M30S)
                    if (data.duration) {
                        const match = data.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
                        if (match) {
                            const hours = parseFloat(match[1] || '0');
                            const minutes = parseFloat(match[2] || '0');
                            const seconds = parseFloat(match[3] || '0');
                            durationSec = (hours * 3600) + (minutes * 60) + seconds;
                        }
                    }
                }
            }
        } catch (e) {
            console.error("JSON-LD parse error", e);
        }

        // Fallback: Check if URL has duration param (Medal specific)
        if (!durationSec) {
            const urlMatch = url.match(/[?&]v=([\d.]+)/);
            if (urlMatch) {
                durationSec = parseFloat(urlMatch[1]);
            }
        }

        // --- NEW: File Size & Real URL resolution ---
        let fileSizeStr: string | null = null;
        let resolvedVideoUrl = videoUrl;

        if (videoUrl) {
            try {
                // Medal API urls might redirect or show metadata. 
                // If it's the socialVideoUrl (implied by user's log), it usually works as a direct source but checking HEAD is good.
                // Note: Medal might require headers or cookies, but let's try a simple HEAD.
                const headRes = await fetch(videoUrl, {
                    method: 'HEAD',
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    }
                });

                if (headRes.ok) {
                    resolvedVideoUrl = headRes.url; // In case of redirects
                    const length = headRes.headers.get('content-length');
                    if (length) {
                        const bytes = parseInt(length, 10);
                        if (!isNaN(bytes)) {
                            const k = 1024;
                            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                            const i = Math.floor(Math.log(bytes) / Math.log(k));
                            fileSizeStr = parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                        }
                    }
                }
            } catch (e) {
                console.error("Head request failed", e);
            }
        }

        return {
            success: true,
            data: {
                title,
                description,
                image,
                videoUrl: resolvedVideoUrl, // Use resolved URL if valid
                videoType,
                siteName,
                originalUrl: url,
                datePublished,
                duration: durationSec,
                fileSize: fileSizeStr
            }
        };

    } catch (error) {
        console.error("Scraping error:", error);
        return { success: false, error: "Internal scraping error" };
    }
}

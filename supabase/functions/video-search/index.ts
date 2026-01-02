const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VideoResult {
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  source: string;
  embedUrl: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, safeSearch = true } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Video search for:", query);

    // Search DuckDuckGo for videos
    const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query + " video")}&kp=${safeSearch ? "1" : "-2"}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`Video search failed with status: ${response.status}`);
    }

    const html = await response.text();
    const results: VideoResult[] = [];

    // Parse video results from the HTML
    // Look for YouTube, Vimeo, and other video platforms
    const videoPatterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g,
      /youtu\.be\/([a-zA-Z0-9_-]+)/g,
      /vimeo\.com\/(\d+)/g,
    ];

    // Extract result blocks
    const resultBlocks = html.match(/<a class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g) || [];
    const snippetBlocks = html.match(/<a class="result__snippet"[^>]*>([^<]*)<\/a>/g) || [];

    for (let i = 0; i < Math.min(resultBlocks.length, 10); i++) {
      const urlMatch = resultBlocks[i]?.match(/href="([^"]*)"/);
      const titleMatch = resultBlocks[i]?.match(/>([^<]*)<\/a>/);
      
      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];
        const title = titleMatch ? titleMatch[1].trim() : "Untitled Video";
        
        // Check if it's a video platform URL
        let embedUrl: string | null = null;
        let thumbnail = "";
        let isVideo = false;

        // YouTube
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (ytMatch) {
          const videoId = ytMatch[1];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
          thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
          isVideo = true;
        }

        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
          const videoId = vimeoMatch[1];
          embedUrl = `https://player.vimeo.com/video/${videoId}`;
          thumbnail = `https://vumbnail.com/${videoId}.jpg`;
          isVideo = true;
        }

        // Dailymotion
        const dailymotionMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
        if (dailymotionMatch) {
          const videoId = dailymotionMatch[1];
          embedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
          thumbnail = `https://www.dailymotion.com/thumbnail/video/${videoId}`;
          isVideo = true;
        }

        if (isVideo) {
          results.push({
            title: title.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'"),
            url,
            thumbnail,
            duration: "",
            source: new URL(url).hostname.replace("www.", ""),
            embedUrl,
          });
        }
      }
    }

    // If no video results found through parsing, create sample results for popular video searches
    if (results.length === 0) {
      // Try to find any YouTube links in the page
      const youtubeLinks = html.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/g) || [];
      const uniqueIds = [...new Set(youtubeLinks.map(l => l.match(/v=([a-zA-Z0-9_-]{11})/)?.[1]).filter(Boolean))];
      
      for (const videoId of uniqueIds.slice(0, 6)) {
        if (videoId) {
          results.push({
            title: `Video result for "${query}"`,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            duration: "",
            source: "youtube.com",
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
          });
        }
      }
    }

    console.log(`Found ${results.length} video results`);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Video search error:", error);
    const errorMessage = error instanceof Error ? error.message : "Video search failed";
    return new Response(
      JSON.stringify({ success: false, results: [], error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

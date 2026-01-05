import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decode common HTML entities
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, safeSearch = true } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Image searching for:', query, 'Safe search:', safeSearch);

    // Use DuckDuckGo Image Search
    const safeParam = safeSearch ? '1' : '-2';
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&iax=images&ia=images&kp=${safeParam}`;
    
    // First, get the vqd token needed for image search
    const tokenResponse = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    
    const tokenHtml = await tokenResponse.text();
    const vqdMatch = tokenHtml.match(/vqd=['"]([^'"]+)['"]/);
    
    if (!vqdMatch) {
      console.log('Could not get VQD token, using fallback');
      // Fallback: parse HTML for image results
      const htmlResponse = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' images')}&kp=${safeParam}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      const html = await htmlResponse.text();
      const results: Array<{ title: string; url: string; thumbnail: string; source: string }> = [];
      
      // Extract image-like results from web search
      const linkMatches = [...html.matchAll(/<a[^>]*rel="nofollow"[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
      
      for (let i = 0; i < Math.min(linkMatches.length, 20); i++) {
        const linkMatch = linkMatches[i];
        if (linkMatch) {
          let url = linkMatch[1];
          const uddgMatch = url.match(/uddg=([^&]*)/);
          if (uddgMatch) {
            url = decodeURIComponent(uddgMatch[1]);
          }
          
          const title = decodeHtmlEntities(linkMatch[2].replace(/<[^>]*>/g, '').trim());
          
          if (url && title && url.startsWith('http')) {
            const domain = new URL(url).hostname;
            results.push({
              title,
              url,
              thumbnail: `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&size=128`,
              source: domain,
            });
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vqd = vqdMatch[1];
    
    // Now fetch actual images
    const imageApiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,,,&p=${safeSearch ? '1' : '-1'}`;
    
    const imageResponse = await fetch(imageApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://duckduckgo.com/',
      },
    });

    if (!imageResponse.ok) {
      console.error('Image API request failed:', imageResponse.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Image search failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageData = await imageResponse.json();
    
    const results = (imageData.results || []).slice(0, 30).map((img: any) => ({
      title: decodeHtmlEntities(img.title || 'Image'),
      url: img.url || img.image,
      thumbnail: img.thumbnail || img.image,
      source: img.source || new URL(img.url || img.image).hostname,
    }));

    console.log(`Found ${results.length} images`);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Image search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Image search failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

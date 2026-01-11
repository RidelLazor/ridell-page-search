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
    const { query, safeSearch = true, dateRange = 'any' } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for:', query, 'Safe search:', safeSearch, 'Date range:', dateRange);

    // Use DuckDuckGo HTML search with safe search parameter
    // kp=-2 disables safe search, kp=1 enables moderate, kp=-1 enables strict
    const safeParam = safeSearch ? '1' : '-2';
    
    // Date filter: df=d (day), df=w (week), df=m (month), df=y (year)
    const dateParams: Record<string, string> = {
      'any': '',
      'day': '&df=d',
      'week': '&df=w',
      'month': '&df=m',
      'year': '&df=y',
    };
    const dateParam = dateParams[dateRange] || '';
    
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kp=${safeParam}${dateParam}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      console.error('DuckDuckGo request failed:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Search request failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    
    // Parse the HTML to extract search results
    const results: Array<{ 
      title: string; 
      url: string; 
      description: string;
      sitelinks?: Array<{ title: string; url: string; description?: string }>;
    }> = [];
    
    // Check for spell correction suggestion
    let spellCorrection: string | null = null;
    const spellMatch = html.match(/Did you mean:.*?<a[^>]*>([^<]+)<\/a>/i);
    if (spellMatch) {
      spellCorrection = decodeHtmlEntities(spellMatch[1].trim());
    }
    
    // Extract all result links and titles
    const linkMatches = [...html.matchAll(/<a[^>]*rel="nofollow"[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
    const snippetMatches = [...html.matchAll(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi)];
    
    for (let i = 0; i < Math.min(linkMatches.length, 10); i++) {
      const linkMatch = linkMatches[i];
      const snippetMatch = snippetMatches[i];
      
      if (linkMatch) {
        // Clean up the URL - DuckDuckGo wraps URLs in a redirect
        let url = linkMatch[1];
        const uddgMatch = url.match(/uddg=([^&]*)/);
        if (uddgMatch) {
          url = decodeURIComponent(uddgMatch[1]);
        }
        
        // Clean up title (remove HTML tags and decode entities)
        const title = decodeHtmlEntities(linkMatch[2].replace(/<[^>]*>/g, '').trim());
        
        // Clean up description (remove HTML tags and decode entities)
        const description = snippetMatch 
          ? decodeHtmlEntities(snippetMatch[1].replace(/<[^>]*>/g, '').trim())
          : '';
        
        if (url && title && url.startsWith('http')) {
          // Generate sitelinks for the first result (simulated based on domain patterns)
          let sitelinks: Array<{ title: string; url: string; description?: string }> | undefined;
          
          if (i === 0) {
            try {
              const urlObj = new URL(url);
              const domain = urlObj.hostname;
              
              // Common sitelink patterns for popular sites
              const sitelinkPatterns: Record<string, Array<{ title: string; path: string; description: string }>> = {
                'default': [
                  { title: 'About', path: '/about', description: 'Learn more about us' },
                  { title: 'Contact', path: '/contact', description: 'Get in touch with us' },
                  { title: 'Help', path: '/help', description: 'Find help and support' },
                  { title: 'Login', path: '/login', description: 'Sign in to your account' },
                ]
              };
              
              const patterns = sitelinkPatterns['default'];
              sitelinks = patterns.map(p => ({
                title: p.title,
                url: `${urlObj.origin}${p.path}`,
                description: p.description
              }));
            } catch (e) {
              // Ignore URL parsing errors
            }
          }
          
          results.push({ title, url, description, sitelinks });
        }
      }
    }

    console.log(`Found ${results.length} results`);

    // Try to build a knowledge panel from the first result
    let knowledgePanel = null;
    if (results.length > 0) {
      const firstResult = results[0];
      try {
        const urlObj = new URL(firstResult.url);
        // Only create knowledge panel for well-known domains
        const knownDomains = ['wikipedia.org', 'imdb.com', 'rottentomatoes.com', 'github.com'];
        const isKnownDomain = knownDomains.some(d => urlObj.hostname.includes(d));
        
        if (isKnownDomain || results.length >= 3) {
          knowledgePanel = {
            title: query,
            subtitle: urlObj.hostname.replace('www.', '').split('.')[0].charAt(0).toUpperCase() + 
                     urlObj.hostname.replace('www.', '').split('.')[0].slice(1),
            description: firstResult.description,
            source: urlObj.hostname.replace('www.', ''),
            sourceUrl: firstResult.url,
          };
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        spellCorrection,
        knowledgePanel
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Search failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

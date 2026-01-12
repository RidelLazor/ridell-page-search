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

// Check if URL is from DuckDuckGo
function isDuckDuckGoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('duckduckgo.com');
  } catch {
    return false;
  }
}

// Detect if query is a company name using AI
async function detectCompanyWithAI(query: string): Promise<{
  isCompany: boolean;
  companyInfo?: {
    name: string;
    type: string;
    description: string;
    founded?: string;
    headquarters?: string;
    industry?: string;
    ceo?: string;
    website?: string;
  };
}> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    return { isCompany: false };
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are a company name detector. Analyze if the query is a well-known company, organization, or brand name. Only return true for actual companies/organizations like Google, Apple, Microsoft, Roblox, Amazon, Meta, Tesla, Nike, etc. Do NOT return true for generic searches, products, people names (unless they're founders being searched in company context), or general topics.

Return a JSON object with:
- "isCompany": boolean (true only for recognized companies/brands)
- "companyInfo": object with company details if isCompany is true:
  - "name": official company name
  - "type": type (e.g., "Technology company", "Video game platform", "Retail company")
  - "description": brief 1-2 sentence description
  - "founded": year founded (if known)
  - "headquarters": city/country (if known)
  - "industry": primary industry
  - "ceo": current CEO name (if known)
  - "website": official website URL

Return ONLY valid JSON, no other text.`
          },
          {
            role: 'user',
            content: `Is this a company/organization? Query: "${query}"`
          }
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('Company detection failed:', response.status);
      return { isCompany: false };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse the AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isCompany: parsed.isCompany === true,
        companyInfo: parsed.isCompany ? parsed.companyInfo : undefined
      };
    }
    
    return { isCompany: false };
  } catch (error) {
    console.error('Company detection error:', error);
    return { isCompany: false };
  }
}

// Generate AI-enhanced descriptions for results
async function enhanceDescriptionsWithAI(
  results: Array<{ title: string; url: string; description: string }>,
  query: string
): Promise<Array<{ title: string; url: string; description: string }>> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY || results.length === 0) {
    return results;
  }

  try {
    // Create a prompt for AI to enhance descriptions
    const resultsContext = results.slice(0, 5).map((r, i) => 
      `${i + 1}. Title: "${r.title}" | URL: ${r.url} | Original: "${r.description || 'No description'}"`
    ).join('\n');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are a search result description enhancer. Given search results for a query, provide clear, concise, and informative descriptions for each result. Each description should be 1-2 sentences explaining what the user will find at that URL. Be factual and helpful. Return ONLY a JSON array of strings (descriptions), one for each result, in the same order.`
          },
          {
            role: 'user',
            content: `Query: "${query}"\n\nResults:\n${resultsContext}\n\nProvide enhanced descriptions as a JSON array of strings.`
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('AI enhancement failed:', response.status);
      return results;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse the AI response - extract JSON array
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const descriptions: string[] = JSON.parse(jsonMatch[0]);
      return results.map((r, i) => ({
        ...r,
        description: descriptions[i] || r.description
      }));
    }
    
    return results;
  } catch (error) {
    console.error('AI enhancement error:', error);
    return results;
  }
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
      console.error('Search request failed:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Search request failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    
    // Parse the HTML to extract search results
    let results: Array<{ 
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
    
    for (let i = 0; i < Math.min(linkMatches.length, 15); i++) {
      const linkMatch = linkMatches[i];
      const snippetMatch = snippetMatches[i];
      
      if (linkMatch) {
        // Clean up the URL - extract actual URL from redirect
        let url = linkMatch[1];
        const uddgMatch = url.match(/uddg=([^&]*)/);
        if (uddgMatch) {
          url = decodeURIComponent(uddgMatch[1]);
        }
        
        // Skip DuckDuckGo URLs
        if (isDuckDuckGoUrl(url)) {
          continue;
        }
        
        // Clean up title (remove HTML tags and decode entities)
        const title = decodeHtmlEntities(linkMatch[2].replace(/<[^>]*>/g, '').trim());
        
        // Clean up description (remove HTML tags and decode entities)
        const description = snippetMatch 
          ? decodeHtmlEntities(snippetMatch[1].replace(/<[^>]*>/g, '').trim())
          : '';
        
        if (url && title && url.startsWith('http')) {
          results.push({ title, url, description });
        }
      }
    }

    // Limit to 10 results after filtering
    results = results.slice(0, 10);

    console.log(`Found ${results.length} results after filtering`);

    // Run AI tasks in parallel: description enhancement and company detection
    const [enhancedResults, companyDetection] = await Promise.all([
      enhanceDescriptionsWithAI(
        results.map(r => ({ title: r.title, url: r.url, description: r.description })),
        query
      ),
      detectCompanyWithAI(query)
    ]);

    console.log('Company detection result:', JSON.stringify(companyDetection));

    // Add sitelinks to first result
    const finalResults = enhancedResults.map((r, i) => {
      if (i === 0) {
        try {
          const urlObj = new URL(r.url);
          const sitelinks = [
            { title: 'About', url: `${urlObj.origin}/about`, description: 'Learn more about us' },
            { title: 'Contact', url: `${urlObj.origin}/contact`, description: 'Get in touch with us' },
            { title: 'Help', url: `${urlObj.origin}/help`, description: 'Find help and support' },
            { title: 'Login', url: `${urlObj.origin}/login`, description: 'Sign in to your account' },
          ];
          return { ...r, sitelinks };
        } catch {
          return r;
        }
      }
      return r;
    });

    // Only create knowledge panel if AI detected a company
    let knowledgePanel = null;
    if (companyDetection.isCompany && companyDetection.companyInfo) {
      const info = companyDetection.companyInfo;
      
      // Generate logo URL using Clearbit Logo API (free, no API key needed)
      let logoUrl: string | undefined;
      if (info.website) {
        try {
          const domain = new URL(info.website).hostname.replace('www.', '');
          logoUrl = `https://logo.clearbit.com/${domain}`;
        } catch {
          console.log('Could not parse website for logo:', info.website);
        }
      }
      
      // Fallback: try to get logo from company name
      if (!logoUrl) {
        const sanitizedName = info.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        logoUrl = `https://logo.clearbit.com/${sanitizedName}.com`;
      }
      
      knowledgePanel = {
        title: info.name,
        subtitle: info.type || 'Company',
        description: info.description,
        image: logoUrl,
        source: info.website ? new URL(info.website).hostname.replace('www.', '') : 'Company Information',
        sourceUrl: info.website || (finalResults[0]?.url || '#'),
        // Additional company-specific info
        founded: info.founded,
        headquarters: info.headquarters,
        industry: info.industry,
        ceo: info.ceo,
      };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: finalResults,
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

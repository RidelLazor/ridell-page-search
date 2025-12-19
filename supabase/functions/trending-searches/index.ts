import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_SEARCHES = [
  "AI news today",
  "World Cup 2026",
  "Climate change solutions",
  "SpaceX launch",
  "New iPhone release",
  "Stock market today",
  "Taylor Swift tour",
  "Olympics 2024",
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.log('No LOVABLE_API_KEY, returning defaults');
      return new Response(JSON.stringify({ searches: DEFAULT_SEARCHES, isAI: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates trending search topics. Return ONLY a JSON array of 8 short trending search queries. No explanation, just the JSON array.'
          },
          {
            role: 'user',
            content: `Generate 8 trending search topics for today (${today}). Include a mix of: current events, technology, entertainment, sports, and science. Keep each topic short (2-5 words). Return as a JSON array like ["topic 1", "topic 2", ...]`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log('Rate limited, returning defaults');
        return new Response(JSON.stringify({ searches: DEFAULT_SEARCHES, isAI: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        console.log('Payment required, returning defaults');
        return new Response(JSON.stringify({ searches: DEFAULT_SEARCHES, isAI: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const searches = JSON.parse(jsonMatch[0]);
      if (Array.isArray(searches) && searches.length > 0) {
        console.log('Generated trending searches:', searches);
        return new Response(JSON.stringify({ searches: searches.slice(0, 8), isAI: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('Could not parse AI response, returning defaults');
    return new Response(JSON.stringify({ searches: DEFAULT_SEARCHES, isAI: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating trending searches:', error);
    return new Response(JSON.stringify({ searches: DEFAULT_SEARCHES, isAI: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

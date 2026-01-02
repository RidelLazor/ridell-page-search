const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, context } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: true, suggestions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a search autocomplete assistant. Given a partial search query, suggest 5 relevant and helpful completions. 
Focus on:
- Common search patterns
- Trending topics when relevant
- Practical and useful suggestions
- Diverse suggestions covering different aspects

Return ONLY a JSON array of strings with the suggestions. No explanations, just the array.
Example output: ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]`;

    const userPrompt = `Partial query: "${query}"${context ? `\nSearch context: ${context}` : ""}

Suggest 5 completions for this search query. Return only a JSON array of suggestion strings.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limited, falling back to basic suggestions");
        return new Response(
          JSON.stringify({ success: true, suggestions: [], fallback: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON array from the response
    let suggestions: string[] = [];
    try {
      // Try to find JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI suggestions:", parseError);
      suggestions = [];
    }

    // Ensure we have valid strings and limit to 5
    suggestions = suggestions
      .filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
      .slice(0, 5);

    return new Response(
      JSON.stringify({ success: true, suggestions, aiPowered: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Autocomplete error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get AI suggestions";
    return new Response(
      JSON.stringify({ success: false, suggestions: [], error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

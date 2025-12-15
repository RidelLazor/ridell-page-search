const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: true, suggestions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch suggestions");
    }

    const data = await response.json();
    // DuckDuckGo returns [query, [suggestions]]
    const suggestions = Array.isArray(data) && data.length > 1 ? data[1].slice(0, 8) : [];

    return new Response(
      JSON.stringify({ success: true, suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Autocomplete error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch suggestions";
    return new Response(
      JSON.stringify({ success: false, suggestions: [], error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

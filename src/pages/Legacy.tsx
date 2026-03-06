import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

const Legacy = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const performSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("search", {
        body: { query: q, safeSearch: true },
      });
      if (fnError) throw new Error(fnError.message);
      if (data.success && data.results) {
        setResults(data.results);
      } else {
        setError(data.error || "Search failed");
        setResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to perform search.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleLucky = () => {
    if (!query.trim()) return;
    performSearch(query);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh", backgroundColor: "#fff", color: "#222" }}>
      {/* Header / Nav */}
      {hasSearched ? (
        <>
          {/* Results header */}
          <div style={{ borderBottom: "1px solid #ebebeb", padding: "16px 24px", display: "flex", alignItems: "center", gap: "24px" }}>
            <span
              onClick={() => { setHasSearched(false); setResults([]); setQuery(""); }}
              style={{ fontSize: "28px", fontWeight: "bold", cursor: "pointer", color: "#4285f4", userSelect: "none" }}
            >
              Ridel
            </span>
            <form onSubmit={handleSubmit} style={{ flex: 1, maxWidth: "692px" }}>
              <div style={{
                display: "flex", alignItems: "center", border: "1px solid #dfe1e5",
                borderRadius: "24px", padding: "6px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}>
                <Search size={18} color="#9aa0a6" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    flex: 1, border: "none", outline: "none", fontSize: "16px",
                    padding: "8px 12px", background: "transparent", color: "#222",
                  }}
                />
              </div>
            </form>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "8px 16px", fontSize: "13px", color: "#5f6368",
                background: "none", border: "1px solid #dadce0", borderRadius: "4px", cursor: "pointer",
              }}
            >
              Switch to Ridel
            </button>
          </div>

          {/* Results */}
          <div style={{ maxWidth: "692px", margin: "0 auto", padding: "16px 24px" }}>
            {loading && <p style={{ color: "#70757a" }}>Searching...</p>}
            {error && <p style={{ color: "#d93025" }}>{error}</p>}
            {!loading && !error && results.length === 0 && (
              <p style={{ color: "#70757a" }}>No results found.</p>
            )}
            {results.map((r, i) => (
              <div key={i} style={{ marginBottom: "28px" }}>
                <a
                  href={r.url}
                  style={{ fontSize: "14px", color: "#202124", textDecoration: "none", lineHeight: 1.3, display: "block" }}
                >
                  {(() => { try { return new URL(r.url).hostname; } catch { return r.url; } })()}
                </a>
                <a
                  href={r.url}
                  style={{ fontSize: "20px", color: "#1a0dab", textDecoration: "none", lineHeight: 1.3 }}
                  onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  {r.title}
                </a>
                <p style={{ fontSize: "14px", color: "#4d5156", margin: "4px 0 0", lineHeight: 1.58 }}>
                  {r.description}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Home view - Google-like centered layout */
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "100vh", padding: "0 16px",
        }}>
          {/* Top right nav */}
          <div style={{ position: "absolute", top: "16px", right: "24px", display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "8px 16px", fontSize: "14px", color: "#fff",
                backgroundColor: "#4285f4", border: "none", borderRadius: "4px", cursor: "pointer",
              }}
            >
              Switch to Ridel
            </button>
          </div>

          {/* Logo */}
          <div style={{ marginBottom: "28px" }}>
            <span style={{ fontSize: "92px", fontWeight: "400", userSelect: "none", letterSpacing: "-2px" }}>
              <span style={{ color: "#4285f4" }}>R</span>
              <span style={{ color: "#ea4335" }}>i</span>
              <span style={{ color: "#fbbc05" }}>d</span>
              <span style={{ color: "#4285f4" }}>e</span>
              <span style={{ color: "#34a853" }}>l</span>
            </span>
          </div>

          {/* Search box */}
          <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "584px" }}>
            <div style={{
              display: "flex", alignItems: "center", border: "1px solid #dfe1e5",
              borderRadius: "24px", padding: "6px 16px", boxShadow: "0 1px 6px rgba(32,33,36,0.08)",
            }}>
              <Search size={20} color="#9aa0a6" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                style={{
                  flex: 1, border: "none", outline: "none", fontSize: "16px",
                  padding: "10px 12px", background: "transparent", color: "#222",
                }}
                placeholder=""
              />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "28px" }}>
              <button
                type="submit"
                style={{
                  padding: "8px 16px", fontSize: "14px", color: "#3c4043",
                  backgroundColor: "#f8f9fa", border: "1px solid #f8f9fa",
                  borderRadius: "4px", cursor: "pointer",
                }}
                onMouseOver={(e) => { e.currentTarget.style.border = "1px solid #dadce0"; e.currentTarget.style.boxShadow = "0 1px 1px rgba(0,0,0,0.1)"; }}
                onMouseOut={(e) => { e.currentTarget.style.border = "1px solid #f8f9fa"; e.currentTarget.style.boxShadow = "none"; }}
              >
                Ridel Search
              </button>
              <button
                type="button"
                onClick={handleLucky}
                style={{
                  padding: "8px 16px", fontSize: "14px", color: "#3c4043",
                  backgroundColor: "#f8f9fa", border: "1px solid #f8f9fa",
                  borderRadius: "4px", cursor: "pointer",
                }}
                onMouseOver={(e) => { e.currentTarget.style.border = "1px solid #dadce0"; e.currentTarget.style.boxShadow = "0 1px 1px rgba(0,0,0,0.1)"; }}
                onMouseOut={(e) => { e.currentTarget.style.border = "1px solid #f8f9fa"; e.currentTarget.style.boxShadow = "none"; }}
              >
                I'm Feeling Lucky
              </button>
            </div>
          </form>

          {/* Footer */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            backgroundColor: "#f2f2f2", borderTop: "1px solid #dadce0",
            padding: "16px 24px", fontSize: "13px", color: "#70757a",
            display: "flex", justifyContent: "center",
          }}>
            Legacy mode — no AI, no animations
          </div>
        </div>
      )}
    </div>
  );
};

export default Legacy;

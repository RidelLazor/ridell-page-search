import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import RidelLogo from "@/components/RidelLogo";

interface WaitlistProps {
  onAccessGranted: () => void;
}

const Waitlist = ({ onAccessGranted }: WaitlistProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: dbError } = await supabase
        .from("waitlist_emails")
        .insert({ email: trimmed });

      if (dbError) throw dbError;

      setSuccess(true);

      // Grant access after a brief celebration
      setTimeout(() => {
        localStorage.setItem("ridel-waitlist-access", "true");
        onAccessGranted();
      }, 1500);
    } catch (err: any) {
      console.error("Waitlist error:", err);
      // If duplicate, still grant access
      if (err?.message?.includes("duplicate") || err?.code === "23505") {
        setSuccess(true);
        setTimeout(() => {
          localStorage.setItem("ridel-waitlist-access", "true");
          onAccessGranted();
        }, 1500);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, hsl(var(--primary) / 0.08) 0%, transparent 60%)",
        }}
      />

      <motion.div
        className="w-full max-w-md flex flex-col items-center gap-8 z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <RidelLogo size="large" />
        </motion.div>

        {/* Heading */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Get Early Access
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-sm mx-auto">
            Enter your email to unlock full access to the search engine — instantly.
          </p>
        </motion.div>

        {/* Form */}
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="w-full space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="you@email.com"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && (
                <motion.p
                  className="text-sm text-destructive text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50 transition-colors hover:bg-primary/90"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <motion.div
                    className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  />
                ) : (
                  <>
                    Get Instant Access
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              className="flex flex-col items-center gap-4 py-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <Check className="h-8 w-8 text-primary" />
              </motion.div>
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold text-foreground">You're in!</p>
                <p className="text-muted-foreground text-sm flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Redirecting to full access...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer note */}
        <motion.p
          className="text-xs text-muted-foreground/60 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          No spam. We just need your email to grant access.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Waitlist;

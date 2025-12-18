import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import RidelLogo from "@/components/RidelLogo";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient - light mode */}
      <div 
        className="absolute inset-0 -z-10 dark:hidden"
        style={{
          background: "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(217 91% 97%) 50%, hsl(var(--background)) 100%)",
        }}
      />
      
      {/* Background gradient - dark mode (inverted) */}
      <div 
        className="absolute inset-0 -z-10 hidden dark:block"
        style={{
          background: "linear-gradient(315deg, hsl(var(--background)) 0%, hsl(217 30% 12%) 50%, hsl(var(--background)) 100%)",
        }}
      />
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234285F4' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative blobs - adjusted for dark mode */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 -right-32 w-96 h-96 bg-green-500/10 dark:bg-green-500/15 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 dark:bg-yellow-500/10 rounded-full blur-3xl -z-10" />

      {/* Back button */}
      <div className="p-4 relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to search</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-6">
              <RidelLogo />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to access your saved searches and bookmarks</p>
          </div>

          {/* Login card */}
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl space-y-6">
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 font-medium rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card/80 px-3 text-muted-foreground">Secure sign in</span>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Make sure we can see the root-cause in console logs
    console.error("[AppErrorBoundary] Uncaught render error:", error);
    console.error("[AppErrorBoundary] Component stack:", info.componentStack);
  }

  private handleReload = () => {
    try {
      window.location.reload();
    } catch {
      // ignore
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center p-6">
        <section className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The app hit an unexpected error and couldn’t render. Reloading usually fixes it.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <Button onClick={this.handleReload}>Reload</Button>
            <Button
              variant="secondary"
              onClick={() => {
                // Reset boundary state without reloading
                this.setState({ hasError: false, error: undefined });
              }}
            >
              Try again
            </Button>
          </div>

          {this.state.error?.message && (
            <pre className="mt-5 max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
        </section>
      </main>
    );
  }
}

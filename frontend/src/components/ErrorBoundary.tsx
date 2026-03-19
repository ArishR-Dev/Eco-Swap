import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches React render errors in the tree and shows a fallback UI
 * instead of a blank screen. Wrap the main app or route tree.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            {import.meta.env.DEV
              ? this.state.error.message
              : "An unexpected error occurred. Please try again."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "1rem",
              cursor: "pointer",
              backgroundColor: "#0d9488",
              color: "white",
              border: "none",
              borderRadius: "6px",
            }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

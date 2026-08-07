import { Component, type ReactNode } from "react";
import "./ErrorBoundary.css";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  failed: boolean;
};

/**
 * Last line of defense for heavy screens (3D, lazy chunks): a render or
 * chunk-load failure shows a small recovery card instead of unmounting the
 * entire app into a blank frame.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="error-boundary" role="alert">
          <p className="error-boundary__title">This screen hit a snag.</p>
          <p className="error-boundary__text">
            Reloading usually clears it right up.
          </p>
          <button
            type="button"
            className="error-boundary__reload"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

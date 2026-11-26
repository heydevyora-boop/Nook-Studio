import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/** Catches render-time errors anywhere in the tree so one broken section never blanks the whole site. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-cream px-6 text-center">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-muted mb-4">Something went wrong</p>
            <h1 className="font-serif-editorial text-3xl text-brand-dark mb-6">
              We hit an unexpected error.
            </h1>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-3 border border-brand-dark/40 hover:border-brand-dark px-7 py-3.5 text-xs uppercase tracking-widest font-medium transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

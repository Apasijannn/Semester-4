import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Karsa crashed:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/dashboard'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-grid-margin">
        <div className="max-w-md bento-card paper-grain bg-surface-container-lowest p-bento-padding text-center">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4">bug_report</span>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-2">SYSTEM_ERROR</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            Something broke. Your data is still safe in localStorage — try going back to the dashboard.
          </p>
          {this.state.error?.message && (
            <p className="font-body-sm text-body-sm text-outline mb-6 break-all">{this.state.error.message}</p>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="btn-retro bg-primary text-on-primary font-label-caps text-label-caps py-2 px-4"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }
}

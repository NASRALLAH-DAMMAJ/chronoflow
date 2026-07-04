import React from 'react'
import { isNetworkError } from '../lib/retry'

const MAX_RETRIES = 3

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary] ${this.props.name || 'component'}:`, error, errorInfo)
  }

  handleRetry = () => {
    if (this.state.retryCount >= MAX_RETRIES) return
    this.setState({ isRetrying: true })
    setTimeout(() => {
      this.setState(prev => ({
        hasError: false,
        error: null,
        retryCount: prev.retryCount + 1,
        isRetrying: false,
      }))
    }, 300)
  }

  handleDismiss = () => {
    this.setState({ hasError: false, error: null, retryCount: 0 })
  }

  render() {
    if (this.state.hasError) {
      const { error, retryCount, isRetrying } = this.state
      const isNetwork = isNetworkError(error)
      const canRetry = retryCount < MAX_RETRIES
      const name = this.props.name || 'This section'

      return (
        <div
          className="animate-fade-in-scale"
          style={{
            margin: 16,
            padding: 20,
            borderRadius: 8,
            border: '1px solid rgba(255,75,75,0.3)',
            backgroundColor: 'rgba(255,75,75,0.05)',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--clr-danger, #ef4444)', marginBottom: 4 }}>
            {isNetwork ? 'Connection Problem' : 'Something went wrong'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--clr-text-secondary)', marginBottom: 12 }}>
            {isNetwork
              ? `${name} couldn't load. Check your internet connection.`
              : `${name} failed to load. Your data is safe.`
            }
          </div>
          <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)', marginBottom: 12, fontFamily: 'monospace' }}>
            {error?.message || 'Unknown error'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {canRetry && (
              <button
                className="transition-all"
                onClick={this.handleRetry}
                disabled={isRetrying}
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  border: '1px solid rgba(255,75,75,0.3)',
                  borderRadius: 6,
                  backgroundColor: 'rgba(255,75,75,0.1)',
                  color: 'var(--clr-danger, #ef4444)',
                  cursor: 'pointer',
                  opacity: isRetrying ? 0.6 : 1,
                }}
              >
                {isRetrying ? 'Retrying...' : `Retry${retryCount > 0 ? ` (${retryCount}/${MAX_RETRIES})` : ''}`}
              </button>
            )}
            <button
              className="transition-all"
              onClick={this.handleDismiss}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 500,
                border: '1px solid var(--clr-border)',
                borderRadius: 6,
                backgroundColor: 'transparent',
                color: 'var(--clr-text-secondary)',
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
          {retryCount >= MAX_RETRIES && (
            <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)', marginTop: 8 }}>
              Multiple retries failed. Try refreshing the page.
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

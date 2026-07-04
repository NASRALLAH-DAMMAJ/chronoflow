import React from 'react'
import { Button, Card, Text } from '@mantine/core'
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
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          style={{
            margin: 16,
            border: '1px solid rgba(255,75,75,0.3)',
            backgroundColor: 'rgba(255,75,75,0.05)',
          }}
        >
          <Text fw={600} size="lg" color="red" mb={4}>
            {isNetwork ? 'Connection Problem' : 'Something went wrong'}
          </Text>
          <Text size="sm" color="dimmed" mb={12}>
            {isNetwork
              ? `${name} couldn't load. Check your internet connection.`
              : `${name} failed to load. Your data is safe.`
            }
          </Text>
          <Text size="xs" color="dimmed" mb={12} style={{ fontFamily: 'monospace', fontSize: 11 }}>
            {error?.message || 'Unknown error'}
          </Text>
          <div style={{ display: 'flex', gap: 8 }}>
            {canRetry && (
              <Button
                size="xs"
                variant="light"
                color="red"
                loading={isRetrying}
                onClick={this.handleRetry}
              >
                {isRetrying ? 'Retrying...' : `Retry${retryCount > 0 ? ` (${retryCount}/${MAX_RETRIES})` : ''}`}
              </Button>
            )}
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={this.handleDismiss}
            >
              Dismiss
            </Button>
          </div>
          {retryCount >= MAX_RETRIES && (
            <Text size="xs" color="dimmed" mt={8}>
              Multiple retries failed. Try refreshing the page.
            </Text>
          )}
        </Card>
      )
    }

    return this.props.children
  }
}

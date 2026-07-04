import React from 'react'
import { Button, Card, Text } from '@mantine/core'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary] ${this.props.name || 'component'}:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
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
            Something went wrong
          </Text>
          <Text size="sm" color="dimmed" mb={12}>
            {this.props.name || 'This section'} failed to load. Your data is safe.
          </Text>
          <Text size="xs" color="dimmed" mb={12} style={{ fontFamily: 'monospace', fontSize: 11 }}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <Button
            size="xs"
            variant="light"
            color="red"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </Button>
        </Card>
      )
    }

    return this.props.children
  }
}

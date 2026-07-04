import React from 'react'
import { Button, Card } from '../design-system/components'

export function Onboarding({ onDismiss }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--clr-overlay)',
    }}>
      <Card padding="var(--sp-6)" style={{ maxWidth: 400, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--fs-subtitle)', fontWeight: 700, marginBottom: 12, color: 'var(--clr-text)' }}>
          Welcome to ChronoFlow
        </h2>
        <p style={{ fontSize: 14, color: 'var(--clr-text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
          See where your time actually goes.
        </p>
        <ul style={{ fontSize: 13, color: 'var(--clr-text-secondary)', lineHeight: 2, listStyle: 'none', padding: 0, margin: '16px 0' }}>
          <li>1. Tap <strong>Add</strong> to plan a block of time</li>
          <li>2. Drag on the dial to set start and end</li>
          <li>3. Drag blocks to move, drag edges to resize</li>
          <li>4. Complete your day at night</li>
        </ul>
        <Button variant="primary" onClick={onDismiss}>Get started</Button>
      </Card>
    </div>
  )
}

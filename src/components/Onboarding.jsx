import React, { useState } from 'react'
import { Button, Card } from '../design-system/components'

const STEPS = [
  {
    title: 'Welcome to ChronoFlow',
    description: 'See where your time actually goes — not where you plan to spend it.',
    icon: '🕐',
    tips: [],
  },
  {
    title: 'The 24-Hour Dial',
    description: 'The circle represents your whole day. Each colored block is something you did.',
    icon: '⭕',
    tips: [
      'Drag on the dial to place a new block',
      'Drag blocks to move them around',
      'Drag edges to resize',
    ],
  },
  {
    title: 'Track Your Day',
    description: 'Add blocks as you go through your day, or plan ahead.',
    icon: '📝',
    tips: [
      'Tap Add to create a time block',
      'Choose a label and category',
      'Click Complete Day before bed to build your streak',
    ],
  },
  {
    title: 'You\'re Ready',
    description: 'Start tracking. The more you use it, the more you learn about your time.',
    icon: '🚀',
    tips: [],
  },
]

export function Onboarding({ onDismiss }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--clr-overlay)',
      padding: 'var(--sp-4)',
    }}>
      <Card padding="var(--sp-6)" style={{ maxWidth: 420, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{current.icon}</div>
        <h2 style={{ fontSize: 'var(--fs-subtitle)', fontWeight: 700, marginBottom: 8, color: 'var(--clr-text)' }}>
          {current.title}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--clr-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
          {current.description}
        </p>

        {current.tips.length > 0 && (
          <ul style={{ fontSize: 13, color: 'var(--clr-text-secondary)', lineHeight: 2, listStyle: 'none', padding: 0, margin: '0 0 20px', textAlign: 'left' }}>
            {current.tips.map((tip, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>{i + 1}.</span>
                {tip}
              </li>
            ))}
          </ul>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: current.tips.length > 0 ? 0 : 20 }}>
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}>
              Back
            </Button>
          )}
          {isLast ? (
            <Button variant="primary" onClick={onDismiss}>
              Get started
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setStep(s => s + 1)}>
              Next
            </Button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === step ? 'var(--clr-primary)' : 'var(--clr-border)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}

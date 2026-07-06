import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BlockList } from '../components/BlockList'

describe('BlockList', () => {
  const makeBlock = (id, start, end, overrides = {}) => ({
    id,
    start,
    end,
    label: 'Test',
    category: 'work',
    is_recurring: false,
    locked: false,
    ...overrides,
  })

  it('renders empty state when no blocks', () => {
    render(<BlockList blocks={[]} />)
    expect(screen.getByText('No blocks yet')).toBeTruthy()
  })

  it('renders block with long label (50+ chars)', () => {
    const longLabel = 'A'.repeat(55)
    const blocks = [makeBlock('b1', 60, 120, { label: longLabel })]
    render(<BlockList blocks={blocks} />)
    expect(screen.getByText(longLabel)).toBeTruthy()
  })

  it('renders block with short label (1 char)', () => {
    const blocks = [makeBlock('b1', 60, 120, { label: 'X' })]
    render(<BlockList blocks={blocks} />)
    expect(screen.getByText('X')).toBeTruthy()
  })

  it('renders many blocks (8+)', () => {
    const blocks = Array.from({ length: 10 }, (_, i) =>
      makeBlock(`b${i}`, i * 60, (i + 1) * 60, { label: `Block ${i + 1}` })
    )
    render(<BlockList blocks={blocks} />)
    for (let i = 0; i < 10; i++) {
      expect(screen.getByText(`Block ${i + 1}`)).toBeTruthy()
    }
  })

  it('renders blocks sorted by start time', () => {
    const blocks = [
      makeBlock('b1', 120, 180, { label: 'Second' }),
      makeBlock('b2', 0, 60, { label: 'First' }),
    ]
    render(<BlockList blocks={blocks} />)
    const rendered = screen.getAllByText(/^(First|Second)$/)
    expect(rendered[0].textContent).toBe('First')
    expect(rendered[1].textContent).toBe('Second')
  })
})

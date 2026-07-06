import { describe, it, expect, beforeEach } from 'vitest'
import { detectConflict, resolveConflict, getConflictLog, clearConflictLog, logConflict, pickFields, getTimestampSkew, updateTimestampSkew } from '../lib/conflictDetector'

const baseLocal = { id: 'b1', start: 60, end: 120, label: 'Work', category: 'work', updated_at: '2026-07-05T10:00:00Z' }
const baseRemote = { id: 'b1', start: 60, end: 120, label: 'Work', category: 'work', updated_at: '2026-07-05T11:00:00Z' }

beforeEach(() => {
  clearConflictLog()
})

describe('detectConflict', () => {
  it('returns null when both blocks have same timestamp', () => {
    const result = detectConflict(baseLocal, { ...baseRemote, updated_at: baseLocal.updated_at })
    expect(result).toBeNull()
  })

  it('returns local-update/remote-update when remote is newer', () => {
    const result = detectConflict(baseLocal, baseRemote)
    expect(result).toEqual({
      type: 'local-update/remote-update',
      localBlock: baseLocal,
      remoteBlock: baseRemote,
    })
  })

  it('returns local-delete/remote-update when local is null', () => {
    const result = detectConflict(null, baseRemote)
    expect(result).toEqual({
      type: 'local-delete/remote-update',
      localBlock: null,
      remoteBlock: baseRemote,
    })
  })

  it('returns local-update/remote-delete when remote is null', () => {
    const result = detectConflict(baseLocal, null)
    expect(result).toEqual({
      type: 'local-update/remote-delete',
      localBlock: baseLocal,
      remoteBlock: null,
    })
  })

  it('returns null when both are null', () => {
    expect(detectConflict(null, null)).toBeNull()
  })

  it('returns null when local is newer than remote', () => {
    const localNewer = { ...baseLocal, updated_at: '2026-07-05T12:00:00Z' }
    expect(detectConflict(localNewer, baseRemote)).toBeNull()
  })
})

describe('resolveConflict', () => {
  const conflict = { type: 'local-update/remote-update', localBlock: baseLocal, remoteBlock: baseRemote }

  it('returns local block with local-wins strategy', () => {
    const result = resolveConflict(conflict, 'local-wins')
    expect(result).toEqual(baseLocal)
  })

  it('returns remote block with remote-wins strategy', () => {
    const result = resolveConflict(conflict, 'remote-wins')
    expect(result).toEqual(baseRemote)
  })

  it('returns null for manual-merge strategy', () => {
    expect(resolveConflict(conflict, 'manual-merge')).toBeNull()
  })

  it('returns remote block for local-delete/remote-update with remote-wins', () => {
    const deleteConflict = { type: 'local-delete/remote-update', localBlock: null, remoteBlock: baseRemote }
    expect(resolveConflict(deleteConflict, 'remote-wins')).toEqual(baseRemote)
  })

  it('returns null for local-delete/remote-update with local-wins', () => {
    const deleteConflict = { type: 'local-delete/remote-update', localBlock: null, remoteBlock: baseRemote }
    expect(resolveConflict(deleteConflict, 'local-wins')).toBeNull()
  })

  it('returns local block for local-update/remote-delete with local-wins', () => {
    const deleteConflict = { type: 'local-update/remote-delete', localBlock: baseLocal, remoteBlock: null }
    expect(resolveConflict(deleteConflict, 'local-wins')).toEqual(baseLocal)
  })

  it('returns null for local-update/remote-delete with remote-wins', () => {
    const deleteConflict = { type: 'local-update/remote-delete', localBlock: baseLocal, remoteBlock: null }
    expect(resolveConflict(deleteConflict, 'remote-wins')).toBeNull()
  })

  it('returns null for null conflict', () => {
    expect(resolveConflict(null, 'local-wins')).toBeNull()
  })
})

describe('manual merge field picker', () => {
  const localBlock = { id: 'b1', start: 60, end: 120, label: 'Work', category: 'work' }
  const remoteBlock = { id: 'b1', start: 480, end: 540, label: 'Meeting', category: 'leisure' }

  it('picks all fields from local when useLocal is true', () => {
    const selections = [
      { name: 'label', useLocal: true },
      { name: 'start', useLocal: true },
      { name: 'end', useLocal: true },
      { name: 'category', useLocal: true },
    ]
    const result = pickFields(localBlock, remoteBlock, selections)
    expect(result.label).toBe('Work')
    expect(result.start).toBe(60)
    expect(result.end).toBe(120)
    expect(result.category).toBe('work')
  })

  it('picks all fields from remote when useLocal is false', () => {
    const selections = [
      { name: 'label', useLocal: false },
      { name: 'start', useLocal: false },
      { name: 'end', useLocal: false },
      { name: 'category', useLocal: false },
    ]
    const result = pickFields(localBlock, remoteBlock, selections)
    expect(result.label).toBe('Meeting')
    expect(result.start).toBe(480)
    expect(result.end).toBe(540)
    expect(result.category).toBe('leisure')
  })

  it('mixes fields from both sides', () => {
    const selections = [
      { name: 'label', useLocal: true },
      { name: 'start', useLocal: false },
      { name: 'end', useLocal: false },
      { name: 'category', useLocal: true },
    ]
    const result = pickFields(localBlock, remoteBlock, selections)
    expect(result.label).toBe('Work')
    expect(result.start).toBe(480)
    expect(result.end).toBe(540)
    expect(result.category).toBe('work')
  })
})

describe('timestamp comparison', () => {
  it('detects conflict when remote timestamp is newer', () => {
    const local = { ...baseLocal, updated_at: '2026-07-05T10:00:00Z' }
    const remote = { ...baseRemote, updated_at: '2026-07-05T11:00:00Z' }
    const result = detectConflict(local, remote)
    expect(result).not.toBeNull()
    expect(result.type).toBe('local-update/remote-update')
  })

  it('detects no conflict when remote timestamp is older', () => {
    const local = { ...baseLocal, updated_at: '2026-07-05T12:00:00Z' }
    const remote = { ...baseRemote, updated_at: '2026-07-05T11:00:00Z' }
    const result = detectConflict(local, remote)
    expect(result).toBeNull()
  })
})

describe('getConflictLog', () => {
  it('returns logged conflicts', () => {
    const conflict = { type: 'local-update/remote-update', localBlock: baseLocal, remoteBlock: baseRemote }
    logConflict(conflict)
    const log = getConflictLog()
    expect(log.length).toBe(1)
    expect(log[0].type).toBe('local-update/remote-update')
  })

  it('clears the log', () => {
    logConflict({ type: 'local-update/remote-update', localBlock: baseLocal, remoteBlock: baseRemote })
    clearConflictLog()
    expect(getConflictLog()).toEqual([])
  })
})

describe('timestamp skew', () => {
  it('updates timestamp skew', () => {
    updateTimestampSkew('2026-07-05T12:00:00Z')
    const skew = getTimestampSkew()
    expect(typeof skew).toBe('number')
  })
})

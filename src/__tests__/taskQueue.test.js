import { describe, it, expect, vi } from 'vitest'
import { TaskQueue } from '../lib/taskQueue'

describe('TaskQueue', () => {
  it('adds and runs a task', async () => {
    const queue = new TaskQueue()
    let resolved = false
    queue.add(async () => { resolved = true }, { id: 'test-1' })
    await new Promise(r => setTimeout(r, 50))
    expect(resolved).toBe(true)
  })

  it('tracks task status', async () => {
    const queue = new TaskQueue()
    queue.add(async () => {
      await new Promise(r => setTimeout(r, 100))
    }, { id: 'test-2', label: 'Loading' })
    const tasks = queue.getTasks()
    expect(tasks.length).toBe(1)
    expect(tasks[0].status).toBe('running')
    expect(tasks[0].label).toBe('Loading')
  })

  it('removes completed task after delay', async () => {
    const queue = new TaskQueue()
    queue.add(async () => {}, { id: 'test-3' })
    await new Promise(r => setTimeout(r, 2500))
    expect(queue.getTasks().length).toBe(0)
  })

  it('cancels a running task', async () => {
    const queue = new TaskQueue()
    let aborted = false
    queue.add(async ({ signal }) => {
      await new Promise((_, reject) => {
        signal.addEventListener('abort', () => { aborted = true; reject(new DOMException('Aborted', 'AbortError')) })
      })
    }, { id: 'test-cancel' })
    await new Promise(r => setTimeout(r, 50))
    queue.cancel('test-cancel')
    await new Promise(r => setTimeout(r, 100))
    expect(aborted).toBe(true)
  })

  it('reports active count', async () => {
    const queue = new TaskQueue()
    queue.add(async () => { await new Promise(r => setTimeout(r, 200)) }, { id: 'a1' })
    queue.add(async () => { await new Promise(r => setTimeout(r, 200)) }, { id: 'a2' })
    expect(queue.getActiveCount()).toBe(2)
    await new Promise(r => setTimeout(r, 250))
    expect(queue.getActiveCount()).toBe(0)
  })

  it('calls onProgress callback', async () => {
    const queue = new TaskQueue()
    const progressCalls = []
    queue.add(async ({ onProgress }) => {
      onProgress(25)
      onProgress(50)
      onProgress(100)
    }, { id: 'test-progress' })
    await new Promise(r => setTimeout(r, 100))
    const task = queue.getTasks().find(t => t.id === 'test-progress')
    expect(task).toBeDefined()
  })

  it('deduplicates by default', async () => {
    const queue = new TaskQueue()
    let count = 0
    queue.add(async () => { count++ }, { id: 'dedup' })
    queue.add(async () => { count++ }, { id: 'dedup' })
    await new Promise(r => setTimeout(r, 100))
    expect(count).toBe(1)
  })

  it('subscribes to changes', async () => {
    const queue = new TaskQueue()
    let called = false
    const unsub = queue.subscribe(() => { called = true })
    queue.add(async () => {}, { id: 'sub-test' })
    await new Promise(r => setTimeout(r, 50))
    expect(called).toBe(true)
    unsub()
  })

  it('respects priority ordering', async () => {
    const queue = new TaskQueue()
    queue.add(async () => {}, { id: 'low-1', priority: 'low' })
    queue.add(async () => {}, { id: 'high-1', priority: 'high' })
    queue.add(async () => {}, { id: 'normal-1', priority: 'normal' })
    const tasks = queue.getTasks()
    expect(tasks[0].id).toBe('high-1')
    expect(tasks[1].id).toBe('normal-1')
    expect(tasks[2].id).toBe('low-1')
  })
})

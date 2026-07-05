let nextId = 0

export class TaskQueue {
  constructor() {
    this.tasks = new Map()
    this.listeners = new Set()
  }

  add(taskFn, options = {}) {
    const id = options.id || `task-${++nextId}`
    if (this.tasks.has(id) && !options.duplicate) return id

    const task = {
      id,
      label: options.label || 'Working...',
      priority: options.priority || 'normal',
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      abortController: new AbortController(),
    }

    this.tasks.set(id, task)
    this._notify()

    const timeout = options.timeout || 30000
    const timeoutId = setTimeout(() => {
      if (this.tasks.has(id) && this.tasks.get(id).status === 'running') {
        this._updateTask(id, { status: 'error', error: 'Timeout' })
        setTimeout(() => this.remove(id), 1000)
      }
    }, timeout)

    this._runTask(id, taskFn, timeoutId)
    return id
  }

  async _runTask(id, taskFn, timeoutId) {
    const task = this.tasks.get(id)
    if (!task) return

    this._updateTask(id, { status: 'running' })

    try {
      const result = await taskFn({
        signal: task.abortController.signal,
        onProgress: (progress) => {
          this._updateTask(id, { progress: Math.min(100, Math.max(0, progress)) })
        },
      })
      clearTimeout(timeoutId)
      this._updateTask(id, { status: 'completed', progress: 100, result })
      setTimeout(() => this.remove(id), 2000)
    } catch (err) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        this._updateTask(id, { status: 'cancelled' })
      } else {
        this._updateTask(id, { status: 'error', error: err.message })
      }
      setTimeout(() => this.remove(id), 2000)
    }
  }

  _updateTask(id, updates) {
    const task = this.tasks.get(id)
    if (!task) return
    Object.assign(task, updates)
    this._notify()
  }

  remove(id) {
    const task = this.tasks.get(id)
    if (task) {
      task.abortController.abort()
      this.tasks.delete(id)
      this._notify()
    }
  }

  cancel(id) {
    const task = this.tasks.get(id)
    if (task && task.status === 'running') {
      task.abortController.abort()
      this._updateTask(id, { status: 'cancelled' })
      setTimeout(() => this.remove(id), 500)
    }
  }

  getActiveCount() {
    let count = 0
    for (const task of this.tasks.values()) {
      if (task.status === 'running' || task.status === 'pending') count++
    }
    return count
  }

  getTasks() {
    return Array.from(this.tasks.values()).sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 }
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1)
    })
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  _notify() {
    for (const listener of this.listeners) {
      try { listener() } catch {}
    }
  }
}

export const taskQueue = new TaskQueue()

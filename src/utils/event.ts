type EventHandler = (...args: any[]) => void

export class EventEmitter {
  private events: Map<string, EventHandler[]>

  constructor() {
    this.events = new Map()
  }

  on(event: string, handler: EventHandler) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(handler)
  }

  off(event: string, handler?: EventHandler) {
    if (!handler) {
      this.events.delete(event)
      return
    }
    
    const handlers = this.events.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
      if (handlers.length === 0) {
        this.events.delete(event)
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(...args))
    }
  }
}
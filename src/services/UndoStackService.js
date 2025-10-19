/**
 * ARCHITECTURE: UndoStackService provides bounded undo/redo stacks for immutable editor state snapshots.
 * It follows the manifesto by isolating time-travel mechanics with a deterministic, dependency-free API.
 * Responsibilities:
 * - Push snapshots, undo, redo, and limit memory with a maximum capacity.
 * - Expose current() without mutating returned objects.
 */
export class UndoStackService {
  constructor(capacity = 50) {
    this.capacity = Math.max(1, capacity);
    this._past = [];
    this._future = [];
    this._current = null;
  }

  init(snapshot) {
    this._past = [];
    this._future = [];
    this._current = snapshot ? JSON.parse(JSON.stringify(snapshot)) : null;
    return this.current();
  }

  push(snapshot) {
    if (this._current != null) {
      this._past.push(this._current);
      if (this._past.length > this.capacity) this._past.shift();
    }
    this._current = snapshot ? JSON.parse(JSON.stringify(snapshot)) : null;
    this._future = [];
    return this.current();
  }

  undo() {
    if (!this._past.length) return this.current();
    this._future.unshift(this._current);
    this._current = this._past.pop();
    return this.current();
  }

  redo() {
    if (!this._future.length) return this.current();
    this._past.push(this._current);
    this._current = this._future.shift();
    return this.current();
  }

  clear() {
    this._past = [];
    this._future = [];
    return true;
  }

  current() {
    return this._current ? JSON.parse(JSON.stringify(this._current)) : null;
  }
}

/**
 * ARCHITECTURE: VerificationProgressViewModel translates workflow milestones into a stable progress model.
 * It follows the manifesto by separating presentation state from controllers and network logic.
 * Responsibilities:
 * - Track phases (normalize, validate, geocode, suggest, merge, save) and compute % complete deterministically.
 * - Provide immutable snapshots for progress bars or step indicators.
 */
export class VerificationProgressViewModel {
  constructor() {
    this.steps = [
      { key: "normalize", done: false },
      { key: "validate", done: false },
      { key: "geocode", done: false },
      { key: "suggest", done: false },
      { key: "merge", done: false },
      { key: "save", done: false },
    ];
  }

  mark(key, done = true) {
    const idx = this.steps.findIndex(s => s.key === key);
    if (idx >= 0) this.steps[idx].done = !!done;
    return this.snapshot();
  }

  percent() {
    const total = this.steps.length || 1;
    const done = this.steps.filter(s => s.done).length;
    return Math.round((done / total) * 100);
  }

  reset() {
    for (const s of this.steps) s.done = false;
    return this.snapshot();
  }

  snapshot() {
    return { steps: this.steps.map(s => ({ key: s.key, done: s.done })), percent: this.percent() };
  }
}

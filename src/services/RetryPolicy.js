/**
 * ARCHITECTURE: RetryPolicy executes async operations with bounded retries and jittered backoff.
 * It follows the manifesto by centralizing resilience concerns away from controllers and adapters.
 * Responsibilities:
 * - Execute a provided async function up to maxAttempts with exponential backoff and random jitter.
 * - Allow fast-fail on non-retryable errors via predicate.
 */
export class RetryPolicy {
  constructor(maxAttempts = 5, baseDelayMs = 300, jitterMs = 150, isRetryable = () => true) {
    this.maxAttempts = Math.max(1, maxAttempts);
    this.baseDelayMs = Math.max(0, baseDelayMs);
    this.jitterMs = Math.max(0, jitterMs);
    this.isRetryable = isRetryable;
  }

  async execute(fn) {
    let attempt = 0;
    let lastError = null;
    while (attempt < this.maxAttempts) {
      try {
        return await fn();
      } catch (e) {
        lastError = e;
        attempt++;
        if (attempt >= this.maxAttempts || !this.isRetryable(e)) break;
        const backoff = this.baseDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.floor(Math.random() * this.jitterMs);
        await new Promise((r) => setTimeout(r, backoff + jitter));
      }
    }
    throw lastError || new Error("RetryPolicy: execution failed.");
  }
}

const transientNetworkMessages = new Set([
  "failed to fetch",
  "network request failed",
]);

/**
 * Retries only connection-level failures. Authorization and server-side tRPC
 * errors stay immediate so the UI never masks a real permission problem.
 */
export function shouldRetryTransientRequest(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;
  if (!(error instanceof Error)) return false;
  return transientNetworkMessages.has(error.message.trim().toLowerCase());
}

export function transientRequestRetryDelay(attemptIndex: number): number {
  return Math.min(600 * 2 ** attemptIndex, 3_000);
}

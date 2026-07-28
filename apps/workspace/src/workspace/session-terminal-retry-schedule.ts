const FIRST_RETRY_DELAY_MILLISECONDS = 500;
const LONGEST_RETRY_DELAY_MILLISECONDS = 10000;

export function sessionTerminalRetryDelayMilliseconds(
  consecutiveFailedAttempts: number,
): number {
  const backoffDelay =
    FIRST_RETRY_DELAY_MILLISECONDS *
    2 ** Math.max(0, consecutiveFailedAttempts - 1);
  return Math.min(backoffDelay, LONGEST_RETRY_DELAY_MILLISECONDS);
}

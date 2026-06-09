/**
 * Merges multiple abort signals and an optional timeout into a single AbortSignal.
 * Cleans up all event listeners and timers once aborted or resolved.
 */
export function createCombinedSignal(
  parentSignal?: AbortSignal,
  timeoutMs?: number
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const cleanupFns: (() => void)[] = [];

  const onAbort = () => {
    controller.abort();
    cleanup();
  };

  const cleanup = () => {
    cleanupFns.forEach(fn => fn());
    cleanupFns.length = 0;
  };

  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort();
      return { signal: parentSignal, cleanup: () => {} };
    }
    parentSignal.addEventListener("abort", onAbort);
    cleanupFns.push(() => parentSignal.removeEventListener("abort", onAbort));
  }

  if (timeoutMs !== undefined) {
    const timer = setTimeout(() => {
      // Abort with a specific TimeoutError
      controller.abort(new DOMException("The operation timed out.", "TimeoutError"));
      cleanup();
    }, timeoutMs);
    cleanupFns.push(() => clearTimeout(timer));
  }

  return { signal: controller.signal, cleanup };
}

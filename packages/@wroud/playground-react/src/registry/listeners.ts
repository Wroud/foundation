export type UnsubscribeFn = () => void;
export type ListenerFn = () => void;

// Private internal state
const listeners: ListenerFn[] = [];
let unsubscribeFunctions: UnsubscribeFn[] | null = null;
let transactionDepth = 0;

/**
 * Subscribe to registry change notifications
 */
export function subscribeToRegistryChanges(
  listener: ListenerFn,
): UnsubscribeFn {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}

/**
 * Execute an action within a transaction
 * Listeners are only notified when the outermost transaction completes
 */
export function executeInTransaction<T>(action: () => T): T {
  try {
    transactionDepth++;
    return action();
  } finally {
    transactionDepth--;
    if (transactionDepth === 0) {
      notifyListeners();
    }
  }
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

// Internal functions for other modules
export function registerUnsubscribe(unsubscribe: UnsubscribeFn): void {
  unsubscribeFunctions?.push(unsubscribe);
}

/**
 * Begin collecting unsubscribe functions
 */
export function beginUnsubscribeCollection(): void {
  unsubscribeFunctions = [];
}

/**
 * End collecting unsubscribe functions and return the collected functions
 */
export function endUnsubscribeCollection(): UnsubscribeFn[] | null {
  const functions = unsubscribeFunctions;
  unsubscribeFunctions = null;
  return functions;
}

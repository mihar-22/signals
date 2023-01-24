import {
  createComputation,
  dispose,
  isFunction,
  onDispose,
  read,
  write,
} from "./core";
import type {
  MemoOptions,
  Effect,
  ReadSignal,
  SignalOptions,
  SignalTuple,
  StopEffect,
} from "./types";

/**
 * Wraps the given value into a signal. The signal will return the current value when invoked
 * `fn()`, and provide a simple write API via `set()`. The value can now be observed
 * when used inside other computations created with `computed` and `effect`.
 *
 * @see {@link https://github.com/solidjs/x-reactively#createsignal}
 */
export function createSignal<T>(
  initialValue: T,
  options?: SignalOptions<T>
): SignalTuple<T> {
  const node = createComputation(initialValue, null, options);
  return [read.bind(node), write.bind(node)];
}

/**
 * Creates a new signal whose value is computed and returned by the given function. The given
 * compute function is _only_ re-run when one of it's dependencies are updated. Dependencies are
 * are all signals that are read during execution.
 *
 * @see {@link https://github.com/solidjs/x-reactively#creatememo}
 */
export function createMemo<T, R = never>(
  compute: () => T,
  options?: MemoOptions<T, R>
): ReadSignal<T | R> {
  return read.bind(
    createComputation<T | R>(
      options?.initial as R,
      compute,
      options as MemoOptions<T | R>
    )
  );
}

/**
 * Invokes the given function each time any of the signals that are read inside are updated
 * (i.e., their value changes). The effect is immediately invoked on initialization.
 *
 * @see {@link https://github.com/solidjs/x-reactively#createeffect}
 */
export function createEffect(
  effect: Effect,
  options?: { id?: string }
): StopEffect {
  const signal = createComputation<null>(
    null,
    function runEffect() {
      let effectResult = effect();
      isFunction(effectResult) && onDispose(effectResult);
      return null;
    },
    __DEV__ ? { id: options?.id ?? "effect" } : void 0
  );

  signal._effect = true;
  read.call(signal);

  if (__DEV__) {
    return function stopEffect() {
      dispose.call(signal, true);
    };
  }

  return dispose.bind(signal, true);
}

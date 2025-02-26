import { createEffect, createSignal, flushSync, mapArray } from '../src';

it('should compute keyed map', () => {
  const [$source, setSource] = createSignal([
    { id: 'a' },
    { id: 'b' },
    { id: 'c' },
  ]);

  const computed = vi.fn();

  const map = mapArray($source, (value, index) => {
    computed();
    return {
      id: value.id,
      get index() {
        return index();
      },
    };
  });

  const [a, b, c] = map();
  expect(a.id).toBe('a');
  expect(a.index).toBe(0);
  expect(b.id).toBe('b');
  expect(b.index).toBe(1);
  expect(c.id).toBe('c');
  expect(c.index).toBe(2);
  expect(computed).toHaveBeenCalledTimes(3);

  // Move values around
  setSource((p) => {
    const tmp = p[1];
    p[1] = p[0];
    p[0] = tmp;
    return [...p];
  });

  const [a2, b2, c2] = map();
  expect(a2.id).toBe('b');
  expect(a === b2).toBeTruthy();
  expect(a2.index).toBe(0);
  expect(b2.id).toBe('a');
  expect(b2.index).toBe(1);
  expect(b === a2).toBeTruthy();
  expect(c2.id).toBe('c');
  expect(c2.index).toBe(2);
  expect(c === c2).toBeTruthy();
  expect(computed).toHaveBeenCalledTimes(3);

  // Add new value
  setSource((p) => [...p, { id: 'd' }]);

  expect(map().length).toBe(4);
  expect(map()[map().length - 1].id).toBe('d');
  expect(map()[map().length - 1].index).toBe(3);
  expect(computed).toHaveBeenCalledTimes(4);

  // Remove value
  setSource((p) => p.slice(1));

  expect(map().length).toBe(3);
  expect(map()[0].id).toBe('a');
  expect(map()[0] === b2 && map()[0] === a).toBeTruthy();
  expect(computed).toHaveBeenCalledTimes(4);

  // Empty
  setSource([]);

  expect(map().length).toBe(0);
  expect(computed).toHaveBeenCalledTimes(4);
});

it('should notify observer', () => {
  const [$source, setSource] = createSignal([
    { id: 'a' },
    { id: 'b' },
    { id: 'c' },
  ]);

  const map = mapArray($source, (value) => {
    return { id: value.id };
  });

  const effect = vi.fn(() => map());
  createEffect(effect);

  setSource((prev) => prev.slice(1));
  flushSync();
  expect(effect).toHaveBeenCalledTimes(2);
});

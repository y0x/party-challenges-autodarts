import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseRoute, watchDom } from './router';

describe('parseRoute', () => {
  it('recognises the pages we hook into', () => {
    expect(parseRoute('/play')).toEqual({ name: 'play' });
    expect(parseRoute('/play/')).toEqual({ name: 'play' });
    expect(parseRoute('/lobby/01a14edd-cb7d-75f0-af34-3646abb88696')).toEqual({
      name: 'lobby',
      id: '01a14edd-cb7d-75f0-af34-3646abb88696',
    });
    expect(parseRoute('/matches/abc')).toEqual({ name: 'match', id: 'abc' });
    expect(parseRoute('/history/matches/abc')).toEqual({ name: 'other' });
    expect(parseRoute('/')).toEqual({ name: 'other' });
  });
});

describe('watchDom', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('drops a pending update when stopped', () => {
    const frames = new Map<number, () => void>();
    vi.stubGlobal('document', { body: {} });
    vi.stubGlobal(
      'MutationObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
      frames.set(frames.size + 1, callback);
      return frames.size;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    const update = vi.fn();
    const stop = watchDom(update);
    stop();
    for (const callback of frames.values()) callback();
    expect(update).not.toHaveBeenCalled();
  });
});

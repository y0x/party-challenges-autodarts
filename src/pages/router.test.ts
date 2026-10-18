import { describe, expect, it } from 'vitest';
import { parseRoute } from './router';

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

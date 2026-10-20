// A two-second pulse: one circle scaling up and back. Small enough to ship
// inline as the `json` prop; a real composition would arrive through `src`.
export const pulse = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: 'pulse',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'dot',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [60, 60, 100], e: [120, 120, 100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 30, s: [120, 120, 100], e: [60, 60, 100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 60, s: [60, 60, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [80, 80] }, nm: 'circle' },
        { ty: 'fl', c: { a: 0, k: [0.31, 0.76, 0.97, 1] }, o: { a: 0, k: 100 }, nm: 'fill' },
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0,
    },
  ],
};

/**
 * Orthogonal cable routing that steers around stage items.
 *
 * The stage is rasterised onto a 10-unit grid; blocked cells come from inflated
 * obstacle boxes. An A* search (with a small turn penalty so runs stay straight)
 * finds a Manhattan path between two anchors. Because only the anchors are
 * stored on the document, the route re-solves whenever the stage changes — so a
 * cable automatically goes around an item that gets dropped in its way.
 */

export type Box = { x: number; y: number; w: number; h: number };

const STEP = 10;
const TURN_PENALTY = 3;
const MARGIN = 12;

const DIRS = [
  { dx: 0, dy: -1 }, // 0 up
  { dx: 1, dy: 0 }, // 1 right
  { dx: 0, dy: 1 }, // 2 down
  { dx: -1, dy: 0 }, // 3 left
] as const;

type HeapNode = { f: number; idx: number; dir: number };

class MinHeap {
  private a: HeapNode[] = [];
  push(n: HeapNode) {
    const a = this.a;
    a.push(n);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): HeapNode | undefined {
    const a = this.a;
    if (a.length === 0) return undefined;
    const top = a[0];
    const last = a.pop() as HeapNode;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
  get size() {
    return this.a.length;
  }
}

type Grid = { cols: number; rows: number; blocked: Uint8Array };

function buildGrid(
  width: number,
  height: number,
  obstacles: Box[],
  skip: { x: number; y: number }[],
): Grid {
  const cols = Math.ceil(width / STEP) + 1;
  const rows = Math.ceil(height / STEP) + 1;
  const blocked = new Uint8Array(cols * rows);
  for (const o of obstacles) {
    // Never block a box the cable starts or ends on (e.g. the outlet it leaves).
    const containsEndpoint = skip.some(
      (p) =>
        p.x >= o.x - 2 && p.x <= o.x + o.w + 2 && p.y >= o.y - 2 && p.y <= o.y + o.h + 2,
    );
    if (containsEndpoint) continue;

    const c0 = Math.max(0, Math.floor((o.x - MARGIN) / STEP));
    const c1 = Math.min(cols - 1, Math.ceil((o.x + o.w + MARGIN) / STEP));
    const r0 = Math.max(0, Math.floor((o.y - MARGIN) / STEP));
    const r1 = Math.min(rows - 1, Math.ceil((o.y + o.h + MARGIN) / STEP));
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) blocked[r * cols + c] = 1;
    }
  }
  return { cols, rows, blocked };
}

/** Closest unblocked cell to (c,r), searched in growing rings. */
function freeCell(grid: Grid, c: number, r: number): { c: number; r: number } | null {
  const { cols, rows, blocked } = grid;
  const clampC = Math.min(cols - 1, Math.max(0, c));
  const clampR = Math.min(rows - 1, Math.max(0, r));
  if (!blocked[clampR * cols + clampC]) return { c: clampC, r: clampR };
  for (let radius = 1; radius < Math.max(cols, rows); radius += 1) {
    for (let dr = -radius; dr <= radius; dr += 1) {
      for (let dc = -radius; dc <= radius; dc += 1) {
        if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
        const rr = clampR + dr;
        const cc = clampC + dc;
        if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
        if (!blocked[rr * cols + cc]) return { c: cc, r: rr };
      }
    }
  }
  return null;
}

type Cell = { c: number; r: number };

function search(grid: Grid, start: Cell, goal: Cell): Cell[] | null {
  const { cols, rows, blocked } = grid;
  const n = cols * rows;
  const state = (idx: number, dir: number) => idx * 4 + dir;
  const g = new Float64Array(n * 4).fill(Infinity);
  const came = new Int32Array(n * 4).fill(-1);
  const goalIdx = goal.r * cols + goal.c;
  const heap = new MinHeap();

  const startIdx = start.r * cols + start.c;
  for (let d = 0; d < 4; d += 1) {
    const s = state(startIdx, d);
    g[s] = 0;
    // bias the initial direction toward the goal so the first move is sensible
    const h = Math.abs(start.c - goal.c) + Math.abs(start.r - goal.r);
    heap.push({ f: h, idx: s, dir: d });
  }

  const cameFromState = (s: number) => Math.floor(s / 4);
  const dirOf = (s: number) => s % 4;

  while (heap.size) {
    const node = heap.pop() as HeapNode;
    const s = node.idx;
    const cur = cameFromState(s);
    if (cur === goalIdx) {
      // reconstruct
      const path: Cell[] = [];
      let cs = s;
      while (cs !== -1) {
        const idx = cameFromState(cs);
        path.push({ c: idx % cols, r: Math.floor(idx / cols) });
        cs = came[cs];
      }
      path.reverse();
      return path;
    }
    const dir = dirOf(s);
    const cr = Math.floor(cur / cols);
    const cc = cur % cols;
    for (let d = 0; d < 4; d += 1) {
      const nc = cc + DIRS[d].dx;
      const nr = cr + DIRS[d].dy;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const nIdx = nr * cols + nc;
      if (blocked[nIdx] && nIdx !== goalIdx) continue;
      const ns = state(nIdx, d);
      const cost = 1 + (d === dir ? 0 : TURN_PENALTY);
      const ng = g[s] + cost;
      if (ng < g[ns]) {
        g[ns] = ng;
        came[ns] = s;
        const h = Math.abs(nc - goal.c) + Math.abs(nr - goal.r);
        heap.push({ f: ng + h, idx: ns, dir: d });
      }
    }
  }
  return null;
}

function simplify(points: Cell[]): number[] {
  const out: number[] = [];
  for (const p of points) {
    const x = p.c * STEP;
    const y = p.r * STEP;
    const len = out.length;
    if (len >= 4) {
      // drop a point that continues in the same direction
      const [ax, ay, bx, by] = [out[len - 4], out[len - 3], out[len - 2], out[len - 1]];
      const sameX = ax === bx && bx === x;
      const sameY = ay === by && by === y;
      if (sameX || sameY) {
        out[len - 2] = x;
        out[len - 1] = y;
        continue;
      }
    }
    out.push(x, y);
  }
  return out;
}

/** L-shaped fallback when no route is found (keeps a cable visible regardless). */
function fallback(sx: number, sy: number, ex: number, ey: number): number[] {
  return [sx, sy, ex, sy, ex, ey];
}

function dedupe(pts: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i + 1 < pts.length; i += 2) {
    const x = pts[i];
    const y = pts[i + 1];
    const len = out.length;
    if (len >= 2 && out[len - 2] === x && out[len - 1] === y) continue;
    out.push(x, y);
  }
  return out;
}

function routeSegment(
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  grid: Grid,
): number[] {
  const start = freeCell(grid, Math.round(sx / STEP), Math.round(sy / STEP));
  const goal = freeCell(grid, Math.round(ex / STEP), Math.round(ey / STEP));
  if (!start || !goal) return fallback(sx, sy, ex, ey);
  const path = search(grid, start, goal);
  if (!path) return fallback(sx, sy, ex, ey);

  const routed = simplify(path); // grid points, all multiples of STEP
  const g0x = routed[0];
  const g0y = routed[1];
  const gnx = routed[routed.length - 2];
  const gny = routed[routed.length - 1];

  const out: number[] = [sx, sy];
  // orthogonal stub from the exact anchor onto the grid
  if (g0x !== sx && g0y !== sy) out.push(g0x, sy);
  out.push(g0x, g0y);
  for (let i = 2; i < routed.length; i += 2) out.push(routed[i], routed[i + 1]);
  // orthogonal stub from the grid back to the exact anchor
  if (gnx !== ex && gny !== ey) out.push(ex, gny);
  out.push(ex, ey);

  return dedupe(out);
}

/**
 * Route a cable through its anchor points, steering around `obstacles`.
 * Returns a flat [x,y,...] polyline in stage units.
 */
export function routeCable(
  anchors: number[],
  obstacles: Box[],
  width: number,
  height: number,
): number[] {
  if (anchors.length < 4) return [...anchors];

  const grid = buildGrid(width, height, obstacles, endpoints(anchors));

  const out: number[] = [];
  for (let i = 0; i + 3 < anchors.length; i += 2) {
    const seg = routeSegment(anchors[i], anchors[i + 1], anchors[i + 2], anchors[i + 3], grid);
    if (out.length >= 2) out.push(...seg.slice(2));
    else out.push(...seg);
  }
  return out;
}

/** Anchor points (deduped) used to decide which boxes not to block. */
function endpoints(anchors: number[]): { x: number; y: number }[] {
  const list: { x: number; y: number }[] = [];
  for (let i = 0; i + 1 < anchors.length; i += 2) {
    list.push({ x: anchors[i], y: anchors[i + 1] });
  }
  return list;
}

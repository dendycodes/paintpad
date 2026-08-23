/**
 * Ramer–Douglas–Peucker. Freehand input arrives far denser than it needs to be;
 * simplifying once on commit keeps redraws, snapshots and autosave small
 * without any visible change to the stroke.
 */
export const simplifyPoints = (points: number[], epsilon: number): number[] => {
  const count = points.length / 2;
  if (count < 3 || epsilon <= 0) return points;

  const keep = new Uint8Array(count);
  keep[0] = 1;
  keep[count - 1] = 1;

  const stack: [number, number][] = [[0, count - 1]];
  const epsilonSq = epsilon * epsilon;

  while (stack.length) {
    const [first, last] = stack.pop() as [number, number];
    if (last - first < 2) continue;

    const ax = points[first * 2];
    const ay = points[first * 2 + 1];
    const bx = points[last * 2];
    const by = points[last * 2 + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;

    let farthest = -1;
    let farthestSq = epsilonSq;

    for (let i = first + 1; i < last; i += 1) {
      const px = points[i * 2];
      const py = points[i * 2 + 1];
      let distSq: number;

      if (lengthSq === 0) {
        distSq = (px - ax) ** 2 + (py - ay) ** 2;
      } else {
        const t = Math.max(
          0,
          Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq)
        );
        distSq = (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2;
      }

      if (distSq > farthestSq) {
        farthest = i;
        farthestSq = distSq;
      }
    }

    if (farthest !== -1) {
      keep[farthest] = 1;
      stack.push([first, farthest], [farthest, last]);
    }
  }

  const result: number[] = [];
  for (let i = 0; i < count; i += 1) {
    if (keep[i]) result.push(points[i * 2], points[i * 2 + 1]);
  }
  return result;
};

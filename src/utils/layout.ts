export interface LaneItem {
  id: string;
  start: number;
  end: number;
}

export interface LaneResult {
  lanes: Map<string, number>;
  laneCount: number;
}

/**
 * Asigna "carriles" horizontales a bloques que se superponen en el tiempo,
 * para que puedan mostrarse lado a lado sin solaparse visualmente.
 */
export function assignOverlapLanes(items: LaneItem[]): LaneResult {
  const sorted = [...items].sort((a, b) => a.start - b.start);
  const laneEndTimes: number[] = [];
  const lanes = new Map<string, number>();

  for (const item of sorted) {
    let placedLane = -1;
    for (let lane = 0; lane < laneEndTimes.length; lane++) {
      if (laneEndTimes[lane] <= item.start) {
        placedLane = lane;
        break;
      }
    }
    if (placedLane === -1) {
      placedLane = laneEndTimes.length;
      laneEndTimes.push(item.end);
    } else {
      laneEndTimes[placedLane] = item.end;
    }
    lanes.set(item.id, placedLane);
  }

  return { lanes, laneCount: Math.max(1, laneEndTimes.length) };
}

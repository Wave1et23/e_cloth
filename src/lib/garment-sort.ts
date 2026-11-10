/** 衣柜列表排序：穿着次数降序，次数相同按 seq 降序。 */

export type GarmentWithWornEvents = {
  seq: number;
  /** 调用方只传入 WORN 事件；这里按数组长度当穿着次数。 */
  events: readonly unknown[];
};

export function compareGarmentsByWorn(
  a: GarmentWithWornEvents,
  b: GarmentWithWornEvents,
): number {
  const byCount = b.events.length - a.events.length;
  if (byCount !== 0) return byCount;
  return b.seq - a.seq;
}

/** 返回新数组，不修改入参；0 次穿着自然排在最后。 */
export function sortGarmentsByWorn<T extends GarmentWithWornEvents>(
  garments: readonly T[],
): T[] {
  return [...garments].sort(compareGarmentsByWorn);
}

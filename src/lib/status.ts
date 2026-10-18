/** 5 个状态与 6 个事件的唯一映射表（DECISIONS §3）。 */

export const STATUSES = {
  IN_CLOSET: "在柜",
  WORN: "穿着中",
  TO_WASH: "待洗",
  STORED: "收纳",
  RETIRED: "已退出",
} as const;

export type GarmentStatus = keyof typeof STATUSES;

export const EVENTS = {
  WORN: "今天穿了",
  WASHED: "要洗",
  DRY_CLEANED: "送干洗",
  RETURNED: "放回衣柜",
  STORED: "收起来",
  SOLD: "卖掉了",
} as const;

export type GarmentEventType = keyof typeof EVENTS;

/** 6 事件 → 5 状态。事件只增不改，状态是事件的结果。 */
export const EVENT_TO_STATUS: Record<GarmentEventType, GarmentStatus> = {
  WORN: "WORN",
  WASHED: "TO_WASH",
  DRY_CLEANED: "TO_WASH",
  RETURNED: "IN_CLOSET",
  STORED: "STORED",
  SOLD: "RETIRED",
};

export const STATUS_VALUES = Object.keys(STATUSES) as GarmentStatus[];
export const EVENT_VALUES = Object.keys(EVENTS) as GarmentEventType[];

export function isGarmentStatus(value: unknown): value is GarmentStatus {
  return typeof value === "string" && value in STATUSES;
}

export function isGarmentEventType(value: unknown): value is GarmentEventType {
  return typeof value === "string" && value in EVENTS;
}

/** 未知状态按“在柜”兜底，避免历史脏数据把页面打挂。 */
export function normalizeStatus(value: unknown): GarmentStatus {
  return isGarmentStatus(value) ? value : "IN_CLOSET";
}

/** 事件 → 新状态；调用方必须先确认 event 合法。 */
export function nextStatus(event: GarmentEventType): GarmentStatus {
  return EVENT_TO_STATUS[event];
}

export function statusLabel(value: unknown): string {
  return STATUSES[normalizeStatus(value)];
}

export function eventLabel(value: GarmentEventType): string {
  return EVENTS[value];
}

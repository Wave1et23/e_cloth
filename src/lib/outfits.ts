/** 固定搭配的纯逻辑：校验、顺序、删除影响；页面和 API 共用。 */

export const OUTFIT_NAME_MAX = 40;
export const OUTFIT_NOTES_MAX = 200;
export const OUTFIT_MIN_ITEMS = 1;
export const OUTFIT_MAX_ITEMS = 4;

type Ok<T> = { ok: true; value: T };
type Fail = { ok: false; msg: string };
export type ValidationResult<T> = Ok<T> | Fail;

export function validateOutfitName(value: unknown): ValidationResult<string> {
  if (typeof value !== "string") {
    return { ok: false, msg: "请给这套搭配起个名字" };
  }
  const name = value.trim();
  if (name === "") return { ok: false, msg: "请给这套搭配起个名字" };
  if ([...name].length > OUTFIT_NAME_MAX) {
    return { ok: false, msg: `搭配名称最多 ${OUTFIT_NAME_MAX} 个字` };
  }
  return { ok: true, value: name };
}

export function validateOutfitNotes(value: unknown): ValidationResult<string | null> {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, msg: "备注格式不对" };
  const notes = value.trim();
  if (notes === "") return { ok: true, value: null };
  if ([...notes].length > OUTFIT_NOTES_MAX) {
    return { ok: false, msg: `备注最多 ${OUTFIT_NOTES_MAX} 字` };
  }
  return { ok: true, value: notes };
}

/** 校验衣物 ID 数组：1–4 件、去空白、不允许重复。 */
export function validateOutfitItems(
  value: unknown,
  options: { allowEmpty?: boolean } = {},
): ValidationResult<string[]> {
  if (!Array.isArray(value)) {
    return { ok: false, msg: "请选择要放进搭配的衣物" };
  }
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string" || item.trim() === "") {
      return { ok: false, msg: "衣物参数不对，请重新选择" };
    }
    const id = item.trim();
    if (seen.has(id)) {
      return { ok: false, msg: "同一件衣物不能重复添加" };
    }
    seen.add(id);
    ids.push(id);
  }
  if (ids.length < OUTFIT_MIN_ITEMS && !options.allowEmpty) {
    return { ok: false, msg: "至少选择 1 件衣物" };
  }
  if (ids.length > OUTFIT_MAX_ITEMS) {
    return { ok: false, msg: `一套搭配最多 ${OUTFIT_MAX_ITEMS} 件衣物` };
  }
  return { ok: true, value: ids };
}

/** 归属校验；API 查询到 outfit 后必须调用。 */
export function isOutfitOwner(
  outfit: { userId: string } | null | undefined,
  userId: string,
): boolean {
  return Boolean(outfit && outfit.userId === userId);
}

/** 删除衣物时从搭配项里移除；返回新数组，不修改入参。 */
export function removeGarmentFromOutfitItems<T extends { garmentId: string }>(
  items: readonly T[],
  garmentId: string,
): { items: T[]; becameEmpty: boolean; removed: boolean } {
  const remaining = items.filter((item) => item.garmentId !== garmentId);
  const removed = remaining.length !== items.length;
  return {
    items: remaining,
    becameEmpty: removed && remaining.length === 0,
    removed,
  };
}

/** 删除衣物前，根据受影响的搭配计算提示数字。 */
export function summarizeOutfitRemoval(
  affectedOutfits: ReadonlyArray<{ items: ReadonlyArray<unknown> }>,
): { affected: number; emptied: number } {
  return {
    affected: affectedOutfits.length,
    emptied: affectedOutfits.filter((outfit) => outfit.items.length === 1).length,
  };
}

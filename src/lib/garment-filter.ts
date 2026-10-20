/** 衣柜列表的分类筛选：纯函数，方便单测。 */

/** 把重复的 ?category= 参数收敛成去重数组；空值忽略。 */
export function parseCategoryParams(
  value: string | string[] | undefined,
): string[] {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of values) {
    const category = item.trim();
    if (category === "" || seen.has(category)) continue;
    seen.add(category);
    result.push(category);
  }
  return result;
}

/**
 * 分类来源是衣物已有的 category：
 * 已知分类按选项顺序，未知分类排在后面。
 */
export function deriveCategories<T extends { category: string }>(
  garments: T[],
  options: readonly string[],
): string[] {
  const present = new Set(garments.map((garment) => garment.category));
  const known = options.filter((option) => present.has(option));
  const unknown = [...present]
    .filter((category) => !options.includes(category))
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  return [...known, ...unknown];
}

/**
 * 合并“衣物已有分类”和 URL 里请求的分类：
 * - 正常标签只来自衣物已有分类；
 * - URL 请求了合法但当前无衣物的分类时，也显示该标签，便于展示空结果；
 * - 未知分类忽略。
 */
export function resolveCategoryFilter<T extends { category: string }>(
  garments: T[],
  options: readonly string[],
  requested: string[],
): { categories: string[]; selected: string[] } {
  const present = deriveCategories(garments, options);
  const validRequested = requested.filter((category) =>
    options.includes(category),
  );
  const categories = [
    ...present,
    ...validRequested.filter((category) => !present.includes(category)),
  ];
  const selected = categories.filter((category) =>
    validRequested.includes(category),
  );
  return { categories, selected };
}

/** 空选择表示全部；多选为并集。 */
export function filterByCategories<T extends { category: string }>(
  garments: T[],
  selected: string[],
): T[] {
  if (selected.length === 0) return garments;
  return garments.filter((garment) => selected.includes(garment.category));
}

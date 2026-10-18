/** 输入校验：只做长度与格式，不做“违禁词”之类的主观判断。 */

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length === 0 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function isValidPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 128;
}

/** 读取表单/JSON 里的字符串字段，去首尾空格并限制长度。 */
export function readText(
  value: unknown,
  maxLength: number,
): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.length > maxLength) return null;
  return text;
}

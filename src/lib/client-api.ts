/** 前端统一请求封装：永不向页面抛异常，只返回 { ok, data } / { ok, msg }。 */

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; msg: string; code?: string; retryAfterSeconds?: number };

const NETWORK_ERROR = "网络不太好，再试一次";

export async function apiFetch<T>(
  input: string,
  init?: RequestInit & { json?: unknown },
): Promise<ClientResult<T>> {
  const { json, ...rest } = init ?? {};
  try {
    const response = await fetch(input, {
      ...rest,
      headers: {
        ...(json === undefined ? {} : { "Content-Type": "application/json" }),
        ...(rest.headers ?? {}),
      },
      body: json === undefined ? rest.body : JSON.stringify(json),
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const record =
      payload !== null && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : null;

    if (record?.ok === true) {
      return { ok: true, data: record.data as T };
    }

    return {
      ok: false,
      msg:
        typeof record?.msg === "string" && record.msg !== ""
          ? record.msg
          : "请求没成功，再试一次",
      code: typeof record?.code === "string" ? record.code : undefined,
      retryAfterSeconds:
        typeof record?.retryAfterSeconds === "number"
          ? record.retryAfterSeconds
          : undefined,
    };
  } catch {
    return { ok: false, msg: NETWORK_ERROR };
  }
}

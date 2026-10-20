import { MailUnavailableError, type MailAdapter } from "./types.ts";

/**
 * 本地控制台模式：不真发信，只把验证码打到服务端日志。
 * - 仅非 production 可用；
 * - MAIL_CONSOLE_LOG_CODE=0 时日志只留元数据，不打印明文码；
 * - 这是唯一允许打印明文验证码的 adapter。
 */
export function createConsoleMailAdapter(): MailAdapter {
  return {
    async sendVerificationCode({ to, code, purpose, expiresAt }) {
      if (process.env.NODE_ENV === "production") {
        throw new MailUnavailableError(
          "生产环境禁止使用控制台邮件模式",
        );
      }
      const showCode = process.env.MAIL_CONSOLE_LOG_CODE !== "0";
      console.info(
        `[mail:console] to=${to} purpose=${purpose} expiresAt=${expiresAt.toISOString()}${
          showCode ? ` code=${code}` : " code=<hidden>"
        }`,
      );
    },
  };
}

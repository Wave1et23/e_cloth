import { createConsoleMailAdapter } from "./console.ts";
import { MailUnavailableError, type MailAdapter } from "./types.ts";

export type { MailAdapter, MailPurpose, VerificationMail } from "./types.ts";
export { MailUnavailableError } from "./types.ts";

const unavailable: MailAdapter = {
  async sendVerificationCode() {
    throw new MailUnavailableError();
  },
};

/**
 * 当前只实现 console；真实服务商 key 到位后再加 provider。
 * 生产环境即使误配 MAIL_PROVIDER=console，也返回 unavailable，绝不打印验证码。
 */
export function getMailAdapter(): MailAdapter {
  const provider = (process.env.MAIL_PROVIDER ?? "console").trim();
  if (provider === "console" && process.env.NODE_ENV !== "production") {
    return createConsoleMailAdapter();
  }
  return unavailable;
}

import { createConsoleMailAdapter } from "./console.ts";
import { createSmtpMailAdapter, type SmtpConfig } from "./smtp.ts";
import { MailUnavailableError, type MailAdapter } from "./types.ts";

export type { MailAdapter, MailPurpose, VerificationMail } from "./types.ts";
export { MailUnavailableError } from "./types.ts";

const unavailable: MailAdapter = {
  async sendVerificationCode() {
    throw new MailUnavailableError();
  },
};

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.MAIL_SMTP_HOST?.trim();
  const user = process.env.MAIL_SMTP_USER?.trim();
  const pass = process.env.MAIL_SMTP_PASS;
  const port = Number(process.env.MAIL_SMTP_PORT ?? "465");
  if (!host || !user || !pass || !Number.isInteger(port) || port <= 0) {
    return null;
  }
  return {
    host,
    port,
    secure: process.env.MAIL_SMTP_SECURE !== "0",
    user,
    pass,
    from: process.env.MAIL_FROM?.trim() || undefined,
  };
}

/**
 * provider 选择：
 * - smtp：配置齐全才可用；生产环境允许；
 * - console：仅非 production 可用，生产环境拒绝，绝不打印验证码；
 * - 其他/缺配置：返回 unavailable，由接口转成 503。
 */
export function getMailAdapter(): MailAdapter {
  const provider = (process.env.MAIL_PROVIDER ?? "console").trim();
  if (provider === "smtp") {
    const config = getSmtpConfig();
    return config ? createSmtpMailAdapter(config) : unavailable;
  }
  if (provider === "console" && process.env.NODE_ENV !== "production") {
    return createConsoleMailAdapter();
  }
  return unavailable;
}

import nodemailer from "nodemailer";
import { MailUnavailableError, type MailAdapter } from "./types.ts";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from?: string;
};

/**
 * 163 / 通用 SMTP 实现。
 * 不打印验证码，也不把授权码写进日志；发送失败由调用方转成 503。
 */
export function createSmtpMailAdapter(config: SmtpConfig): MailAdapter {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return {
    async sendVerificationCode({ to, code, purpose, expiresAt }) {
      if (purpose !== "REGISTER" && purpose !== "RESET_PASSWORD") {
        throw new MailUnavailableError("不支持的邮件用途");
      }
      const expiresMinutes = Math.max(
        1,
        Math.round((expiresAt.getTime() - Date.now()) / 60_000),
      );
      const from = config.from || `衣橱镜像 <${config.user}>`;
      const isReset = purpose === "RESET_PASSWORD";
      const subject = isReset
        ? "衣橱镜像 · 重置密码验证码"
        : "衣橱镜像 · 注册验证码";
      const action = isReset ? "重置密码" : "注册";

      await transporter.sendMail({
        from,
        to,
        subject,
        text: `你的${action}验证码是 ${code}，${expiresMinutes} 分钟内有效。请勿转发给他人。`,
        html: [
          `<p>你的衣橱镜像${action}验证码是：</p>`,
          `<p style="font-size:22px;font-weight:600;letter-spacing:3px">${code}</p>`,
          `<p>${expiresMinutes} 分钟内有效，请勿转发给他人。</p>`,
        ].join(""),
      });
    },
  };
}

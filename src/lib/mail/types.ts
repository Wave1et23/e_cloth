/** 邮件发送 adapter 的公共类型；真实服务商 key 到位前只有 console 实现。 */

export type MailPurpose = "REGISTER";

export type VerificationMail = {
  to: string;
  code: string;
  purpose: MailPurpose;
  expiresAt: Date;
};

export interface MailAdapter {
  sendVerificationCode(input: VerificationMail): Promise<void>;
}

export class MailUnavailableError extends Error {
  constructor(message = "邮件服务还没配置") {
    super(message);
    this.name = "MailUnavailableError";
  }
}

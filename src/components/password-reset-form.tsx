"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";

type Props = {
  onDone: (email: string) => void;
  onCancel: () => void;
};

export function PasswordResetForm({ onDone, onCancel }: Props) {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);

  function changeEmail(value: string) {
    setEmail(value);
    if (value.trim().toLowerCase() !== sentEmail) {
      setSentEmail("");
      setCode("");
      setNotice("");
      setCooldown(0);
    }
  }

  async function sendCode() {
    if (sending || busy) return;
    const target = email.trim();
    if (!target) {
      setError("先填邮箱，再获取验证码");
      return;
    }
    setSending(true);
    setError("");
    setNotice("");
    const result = await apiFetch<{ cooldownSeconds: number }>(
      "/api/auth/password-reset-code",
      { method: "POST", json: { email: target } },
    );
    if (!result.ok) {
      setError(result.msg);
      if (result.retryAfterSeconds) setCooldown(result.retryAfterSeconds);
      setSending(false);
      return;
    }
    setSentEmail(target.trim().toLowerCase());
    setCooldown(result.data.cooldownSeconds ?? 60);
    setCode("");
    setNotice("如果该邮箱已注册，验证码已发送，请查收（含垃圾箱）。");
    setSending(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (password.length < 8) {
      setError("新密码至少 8 位");
      return;
    }
    if (password !== confirm) {
      setError("两次输入的新密码不一样");
      return;
    }
    setBusy(true);
    const result = await apiFetch<{ reset: true }>("/api/auth/reset-password", {
      method: "POST",
      json: { email, code, password },
    });
    if (!result.ok) {
      setError(result.msg);
      setBusy(false);
      return;
    }
    onDone(email.trim().toLowerCase());
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {error ? (
        <div className="form-error" role="alert">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="banner banner-ok" role="status">
          {notice}
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="reset-email">邮箱</label>
        <input
          id="reset-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => changeEmail(event.target.value)}
        />
      </div>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={sendCode}
        disabled={sending || busy || cooldown > 0}
      >
        {sending
          ? "发送中…"
          : cooldown > 0
            ? `重新发送（${cooldown}s）`
            : "发送验证码"}
      </button>

      {sentEmail ? (
        <>
          <div className="field">
            <label htmlFor="reset-code">验证码</label>
            <input
              id="reset-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="6 位数字"
            />
          </div>
          <div className="field">
            <label htmlFor="reset-password">新密码</label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 8 位"
            />
          </div>
          <div className="field">
            <label htmlFor="reset-confirm">确认新密码</label>
            <input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "重置中…" : "重置密码"}
          </button>
        </>
      ) : null}

      <button type="button" className="link-button" onClick={onCancel} disabled={busy}>
        返回登录
      </button>
    </form>
  );
}

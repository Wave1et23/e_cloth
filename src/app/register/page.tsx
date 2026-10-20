"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [cooldownEmail, setCooldownEmail] = useState("");
  const [submitCooldown, setSubmitCooldown] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ id: string }>("/api/auth/me").then((result) => {
      if (!cancelled && result.ok) router.replace("/garments");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (submitCooldown <= 0) return;
    const timer = setTimeout(
      () => setSubmitCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [submitCooldown]);

  function changeEmail(value: string) {
    setEmail(value);
    if (value.trim() !== cooldownEmail) setCooldown(0);
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
      "/api/auth/verification-code",
      { method: "POST", json: { email: target } },
    );
    if (!result.ok) {
      setError(result.msg);
      if (result.retryAfterSeconds) {
        setCooldown(result.retryAfterSeconds);
        setCooldownEmail(target);
      }
      setSending(false);
      return;
    }
    setCooldown(result.data.cooldownSeconds ?? 60);
    setCooldownEmail(target);
    setCode("");
    setNotice("验证码已发送。控制台模式下请查看服务端日志。");
    setSending(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || submitCooldown > 0) return;
    setError("");
    setNotice("");
    if (password !== confirm) {
      setError("两次密码不一样");
      return;
    }
    setBusy(true);
    const result = await apiFetch<{ id: string }>("/api/auth/register", {
      method: "POST",
      json: { email, password, code },
    });
    if (result.ok) {
      router.push("/garments");
      router.refresh();
      return;
    }
    setError(result.msg);
    if (result.retryAfterSeconds) {
      setSubmitCooldown(result.retryAfterSeconds);
    }
    setBusy(false);
  }

  const waiting =
    cooldown > 0 && cooldownEmail === email.trim() && !sending;

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>创建账号</h1>
        <p className="sub">一个邮箱、一个密码，就可以开始。</p>
        <form className="auth-form" onSubmit={submit}>
          {error ? (
            <div className="form-error" role="alert">
              {error}
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="email">邮箱</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => changeEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="code">验证码</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="6 位数字"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button
                type="button"
                className="btn"
                disabled={sending || busy || waiting || email.trim() === ""}
                onClick={sendCode}
              >
                {sending
                  ? "发送中…"
                  : waiting
                    ? `重新发送（${cooldown}s）`
                    : "发送验证码"}
              </button>
            </div>
          </div>
          {notice ? (
            <p className="form-note" role="status">
              {notice}
            </p>
          ) : null}
          <div className="field">
            <label htmlFor="password">密码（至少 8 位）</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">再输一次密码</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || submitCooldown > 0}
          >
            {busy
              ? "创建中…"
              : submitCooldown > 0
                ? `稍后重试（${submitCooldown}s）`
                : "创建账号"}
          </button>
        </form>
        <p className="legal-consent">注册或登录即表示你已阅读并同意<Link href="/legal/privacy">《隐私协议》</Link>和<Link href="/legal/terms">《用户协议》</Link></p>
        <p className="auth-foot">
          已经有账号？<Link href="/login">去登录</Link>
        </p>
      </div>
    </div>
  );
}

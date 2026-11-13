"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { PasswordResetForm } from "@/components/password-reset-form";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [resetMode, setResetMode] = useState(false);
  const [notice, setNotice] = useState("");

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
    if (retryAfter <= 0) return;
    const timer = setTimeout(
      () => setRetryAfter((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [retryAfter]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || retryAfter > 0) return;
    setError("");
    setBusy(true);
    const result = await apiFetch<{ id: string }>("/api/auth/login", {
      method: "POST",
      json: { email, password },
    });
    if (result.ok) {
      router.push("/garments");
      router.refresh();
      return;
    }
    setError(result.msg);
    if (result.retryAfterSeconds) setRetryAfter(result.retryAfterSeconds);
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>{resetMode ? "重置密码" : "欢迎回来"}</h1>
        <p className="sub">
          {resetMode
            ? "用注册邮箱收验证码，设置一个新密码。"
            : "登录后继续整理你的衣柜。"}
        </p>
        {resetMode ? (
          <PasswordResetForm
            onDone={(resetEmail) => {
              setEmail(resetEmail);
              setPassword("");
              setResetMode(false);
              setNotice("密码已重置，请用新密码登录。");
            }}
            onCancel={() => setResetMode(false)}
          />
        ) : (
          <>
            {notice ? (
              <div className="banner banner-ok" role="status">
                {notice}
              </div>
            ) : null}
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
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="password">密码</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setError("");
                  setResetMode(true);
                }}
              >
                忘记密码？
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy || retryAfter > 0}
              >
                {busy
                  ? "登录中…"
                  : retryAfter > 0
                    ? `稍后重试（${retryAfter}s）`
                    : "登录"}
              </button>
            </form>
            <p className="legal-consent">注册或登录即表示你已阅读并同意<Link href="/legal/privacy">《隐私协议》</Link>和<Link href="/legal/terms">《用户协议》</Link></p>
            <p className="auth-foot">
              还没有账号？<Link href="/register">去注册</Link>
            </p>
          </>
        )}
        {resetMode ? (
          <p className="legal-consent">
            重置密码会使用注册邮箱验证码；不会在这里登录。
          </p>
        ) : null}
      </div>
    </div>
  );
}

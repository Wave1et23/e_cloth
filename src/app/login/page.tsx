"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ id: string }>("/api/auth/me").then((result) => {
      if (!cancelled && result.ok) router.replace("/garments");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
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
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>欢迎回来</h1>
        <p className="sub">登录后继续整理你的衣柜。</p>
        <form className="auth-form" onSubmit={submit}>
          {error ? <div className="form-error">{error}</div> : null}
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
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "登录中…" : "登录"}
          </button>
        </form>
        <p className="auth-foot">
          还没有账号？<Link href="/register">去注册</Link>
        </p>
      </div>
    </div>
  );
}

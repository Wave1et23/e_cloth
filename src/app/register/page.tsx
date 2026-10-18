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
    if (password !== confirm) {
      setError("两次密码不一样");
      return;
    }
    setBusy(true);
    const result = await apiFetch<{ id: string }>("/api/auth/register", {
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
        <h1>创建账号</h1>
        <p className="sub">一个邮箱、一个密码，就可以开始。</p>
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
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "创建中…" : "创建账号"}
          </button>
        </form>
        <p className="auth-foot">
          已经有账号？<Link href="/login">去登录</Link>
        </p>
      </div>
    </div>
  );
}

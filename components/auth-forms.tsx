"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "./locale-provider";

export function AuthForms({ mode }: { mode: "login" | "register" }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, familyName, locale }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "Error");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="auth-screen">
      <div className="auth-sky" aria-hidden="true">
        <div className="auth-glow auth-glow-a" />
        <div className="auth-glow auth-glow-b" />
        <div className="auth-arc">
          <span className="auth-arc-dot wake" />
          <span className="auth-arc-line" />
          <span className="auth-arc-dot sleep" />
        </div>
      </div>

      <div className="auth-hero">
        <p className="auth-kicker">{isLogin ? t.authKickerLogin : t.authKickerRegister}</p>
        <h1 className="auth-brand">{t.appName}</h1>
        <p className="auth-tagline">{t.tagline}</p>
      </div>

      <form onSubmit={onSubmit} className="auth-form">
        <div className="auth-field">
          <label className="auth-label" htmlFor="auth-phone">
            {t.phone}
          </label>
          <input
            id="auth-phone"
            className="auth-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder={t.phonePlaceholder}
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="auth-password">
            {t.password}
          </label>
          <input
            id="auth-password"
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder={t.passwordPlaceholder}
            minLength={6}
            required
          />
        </div>

        {!isLogin ? (
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-family">
              {t.familyName}
            </label>
            <input
              id="auth-family"
              className="auth-input"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              autoComplete="organization"
              placeholder={t.familyPlaceholder}
            />
          </div>
        ) : null}

        {error ? <p className="auth-error">{error}</p> : null}

        <button className="auth-submit" disabled={loading} type="submit">
          {loading ? t.authWorking : isLogin ? t.login : t.register}
        </button>
      </form>

      <p className="auth-switch">
        {isLogin ? t.noAccount : t.hasAccount}{" "}
        <Link href={isLogin ? "/register" : "/login"} className="auth-switch-link">
          {isLogin ? t.register : t.login}
        </Link>
      </p>
    </div>
  );
}

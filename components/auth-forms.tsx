"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "./brand-logo";
import { useI18n } from "./locale-provider";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 3l18 18M10.6 10.7a2 2 0 002.8 2.8M9.9 5.2A9.8 9.8 0 0112 5c5 0 9.3 3.1 11 7.5a12.3 12.3 0 01-4 5.1M6.1 6.1A12.4 12.4 0 001 12.5C2.7 16.9 7 20 12 20c1.6 0 3.1-.3 4.5-.9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M1 12.5C2.7 8.1 7 5 12 5s9.3 3.1 11 7.5C21.3 16.9 17 20 12 20S2.7 16.9 1 12.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  showPassword,
  onToggleVisibility,
  showLabel,
  hideLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  showPassword: boolean;
  onToggleVisibility: () => void;
  showLabel: string;
  hideLabel: string;
}) {
  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor={id}>
        {label}
      </label>
      <div className="auth-password-wrap">
        <input
          id={id}
          className="auth-input auth-input-password"
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={6}
          required
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={onToggleVisibility}
          aria-label={showPassword ? hideLabel : showLabel}
          aria-pressed={showPassword}
        >
          <EyeIcon open={showPassword} />
        </button>
      </div>
    </div>
  );
}

export function AuthForms({ mode }: { mode: "login" | "register" }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isLogin && password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, locale }),
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
      </div>

      <div className="auth-hero">
        <div className="auth-logo-wrap">
          <BrandLogo size="lg" title={t.appName} />
        </div>
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

        <PasswordField
          id="auth-password"
          label={t.password}
          value={password}
          onChange={setPassword}
          placeholder={t.passwordPlaceholder}
          autoComplete={isLogin ? "current-password" : "new-password"}
          showPassword={showPassword}
          onToggleVisibility={() => setShowPassword((v) => !v)}
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
        />

        {!isLogin ? (
          <PasswordField
            id="auth-confirm-password"
            label={t.confirmPassword}
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder={t.confirmPasswordPlaceholder}
            autoComplete="new-password"
            showPassword={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword((v) => !v)}
            showLabel={t.showPassword}
            hideLabel={t.hidePassword}
          />
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

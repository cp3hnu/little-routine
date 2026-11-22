"use client";

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
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
    <form onSubmit={onSubmit} className="card mx-auto w-full max-w-md space-y-4 p-6">
      <div>
        <label className="label">{t.phone}</label>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" required />
      </div>
      <div>
        <label className="label">{t.password}</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      {mode === "register" ? (
        <div>
          <label className="label">{t.familyName}</label>
          <input className="input" value={familyName} onChange={(e) => setFamilyName(e.target.value)} />
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="btn btn-primary w-full" disabled={loading} type="submit">
        {mode === "login" ? t.login : t.register}
      </button>
    </form>
  );
}

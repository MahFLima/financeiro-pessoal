"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve conter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Falha ao registrar conta.");
      }

      // Redireciona para o dashboard
      window.location.href = "/";
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Topo / Marca */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 font-black text-2xl text-white shadow-xl shadow-indigo-500/25">
            FP
          </div>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Criar Nova Conta
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Cadastre-se para gerenciar seus planos e finanças
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Nome Completo
              </label>
              <div className="mt-1.5">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                E-mail
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Senha
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Confirmar Senha
              </label>
              <div className="mt-1.5">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Criando conta…</span>
                </>
              ) : (
                <span>Criar Conta Gratuita</span>
              )}
            </button>
          </form>

          {/* Rodapé do Card */}
          <div className="mt-6 border-t border-slate-200/80 pt-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Já possui uma conta?{" "}
            <Link
              href="/login"
              className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

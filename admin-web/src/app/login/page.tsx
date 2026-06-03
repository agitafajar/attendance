"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  FileText,
  Lock,
  LoaderCircle,
  ShieldCheck,
  Users,
  User,
} from "lucide-react";
import { api } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const featureCards = [
  { label: "Role", value: "Scoped", Icon: Users },
  { label: "API", value: "Secured", Icon: Lock },
  { label: "Docs", value: "Private", Icon: FileText },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });
      saveAuthSession(data);
      router.push("/dashboard");
    } catch {
      setError("Email atau password tidak valid.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.86fr)_1.14fr]">
        <section className="relative hidden overflow-hidden border-r border-[var(--border)] bg-[radial-gradient(circle_at_65%_25%,rgba(254,236,65,0.28),transparent_30%),linear-gradient(145deg,#fff8f5_0%,#fff1ee_42%,#ffd9d9_100%)] text-[var(--foreground)] lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-24 -top-16 h-[520px] w-[520px] rounded-full border border-[var(--brand-500)]/18" />
          <div className="pointer-events-none absolute -right-8 -top-4 h-[420px] w-[420px] rounded-full border border-[var(--brand-700)]/12" />
          <div className="pointer-events-none absolute -right-40 bottom-8 h-80 w-80 rounded-full bg-[var(--brand-yellow)]/30 blur-3xl" />

          <div className="px-10 py-9">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[var(--brand-900)] text-white shadow-[var(--shadow-soft)]">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-[var(--foreground)]">
                  ALIH DAYA
                </p>
                <p className="text-sm text-[var(--muted)]">Attendance Admin</p>
              </div>
            </div>
          </div>

          <div className="relative px-10 pb-12">
            <div className="max-w-md">
              <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-white/60 px-3 py-2 text-sm font-medium text-[var(--brand-900)] shadow-sm backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                Production workspace
              </div>
              <h1 className="text-5xl font-semibold leading-[1.04] tracking-normal text-[var(--foreground)]">
                Kontrol operasional yang lebih tenang.
              </h1>
              <p className="mt-5 max-w-sm text-base leading-7 text-[var(--muted)]">
                Satu pintu untuk tim admin, supervisor, dan laporan harian.
              </p>
            </div>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
              {featureCards.map(({ label, value, Icon }) => (
                <div
                  key={label}
                  className="rounded-md border border-[var(--border)] bg-white/72 p-4 shadow-[var(--shadow-soft)] backdrop-blur"
                >
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--brand-900)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--brand-700)]">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(75,184,250,0.14),transparent_32%),var(--background)] px-5 py-8 sm:px-8">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--brand-900)] text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Alih Daya</p>
                  <p className="text-xs text-[var(--muted)]">Attendance Admin</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_80px_rgba(44,94,173,0.12)] sm:p-9">
              <div className="mb-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--brand-900)]">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-[var(--brand-700)]">
                  Selamat datang kembali
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-normal text-[var(--foreground)]">
                  Masuk ke dashboard
                </h2>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="admin@financialku.online"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-12 pl-11 shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 pl-11 pr-12 shadow-sm"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--brand-900)]"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--muted-strong)]">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                        rememberMe
                          ? "border-[var(--brand-900)] bg-[var(--brand-900)] text-white"
                          : "border-[var(--border-strong)] bg-white text-transparent"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="sr-only"
                    />
                    Ingat saya
                  </label>
                  <a
                    href="mailto:support@financialku.online"
                    className="text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-900)]"
                  >
                    Lupa password?
                  </a>
                </div>

                {error ? (
                  <div className="rounded-md border border-[var(--brand-500)]/30 bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--brand-900)]">
                    {error}
                  </div>
                ) : null}

                <Button
                  className="h-12 w-full bg-[var(--primary)] text-base text-white shadow-[0_16px_35px_rgba(44,94,173,0.24)] hover:bg-[var(--primary-hover)]"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {isSubmitting ? "Memproses..." : "Masuk"}
                </Button>
              </form>
            </div>

            <div className="mt-7 text-center text-xs leading-6 text-[var(--muted)]">
              <p>Alih Daya Attendance Admin</p>
              <p>© 2024 All rights reserved.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

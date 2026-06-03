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
  Lock,
  LoaderCircle,
  Users,
  User,
  BarChart3,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const features = [
  { Icon: Users, title: "Manajemen Tim", desc: "Klien, lokasi, shift, dan assignment tersusun jelas." },
  { Icon: Clock, title: "Absensi Real-time", desc: "Status kehadiran dan keterlambatan mudah dipantau." },
  { Icon: BarChart3, title: "Laporan Otomatis", desc: "Rekap operasional siap untuk review dan export." },
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
      <div className="grid min-h-screen lg:grid-cols-[1fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-[var(--brand-950)] lg:flex lg:flex-col lg:justify-between">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.55) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-teal-500/14 to-transparent" />

          <div className="relative z-10 px-12 py-8 xl:px-16">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[var(--brand-500)] text-white shadow-lg shadow-teal-950/30">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[15px] font-bold tracking-[0.18em] text-white">
                  ALIH DAYA
                </p>
                <p className="text-sm text-white/55">Attendance Admin</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 px-12 pb-10 xl:px-16">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white/82">
                <ShieldCheck className="h-4 w-4" />
                Secure operations console
              </div>

              <h1 className="max-w-[620px] text-[2.45rem] font-semibold leading-[1.08] tracking-normal text-white xl:text-[2.9rem]">
                Sistem absensi yang rapi untuk operasi harian.
              </h1>

              <p className="mt-4 max-w-lg text-base leading-7 text-white/62">
                Dashboard administrasi untuk melihat kehadiran, approval,
                aktivitas, dan laporan tanpa tampilan yang ramai.
              </p>

              <div className="mt-7 grid gap-2.5">
                {features.map(({ Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 rounded-lg border border-white/[0.08] bg-white/[0.04] p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-teal-200">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/52">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[440px]">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[var(--brand-700)] text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-[0.15em] text-[var(--foreground)]">
                  ALIH DAYA
                </p>
                <p className="text-xs text-[var(--muted)]">Attendance Admin</p>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-lg border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-card)] sm:p-9">
                <div className="mb-8">
                  <div className="mb-5 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--brand-700)]">
                    <Fingerprint className="h-7 w-7" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-normal text-[var(--foreground)]">
                    Selamat datang kembali
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Masuk ke dashboard untuk melanjutkan
                  </p>
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="admin@financialku.online"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-11 pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="mailto:support@financialku.online"
                        className="text-xs font-semibold text-[var(--brand-700)] transition-colors hover:text-[var(--primary-hover)]"
                      >
                        Lupa password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Masukkan password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-11 pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
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

                  <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-[var(--muted-strong)]">
                    <span
                      className={`flex h-[18px] w-[18px] items-center justify-center rounded-sm border transition-all ${
                        rememberMe
                          ? "border-[var(--brand-700)] bg-[var(--brand-700)] text-white"
                          : "border-[var(--border-strong)] bg-white text-transparent"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="sr-only"
                    />
                    Ingat saya
                  </label>

                  {error ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <Button
                    className="h-11 w-full"
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
            </div>

            <div className="mt-8 text-center text-xs text-[var(--muted)]">
              <p>Alih Daya Attendance Admin</p>
              <p className="mt-0.5">&copy; 2024 All rights reserved.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

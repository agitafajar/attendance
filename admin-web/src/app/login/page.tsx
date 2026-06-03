"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Fingerprint,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="min-h-screen bg-[#f4f1ea] text-[#18201d]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.86fr)_1.14fr]">
        <section className="hidden border-r border-[#d8d2c6] bg-[#17211d] text-white lg:flex lg:flex-col lg:justify-between">
          <div className="px-10 py-9">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#d7ff70] text-[#17211d]">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-[#d7ff70]">
                  ALIH DAYA
                </p>
                <p className="text-sm text-white/60">Attendance Admin</p>
              </div>
            </div>
          </div>

          <div className="px-10 pb-12">
            <div className="max-w-md">
              <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-white/12 bg-white/6 px-3 py-2 text-sm text-white/72">
                <ShieldCheck className="h-4 w-4 text-[#d7ff70]" />
                Production workspace
              </div>
              <h1 className="text-5xl font-semibold leading-[1.03] tracking-normal">
                Kontrol operasional yang lebih tenang.
              </h1>
              <p className="mt-5 max-w-sm text-base leading-7 text-white/64">
                Satu pintu untuk tim admin, supervisor, dan laporan harian.
              </p>
            </div>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
              {[
                ["Role", "Scoped"],
                ["API", "Secured"],
                ["Docs", "Private"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-md border border-white/10 bg-white/[0.055] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-white/38">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[430px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#17211d] text-[#d7ff70]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Alih Daya</p>
                  <p className="text-xs text-[#6f756d]">Attendance Admin</p>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-[#d9d2c4] bg-[#fffdf8] p-6 shadow-[0_24px_70px_rgba(38,30,17,0.12)] sm:p-8">
              <div className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-[#17211d] text-[#d7ff70]">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-[#667063]">Selamat datang</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[#17211d]">
                  Masuk ke dashboard
                </h2>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#252c28]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@perusahaan.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 border-[#cfc7b8] bg-white text-[#17211d] placeholder:text-[#9b9487] focus:border-[#197c68]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#252c28]">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 border-[#cfc7b8] bg-white pr-12 text-[#17211d] placeholder:text-[#9b9487] focus:border-[#197c68]"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[#667063] transition-colors hover:bg-[#f0eadf] hover:text-[#17211d]"
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

                {error ? (
                  <div className="rounded-md border border-[#f0b5a8] bg-[#fff1ee] px-3 py-2 text-sm text-[#9b2f1d]">
                    {error}
                  </div>
                ) : null}

                <Button
                  className="h-12 w-full bg-[#17211d] text-[15px] text-white hover:bg-[#26332d]"
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

            <p className="mt-5 text-center text-xs text-[#797264]">
              Alih Daya Attendance Admin
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

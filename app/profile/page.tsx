"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  Dumbbell,
  GraduationCap,
  Loader2,
  Mail,
  Save,
  School,
  User,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  school: string | null;
  role: string | null;
};

type Stats = {
  diagnosticCount: number;
  completedModuleCount: number;
  practiceCount: number;
  averagePracticeScore: number;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [role, setRole] = useState("student");

  const [stats, setStats] = useState<Stats>({
    diagnosticCount: 0,
    completedModuleCount: 0,
    practiceCount: 0,
    averagePracticeScore: 0,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");
    setMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/login";
      return;
    }

    setEmail(session.user.email ?? "");

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, school, role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    const { count: diagnosticCount } = await supabase
      .from("diagnostic_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id);

    const { count: completedModuleCount } = await supabase
      .from("module_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("is_read", true);

    const { data: practiceData } = await supabase
      .from("practice_attempts")
      .select("score")
      .eq("user_id", session.user.id);

    const practiceScores = practiceData ?? [];
    const averagePracticeScore =
      practiceScores.length > 0
        ? Math.round(
            practiceScores.reduce((sum, item) => {
              return sum + Number(item.score ?? 0);
            }, 0) / practiceScores.length
          )
        : 0;

    setProfile(profileData as Profile | null);
    setFullName(profileData?.full_name ?? "");
    setSchool(profileData?.school ?? "");
    setRole(profileData?.role ?? "student");

    setStats({
      diagnosticCount: diagnosticCount ?? 0,
      completedModuleCount: completedModuleCount ?? 0,
      practiceCount: practiceScores.length,
      averagePracticeScore,
    });

    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/login";
      return;
    }

    const { error: saveError } = await supabase.from("profiles").upsert(
      {
        id: session.user.id,
        full_name: fullName,
        school,
        role,
      },
      {
        onConflict: "id",
      }
    );

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setMessage("Profil berhasil diperbarui.");
    setSaving(false);
    loadProfile();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <Loader2 className="animate-spin text-cyan-300" />
          <p className="text-slate-300">Memuat profil...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-sm font-semibold text-cyan-300">Profile</p>
              <h1 className="mt-2 text-4xl font-bold">Profil Siswa</h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Kelola informasi akun dan lihat ringkasan aktivitas belajar.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Kembali ke Dashboard
            </Link>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Brain />}
            label="Tes Diagnostik"
            value={stats.diagnosticCount}
            description="Total tes yang dikerjakan"
          />

          <StatCard
            icon={<BookOpen />}
            label="Modul Selesai"
            value={stats.completedModuleCount}
            description="Materi yang sudah ditandai selesai"
          />

          <StatCard
            icon={<Dumbbell />}
            label="Latihan"
            value={stats.practiceCount}
            description="Total latihan selesai"
          />

          <StatCard
            icon={<GraduationCap />}
            label="Rata-rata Latihan"
            value={stats.averagePracticeScore}
            description="Skor rata-rata practice"
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-400 text-slate-950">
              <User size={38} />
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              {profile?.full_name || "Nama belum diisi"}
            </h2>

            <div className="mt-5 space-y-4 text-sm">
              <InfoRow icon={<Mail size={18} />} label="Email" value={email} />

              <InfoRow
                icon={<School size={18} />}
                label="Sekolah"
                value={profile?.school || "Belum diisi"}
              />

              <InfoRow
                icon={<GraduationCap size={18} />}
                label="Role"
                value={profile?.role || "student"}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
              <p className="text-sm font-semibold text-cyan-300">
                Catatan akun
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Email dan password dikelola oleh Supabase Auth. Halaman ini hanya
                mengubah data profil seperti nama, sekolah, dan role.
              </p>
            </div>
          </aside>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">Edit Profil</h2>
            <p className="mt-2 text-slate-400">
              Perbarui identitas siswa agar data di dashboard lebih rapi.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-300">
                  Nama Lengkap
                </label>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-300">
                  Sekolah
                </label>
                <input
                  value={school}
                  onChange={(event) => setSchool(event.target.value)}
                  placeholder="Masukkan nama sekolah"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-300">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="text-cyan-300">{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 break-all font-semibold text-slate-200">{value}</p>
      </div>
    </div>
  );
}
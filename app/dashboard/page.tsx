"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Brain,
  Clock3,
  Dumbbell,
  LogOut,
  Target,
  TrendingUp,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  full_name: string;
  role: string;
  school: string | null;
};

type DiagnosticAttempt = {
  id: string;
  total_score: number | string;
  created_at: string;
};

type TopicRelation =
  | {
      name: string;
      description?: string;
      order_index: number;
    }
  | {
      name: string;
      description?: string;
      order_index: number;
    }[]
  | null;

type ModuleRelation =
  | {
      id: string;
      title: string;
      slug: string;
      difficulty_label: string;
      physics_topics: TopicRelation;
    }
  | {
      id: string;
      title: string;
      slug: string;
      difficulty_label: string;
      physics_topics: TopicRelation;
    }[]
  | null;

type TopicScore = {
  id: string;
  topic_id: string;
  score: number | string;
  level: string;
  physics_topics: TopicRelation;
};

type LearningModule = {
  id: string;
  topic_id: string;
  slug: string;
  title: string;
  target_level: string;
  difficulty_label: string;
};

type PracticeAttempt = {
  id: string;
  module_id: string;
  score: number | string;
  correct_count: number;
  total_questions: number;
  created_at: string;
  learning_modules: ModuleRelation;
};

function getTopic(topic: TopicRelation) {
  if (!topic) {
    return {
      name: "Tanpa Topik",
      description: "",
      order_index: 999,
    };
  }

  if (Array.isArray(topic)) {
    return (
      topic[0] ?? {
        name: "Tanpa Topik",
        description: "",
        order_index: 999,
      }
    );
  }

  return topic;
}

function getModule(module: ModuleRelation) {
  if (!module) {
    return {
      id: "",
      title: "Modul tidak ditemukan",
      slug: "",
      difficulty_label: "",
      physics_topics: null,
    };
  }

  if (Array.isArray(module)) {
    return (
      module[0] ?? {
        id: "",
        title: "Modul tidak ditemukan",
        slug: "",
        difficulty_label: "",
        physics_topics: null,
      }
    );
  }

  return module;
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [latestAttempt, setLatestAttempt] = useState<DiagnosticAttempt | null>(
    null
  );
  const [topicScores, setTopicScores] = useState<TopicScore[]>([]);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [practiceAttempts, setPracticeAttempts] = useState<PracticeAttempt[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role, school")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        setMessage(profileError.message);
        setLoading(false);
        return;
      }

      const { data: attemptData, error: attemptError } = await supabase
        .from("diagnostic_attempts")
        .select("id, total_score, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (attemptError) {
        setMessage(attemptError.message);
        setLoading(false);
        return;
      }

      let scoresData: TopicScore[] = [];

      if (attemptData) {
        const { data, error } = await supabase
          .from("topic_scores")
          .select(`
            id,
            topic_id,
            score,
            level,
            physics_topics (
              name,
              description,
              order_index
            )
          `)
          .eq("attempt_id", attemptData.id);

        if (error) {
          setMessage(error.message);
          setLoading(false);
          return;
        }

        scoresData = (data ?? []) as TopicScore[];
      }

      const { data: moduleData, error: moduleError } = await supabase
        .from("learning_modules")
        .select(`
          id,
          topic_id,
          slug,
          title,
          target_level,
          difficulty_label
        `);

      if (moduleError) {
        setMessage(moduleError.message);
        setLoading(false);
        return;
      }

      const { data: practiceData, error: practiceError } = await supabase
        .from("practice_attempts")
        .select(`
          id,
          module_id,
          score,
          correct_count,
          total_questions,
          created_at,
          learning_modules (
            id,
            title,
            slug,
            difficulty_label,
            physics_topics (
              name,
              order_index
            )
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (practiceError) {
        setMessage(practiceError.message);
        setLoading(false);
        return;
      }

      setProfile(profileData as Profile | null);
      setLatestAttempt(attemptData as DiagnosticAttempt | null);
      setTopicScores(scoresData);
      setModules((moduleData ?? []) as LearningModule[]);
      setPracticeAttempts((practiceData ?? []) as PracticeAttempt[]);
      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  const sortedTopicScores = useMemo(() => {
    return [...topicScores].sort((a, b) => {
      return getTopic(a.physics_topics).order_index - getTopic(b.physics_topics).order_index;
    });
  }, [topicScores]);

  const weakestTopic = useMemo(() => {
    if (topicScores.length === 0) return null;

    return [...topicScores].sort((a, b) => {
      return toNumber(a.score) - toNumber(b.score);
    })[0];
  }, [topicScores]);

  const recommendedModules = useMemo(() => {
    const keys = new Set(
      topicScores.map((score) => `${score.topic_id}-${score.level}`)
    );

    return modules.filter((module) =>
      keys.has(`${module.topic_id}-${module.target_level}`)
    );
  }, [topicScores, modules]);

  const completedRecommendedModules = useMemo(() => {
    const recommendedIds = new Set(recommendedModules.map((module) => module.id));

    return new Set(
      practiceAttempts
        .filter((attempt) => recommendedIds.has(attempt.module_id))
        .map((attempt) => attempt.module_id)
    );
  }, [practiceAttempts, recommendedModules]);

  const averagePracticeScore = useMemo(() => {
    if (practiceAttempts.length === 0) return 0;

    const total = practiceAttempts.reduce((sum, attempt) => {
      return sum + toNumber(attempt.score);
    }, 0);

    return Number((total / practiceAttempts.length).toFixed(2));
  }, [practiceAttempts]);

  const learningProgress = useMemo(() => {
    if (recommendedModules.length === 0) return 0;

    return Math.round(
      (completedRecommendedModules.size / recommendedModules.length) * 100
    );
  }, [recommendedModules, completedRecommendedModules]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <p className="text-slate-300">Memuat dashboard...</p>
        </div>
      </main>
    );
  }

  if (message) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-red-400/30 bg-red-400/10 p-8">
          <h1 className="text-2xl font-bold text-red-200">Dashboard Error</h1>
          <p className="mt-3 text-red-100">{message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-cyan-300">Dashboard Siswa</p>
            <h1 className="mt-2 text-3xl font-bold">
              Halo, {profile?.full_name ?? "Siswa"}
            </h1>
            <p className="mt-2 text-slate-400">
              {profile?.school
                ? `Sekolah: ${profile.school}`
                : "Pantau hasil diagnostik, rekomendasi materi, latihan, dan progress belajar."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-red-400 hover:text-red-300"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {!latestAttempt && (
          <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
            <h2 className="text-xl font-bold text-cyan-300">
              Belum ada tes diagnostik
            </h2>
            <p className="mt-3 leading-7 text-slate-300">
              Kerjakan tes diagnostik dulu supaya sistem bisa mendeteksi gap
              akademik dan menyusun rekomendasi belajar.
            </p>

            <Link
              href="/diagnostic"
              className="mt-5 inline-block rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Mulai Tes Diagnostik
            </Link>
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            icon={<Brain />}
            title="Skor Diagnostik"
            value={latestAttempt ? `${toNumber(latestAttempt.total_score)}` : "-"}
            description={
              latestAttempt
                ? `Tes terakhir: ${formatDate(latestAttempt.created_at)}`
                : "Belum mengikuti tes"
            }
          />

          <DashboardCard
            icon={<Target />}
            title="Topik Terlemah"
            value={weakestTopic ? getTopic(weakestTopic.physics_topics).name : "-"}
            description={
              weakestTopic
                ? `${weakestTopic.level} • Skor ${toNumber(weakestTopic.score)}`
                : "Belum ada data topik"
            }
          />

          <DashboardCard
            icon={<BookOpen />}
            title="Modul Direkomendasikan"
            value={`${recommendedModules.length}`}
            description="Modul dipilih dari hasil gap terbaru."
          />

          <DashboardCard
            icon={<Dumbbell />}
            title="Latihan Selesai"
            value={`${practiceAttempts.length}`}
            description={`Rata-rata latihan: ${averagePracticeScore}`}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Progress Belajar</h2>
                <p className="mt-2 text-slate-400">
                  Dihitung dari modul rekomendasi yang sudah dikerjakan latihannya.
                </p>
              </div>

              <div className="text-right">
                <p className="text-4xl font-bold">{learningProgress}%</p>
                <p className="text-sm text-cyan-300">
                  {completedRecommendedModules.size}/{recommendedModules.length} modul
                </p>
              </div>
            </div>

            <div className="mt-6 h-4 rounded-full bg-slate-800">
              <div
                className="h-4 rounded-full bg-cyan-400"
                style={{ width: `${learningProgress}%` }}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/learn"
                className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Lihat Rekomendasi Belajar
              </Link>

              <Link
                href="/practice"
                className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
              >
                Latihan Adaptif
              </Link>

              <Link
                href="/diagnostic"
                className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
              >
                Ulangi Tes
              </Link>

              <Link
                href="/explore"
                className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
              >
                Explore Challenge
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <TrendingUp />
              </div>
              <div>
                <h2 className="text-xl font-bold">Roadmap</h2>
                <p className="text-sm text-slate-400">Alur belajar siswa</p>
              </div>
            </div>

            <div className="space-y-4">
              <RoadmapItem
                title="1. Tes Diagnostik"
                status={latestAttempt ? "Selesai" : "Belum"}
                active={!!latestAttempt}
              />
              <RoadmapItem
                title="2. Rekomendasi Materi"
                status={recommendedModules.length > 0 ? "Tersedia" : "Belum"}
                active={recommendedModules.length > 0}
              />
              <RoadmapItem
                title="3. Latihan Adaptif"
                status={practiceAttempts.length > 0 ? "Berjalan" : "Belum"}
                active={practiceAttempts.length > 0}
              />
              <RoadmapItem
                title="4. Progress Tracking"
                status={`${learningProgress}%`}
                active={learningProgress > 0}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <BarChart3 />
              </div>
              <div>
                <h2 className="text-xl font-bold">Skor Per Topik</h2>
                <p className="text-sm text-slate-400">
                  Hasil dari tes diagnostik terbaru
                </p>
              </div>
            </div>

            {sortedTopicScores.length === 0 ? (
              <p className="leading-7 text-slate-400">
                Belum ada skor topik. Kerjakan tes diagnostik terlebih dahulu.
              </p>
            ) : (
              <div className="space-y-4">
                {sortedTopicScores.map((score) => {
                  const topic = getTopic(score.physics_topics);
                  const numericScore = toNumber(score.score);

                  return (
                    <div
                      key={score.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{topic.name}</h3>
                          <p className="mt-1 text-sm text-cyan-300">
                            {score.level}
                          </p>
                        </div>
                        <p className="text-2xl font-bold">{numericScore}</p>
                      </div>

                      <div className="mt-4 h-3 rounded-full bg-slate-800">
                        <div
                          className="h-3 rounded-full bg-cyan-400"
                          style={{ width: `${numericScore}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <Clock3 />
              </div>
              <div>
                <h2 className="text-xl font-bold">Riwayat Latihan Terbaru</h2>
                <p className="text-sm text-slate-400">
                  5 latihan terakhir yang dikerjakan
                </p>
              </div>
            </div>

            {practiceAttempts.length === 0 ? (
              <div>
                <p className="leading-7 text-slate-400">
                  Belum ada latihan yang dikerjakan. Mulai latihan dari modul
                  rekomendasi.
                </p>

                <Link
                  href="/practice"
                  className="mt-5 inline-block rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  Mulai Latihan
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {practiceAttempts.map((attempt) => {
                  const module = getModule(attempt.learning_modules);
                  const topic = getTopic(module.physics_topics);

                  return (
                    <Link
                      key={attempt.id}
                      href={module.slug ? `/practice/${module.slug}` : "/practice"}
                      className="block rounded-2xl border border-slate-800 bg-slate-950 p-5 transition hover:border-cyan-400"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-cyan-300">{topic.name}</p>
                          <h3 className="mt-1 font-semibold">{module.title}</h3>
                          <p className="mt-1 text-sm text-slate-400">
                            {formatDate(attempt.created_at)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {toNumber(attempt.score)}
                          </p>
                          <p className="text-sm text-slate-400">
                            {attempt.correct_count}/{attempt.total_questions} benar
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>
      <p className="text-sm text-slate-400">{title}</p>
      <h2 className="mt-2 text-2xl font-bold">{value}</h2>
      <p className="mt-3 leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function RoadmapItem({
  title,
  status,
  active,
}: {
  title: string;
  status: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4">
      <p className="font-medium text-slate-200">{title}</p>
      <span
        className={`rounded-full px-4 py-1 text-sm ${
          active
            ? "bg-cyan-400/10 text-cyan-300"
            : "bg-slate-800 text-slate-400"
        }`}
      >
        {status}
      </span>
    </div>
  );
}
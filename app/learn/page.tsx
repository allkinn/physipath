"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { supabase } from "../../lib/supabase";

type TopicRelation =
  | {
      name: string;
      order_index: number;
    }
  | {
      name: string;
      order_index: number;
    }[]
  | null;

type TopicScore = {
  id: string;
  topic_id: string;
  score: number;
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
  summary: string;
  order_index: number;
  physics_topics: TopicRelation;
};

function getTopicName(topic: TopicRelation) {
  if (!topic) return "Tanpa Topik";
  if (Array.isArray(topic)) return topic[0]?.name ?? "Tanpa Topik";
  return topic.name;
}

function getTopicOrder(topic: TopicRelation) {
  if (!topic) return 999;
  if (Array.isArray(topic)) return topic[0]?.order_index ?? 999;
  return topic.order_index;
}

export default function LearnPage() {
  const router = useRouter();

  const [scores, setScores] = useState<TopicScore[]>([]);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadLearningRecommendations() {
      setLoading(true);
      setMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: latestAttempt, error: attemptError } = await supabase
        .from("diagnostic_attempts")
        .select("id, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (attemptError || !latestAttempt) {
        setMessage(
          "Belum ada hasil tes diagnostik. Kerjakan tes dulu agar sistem bisa memberi rekomendasi."
        );
        setLoading(false);
        return;
      }

      const { data: scoreData, error: scoreError } = await supabase
        .from("topic_scores")
        .select(
          `
          id,
          topic_id,
          score,
          level,
          physics_topics (
            name,
            order_index
          )
        `
        )
        .eq("attempt_id", latestAttempt.id);

      if (scoreError || !scoreData) {
        setMessage(scoreError?.message || "Gagal mengambil skor topik.");
        setLoading(false);
        return;
      }

      const { data: moduleData, error: moduleError } = await supabase
        .from("learning_modules")
        .select(
          `
          id,
          topic_id,
          slug,
          title,
          target_level,
          difficulty_label,
          summary,
          order_index,
          physics_topics (
            name,
            order_index
          )
        `
        );

      if (moduleError || !moduleData) {
        setMessage(moduleError?.message || "Gagal mengambil modul belajar.");
        setLoading(false);
        return;
      }

      const { data: progressData, error: progressError } = await supabase
        .from("module_progress")
        .select("module_id")
        .eq("user_id", session.user.id)
        .eq("is_read", true);

      if (progressError) {
        setMessage(progressError.message);
        setLoading(false);
        return;
      }

      setScores(scoreData as TopicScore[]);
      setModules(moduleData as LearningModule[]);
      setCompletedModuleIds((progressData ?? []).map((item) => item.module_id));
      setLoading(false);
    }

    loadLearningRecommendations();
  }, [router]);

  const recommendedModules = useMemo(() => {
    const scoreMap = new Map(scores.map((score) => [score.topic_id, score]));
    const recommendationKeys = new Set(
      scores.map((score) => `${score.topic_id}-${score.level}`)
    );

    return modules
      .filter((module) =>
        recommendationKeys.has(`${module.topic_id}-${module.target_level}`)
      )
      .sort((a, b) => {
        const scoreA = scoreMap.get(a.topic_id)?.score ?? 999;
        const scoreB = scoreMap.get(b.topic_id)?.score ?? 999;

        if (scoreA !== scoreB) return scoreA - scoreB;

        return (
          getTopicOrder(a.physics_topics) - getTopicOrder(b.physics_topics)
        );
      });
  }, [scores, modules]);

  const weakestTopic = useMemo(() => {
    if (scores.length === 0) return null;

    return [...scores].sort((a, b) => a.score - b.score)[0];
  }, [scores]);

  const completedRecommendedCount = useMemo(() => {
    return recommendedModules.filter((module) =>
      completedModuleIds.includes(module.id)
    ).length;
  }, [recommendedModules, completedModuleIds]);

  const progressPercentage =
    recommendedModules.length > 0
      ? Math.round((completedRecommendedCount / recommendedModules.length) * 100)
      : 0;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <p className="text-slate-300">Menyusun rekomendasi belajar...</p>
        </div>
      </main>
    );
  }

  if (message) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="text-2xl font-bold">Rekomendasi belum tersedia</h1>
          <p className="mt-3 leading-7 text-slate-400">{message}</p>

          <Link
            href="/diagnostic"
            className="mt-6 inline-block rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Mulai Tes Diagnostik
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-cyan-300">
              Adaptive Learning
            </p>
            <h1 className="mt-2 text-3xl font-bold">Rekomendasi Belajar</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-400">
              Modul di bawah dipilih berdasarkan hasil tes diagnostik terbaru.
              Prioritas belajar dimulai dari topik dengan skor paling rendah.
            </p>
          </div>

          <Link
            href="/diagnostic"
            className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
          >
            Ulangi Tes
          </Link>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-sm text-slate-400">Progress Materi Rekomendasi</p>
              <h2 className="mt-2 text-2xl font-bold">
                {completedRecommendedCount} dari {recommendedModules.length} modul selesai
              </h2>
              <p className="mt-2 text-slate-400">
                Tandai modul selesai setelah membaca materi pembelajaran.
              </p>
            </div>

            <div className="text-right">
              <p className="text-4xl font-bold text-cyan-300">
                {progressPercentage}%
              </p>
              <p className="mt-1 text-sm text-slate-500">completed</p>
            </div>
          </div>

          <div className="mt-5 h-3 rounded-full bg-slate-800">
            <div
              className="h-3 rounded-full bg-cyan-400 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {weakestTopic && (
          <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
            <p className="text-sm text-cyan-300">Prioritas Belajar Utama</p>
            <h2 className="mt-2 text-2xl font-bold">
              {getTopicName(weakestTopic.physics_topics)}
            </h2>
            <p className="mt-3 leading-7 text-slate-300">
              Skor topik ini adalah {weakestTopic.score} dengan status{" "}
              <span className="font-semibold text-cyan-300">
                {weakestTopic.level}
              </span>
              . Sistem menyarankan topik ini dikerjakan lebih dulu.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {recommendedModules.map((module) => {
            const isCompleted = completedModuleIds.includes(module.id);

            return (
              <Link
                key={module.id}
                href={`/learn/${module.slug}`}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
                    {getTopicName(module.physics_topics)}
                  </span>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm font-semibold text-emerald-300">
                      <CheckCircle2 size={15} />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-1 text-sm font-semibold text-slate-400">
                      <Circle size={14} />
                      Belum selesai
                    </span>
                  )}
                </div>

                <div className="mb-4 flex flex-wrap gap-3">
                  <span className="rounded-full bg-slate-800 px-4 py-1 text-sm text-slate-300">
                    {module.difficulty_label}
                  </span>
                  <span className="rounded-full bg-slate-800 px-4 py-1 text-sm text-slate-300">
                    {module.target_level}
                  </span>
                </div>

                <h2 className="text-xl font-bold">{module.title}</h2>
                <p className="mt-3 leading-7 text-slate-400">
                  {module.summary}
                </p>

                <p className="mt-5 text-sm font-semibold text-cyan-300">
                  {isCompleted ? "Buka Ulang Modul →" : "Buka Modul →"}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">Semua Skor Topik</h2>

          <div className="mt-5 grid gap-4">
            {[...scores]
              .sort(
                (a, b) =>
                  getTopicOrder(a.physics_topics) -
                  getTopicOrder(b.physics_topics)
              )
              .map((score) => (
                <div
                  key={score.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {getTopicName(score.physics_topics)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {score.level}
                      </p>
                    </div>
                    <p className="text-2xl font-bold">{score.score}</p>
                  </div>

                  <div className="mt-4 h-3 rounded-full bg-slate-800">
                    <div
                      className="h-3 rounded-full bg-cyan-400"
                      style={{ width: `${score.score}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </main>
  );
}
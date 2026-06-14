"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function PracticePage() {
  const router = useRouter();

  const [scores, setScores] = useState<TopicScore[]>([]);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPracticeRecommendations() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: latestAttempt, error: attemptError } = await supabase
        .from("diagnostic_attempts")
        .select("id, total_score, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (attemptError || !latestAttempt) {
        setMessage("Belum ada hasil tes diagnostik. Kerjakan tes dulu sebelum latihan adaptif.");
        setLoading(false);
        return;
      }

      const { data: scoreData, error: scoreError } = await supabase
        .from("topic_scores")
        .select(`
          id,
          topic_id,
          score,
          level,
          physics_topics (
            name,
            order_index
          )
        `)
        .eq("attempt_id", latestAttempt.id);

      if (scoreError || !scoreData) {
        setMessage(scoreError?.message || "Gagal mengambil skor topik.");
        setLoading(false);
        return;
      }

      const { data: moduleData, error: moduleError } = await supabase
        .from("learning_modules")
        .select(`
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
        `);

      if (moduleError || !moduleData) {
        setMessage(moduleError?.message || "Gagal mengambil modul.");
        setLoading(false);
        return;
      }

      setScores(scoreData as TopicScore[]);
      setModules(moduleData as LearningModule[]);
      setLoading(false);
    }

    loadPracticeRecommendations();
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

        return getTopicOrder(a.physics_topics) - getTopicOrder(b.physics_topics);
      });
  }, [scores, modules]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <p className="text-slate-300">Menyusun latihan adaptif...</p>
        </div>
      </main>
    );
  }

  if (message) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="text-2xl font-bold">Latihan belum tersedia</h1>
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
        <div>
          <p className="text-sm font-semibold text-cyan-300">Adaptive Practice</p>
          <h1 className="mt-2 text-3xl font-bold">Latihan Soal Adaptif</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            Latihan ini dipilih berdasarkan hasil diagnostik terbaru. Kerjakan dari
            topik dengan skor terendah dulu.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {recommendedModules.map((module) => {
            const relatedScore = scores.find(
              (score) => score.topic_id === module.topic_id
            );

            return (
              <Link
                key={module.id}
                href={`/practice/${module.slug}`}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
                    {getTopicName(module.physics_topics)}
                  </span>

                  <span className="rounded-full bg-slate-800 px-4 py-1 text-sm text-slate-300">
                    {module.difficulty_label}
                  </span>
                </div>

                <h2 className="text-xl font-bold">{module.title}</h2>
                <p className="mt-3 leading-7 text-slate-400">{module.summary}</p>

                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Skor diagnostik topik</p>
                  <p className="mt-1 text-2xl font-bold">
                    {relatedScore?.score ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-cyan-300">
                    {relatedScore?.level}
                  </p>
                </div>

                <p className="mt-5 text-sm font-semibold text-cyan-300">
                  Mulai Latihan →
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
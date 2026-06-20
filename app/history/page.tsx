"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Brain,
  Clock,
  Dumbbell,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type DiagnosticAttempt = {
  id: string;
  score: number;
  total_questions: number;
  correct_count: number;
  created_at: string;
};

type TopicRelation = { name: string } | { name: string }[] | null;

type TopicScore = {
  id: string;
  attempt_id: string;
  score: number;
  level: string;
  physics_topics: TopicRelation;
};

type ModuleRelation =
  | {
      title: string;
      physics_topics: TopicRelation;
    }
  | {
      title: string;
      physics_topics: TopicRelation;
    }[]
  | null;

type PracticeAttempt = {
  id: string;
  score: number;
  correct_count: number;
  total_questions: number;
  created_at: string;
  learning_modules: ModuleRelation;
};

type ChallengeRelation = { title: string } | { title: string }[] | null;

type ExploreSubmission = {
  id: string;
  problem_solving_score: number;
  critical_thinking_score: number;
  communication_score: number;
  creativity_score: number;
  created_at: string;
  explore_challenges: ChallengeRelation;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTopicName(topic: TopicRelation) {
  if (!topic) return "Topik tidak diketahui";
  if (Array.isArray(topic)) return topic[0]?.name ?? "Topik tidak diketahui";
  return topic.name;
}

function getModuleTitle(module: ModuleRelation) {
  if (!module) return "Modul tidak diketahui";
  if (Array.isArray(module)) return module[0]?.title ?? "Modul tidak diketahui";
  return module.title;
}

function getModuleTopic(module: ModuleRelation) {
  if (!module) return "Topik tidak diketahui";
  if (Array.isArray(module)) return getTopicName(module[0]?.physics_topics ?? null);
  return getTopicName(module.physics_topics);
}

function getChallengeTitle(challenge: ChallengeRelation) {
  if (!challenge) return "Challenge tidak diketahui";
  if (Array.isArray(challenge)) return challenge[0]?.title ?? "Challenge tidak diketahui";
  return challenge.title;
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticAttempt[]>([]);
  const [topicScores, setTopicScores] = useState<TopicScore[]>([]);
  const [practices, setPractices] = useState<PracticeAttempt[]>([]);
  const [explores, setExplores] = useState<ExploreSubmission[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/login";
      return;
    }

    const { data: diagnosticData, error: diagnosticError } = await supabase
      .from("diagnostic_attempts")
      .select("id, score, total_questions, correct_count, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (diagnosticError) {
      setError(diagnosticError.message);
      setLoading(false);
      return;
    }

    const diagnosticIds = (diagnosticData ?? []).map((item) => item.id);

    let topicScoreData: TopicScore[] = [];

    if (diagnosticIds.length > 0) {
      const { data, error } = await supabase
        .from("topic_scores")
        .select(
          `
          id,
          attempt_id,
          score,
          level,
          physics_topics (
            name
          )
        `
        )
        .in("attempt_id", diagnosticIds);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      topicScoreData = (data ?? []) as TopicScore[];
    }

    const { data: practiceData, error: practiceError } = await supabase
      .from("practice_attempts")
      .select(
        `
        id,
        score,
        correct_count,
        total_questions,
        created_at,
        learning_modules (
          title,
          physics_topics (
            name
          )
        )
      `
      )
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (practiceError) {
      setError(practiceError.message);
      setLoading(false);
      return;
    }

    const { data: exploreData, error: exploreError } = await supabase
      .from("explore_submissions")
      .select(
        `
        id,
        problem_solving_score,
        critical_thinking_score,
        communication_score,
        creativity_score,
        created_at,
        explore_challenges (
          title
        )
      `
      )
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (exploreError) {
      setError(exploreError.message);
      setLoading(false);
      return;
    }

    setDiagnostics((diagnosticData ?? []) as DiagnosticAttempt[]);
    setTopicScores(topicScoreData);
    setPractices((practiceData ?? []) as PracticeAttempt[]);
    setExplores((exploreData ?? []) as ExploreSubmission[]);
    setLoading(false);
  }

  function getScoresForAttempt(attemptId: string) {
    return topicScores.filter((item) => item.attempt_id === attemptId);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <Loader2 className="animate-spin text-cyan-300" />
          <p className="text-slate-300">Memuat riwayat belajar...</p>
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
              <p className="text-sm font-semibold text-cyan-300">History</p>
              <h1 className="mt-2 text-4xl font-bold">Riwayat Belajar</h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Halaman ini menampilkan riwayat tes diagnostik, latihan adaptif,
                dan explore challenge yang sudah dikerjakan.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Kembali ke Dashboard
            </Link>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <SummaryCard
            icon={<Brain />}
            title="Tes Diagnostik"
            value={diagnostics.length}
            description="Jumlah tes yang sudah dikerjakan"
          />
          <SummaryCard
            icon={<Dumbbell />}
            title="Latihan"
            value={practices.length}
            description="Jumlah latihan adaptif selesai"
          />
          <SummaryCard
            icon={<Lightbulb />}
            title="Explore"
            value={explores.length}
            description="Jumlah challenge yang dikirim"
          />
        </div>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex items-center gap-3">
            <Brain className="text-cyan-300" />
            <h2 className="text-2xl font-bold">Riwayat Tes Diagnostik</h2>
          </div>

          {diagnostics.length === 0 ? (
            <EmptyState
              title="Belum ada tes diagnostik."
              description="Kerjakan tes diagnostik terlebih dahulu agar sistem bisa memetakan kemampuan awalmu."
              href="/diagnostic"
              button="Mulai Tes Diagnostik"
            />
          ) : (
            <div className="space-y-4">
              {diagnostics.map((attempt, index) => {
                const scores = getScoresForAttempt(attempt.id);

                return (
                  <div
                    key={attempt.id}
                    className="rounded-3xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-500">
                          Tes #{diagnostics.length - index}
                        </p>
                        <h3 className="mt-1 text-xl font-bold">
                          Skor {attempt.score}
                        </h3>
                        <p className="mt-2 text-sm text-slate-400">
                          Benar {attempt.correct_count} dari{" "}
                          {attempt.total_questions} soal
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock size={16} />
                        {formatDate(attempt.created_at)}
                      </div>
                    </div>

                    {scores.length > 0 && (
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {scores.map((score) => (
                          <div
                            key={score.id}
                            className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                          >
                            <p className="font-semibold">
                              {getTopicName(score.physics_topics)}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                              Skor {score.score} • {score.level}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-5">
                      <Link
                        href={`/result?attempt=${attempt.id}`}
                        className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                      >
                        Lihat detail hasil →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex items-center gap-3">
            <Dumbbell className="text-cyan-300" />
            <h2 className="text-2xl font-bold">Riwayat Latihan</h2>
          </div>

          {practices.length === 0 ? (
            <EmptyState
              title="Belum ada latihan."
              description="Buka halaman Practice untuk mengerjakan latihan berdasarkan rekomendasi sistem."
              href="/practice"
              button="Mulai Latihan"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {practices.map((practice) => (
                <div
                  key={practice.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="mb-4 flex items-center gap-3 text-cyan-300">
                    <BookOpen size={20} />
                    <p className="text-sm font-semibold">
                      {getModuleTopic(practice.learning_modules)}
                    </p>
                  </div>

                  <h3 className="text-lg font-bold">
                    {getModuleTitle(practice.learning_modules)}
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    Benar {practice.correct_count} dari {practice.total_questions} soal
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-3xl font-bold text-cyan-300">
                      {practice.score}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDate(practice.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex items-center gap-3">
            <Lightbulb className="text-cyan-300" />
            <h2 className="text-2xl font-bold">Riwayat Explore Challenge</h2>
          </div>

          {explores.length === 0 ? (
            <EmptyState
              title="Belum ada explore challenge."
              description="Coba challenge berbasis masalah nyata untuk melatih soft skill."
              href="/explore"
              button="Mulai Explore"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {explores.map((item) => {
                const average = Math.round(
                  (item.problem_solving_score +
                    item.critical_thinking_score +
                    item.communication_score +
                    item.creativity_score) /
                    4
                );

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <h3 className="text-lg font-bold">
                      {getChallengeTitle(item.explore_challenges)}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      {formatDate(item.created_at)}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <ScoreBox label="Problem Solving" value={item.problem_solving_score} />
                      <ScoreBox label="Critical Thinking" value={item.critical_thinking_score} />
                      <ScoreBox label="Communication" value={item.communication_score} />
                      <ScoreBox label="Creativity" value={item.creativity_score} />
                    </div>

                    <div className="mt-5 rounded-2xl bg-cyan-400/10 p-4">
                      <p className="text-sm text-slate-400">Rata-rata</p>
                      <p className="mt-1 text-3xl font-bold text-cyan-300">
                        {average}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function EmptyState({
  title,
  description,
  href,
  button,
}: {
  title: string;
  description: string;
  href: string;
  button: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
      <BarChart3 className="mx-auto text-slate-500" size={36} />
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl leading-7 text-slate-400">
        {description}
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
      >
        {button}
      </Link>
    </div>
  );
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-cyan-300">{value}</p>
    </div>
  );
}
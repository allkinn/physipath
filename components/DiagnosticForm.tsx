"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export type DiagnosticQuestion = {
  id: string;
  code: string;
  topic_id: string;
  topic_name: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: string;
};

type SelectedAnswers = Record<string, string>;

export default function DiagnosticForm({
  questions,
}: {
  questions: DiagnosticQuestion[];
}) {
  const router = useRouter();

  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function handleSelect(questionId: string, answer: string) {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    setMessage("");

    if (Object.keys(selectedAnswers).length !== questions.length) {
      setMessage("Semua soal wajib dijawab dulu sebelum submit.");
      setLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setMessage("Lu harus login dulu sebelum submit tes.");
      setLoading(false);
      router.push("/login");
      return;
    }

    const answers = questions.map((question) => ({
      questionId: question.id,
      selectedAnswer: selectedAnswers[question.id],
    }));

    const response = await fetch("/api/diagnostic/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ answers }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal submit jawaban.");
      setLoading(false);
      return;
    }

    router.push(`/result?attempt=${result.attemptId}`);
  }

  return (
    <div>
      {message && (
        <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {message}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {questions.map((item, index) => (
          <div
            key={item.id}
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
                {item.topic_name}
              </span>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-800 px-4 py-1 text-sm text-slate-300">
                  {item.difficulty}
                </span>
                <span className="text-sm text-slate-400">Soal {index + 1}</span>
              </div>
            </div>

            <h2 className="text-lg font-semibold leading-8">
              {item.question_text}
            </h2>

            <div className="mt-5 grid gap-3">
              <AnswerOption
                questionId={item.id}
                value="A"
                label={item.option_a}
                selectedAnswers={selectedAnswers}
                onSelect={handleSelect}
              />
              <AnswerOption
                questionId={item.id}
                value="B"
                label={item.option_b}
                selectedAnswers={selectedAnswers}
                onSelect={handleSelect}
              />
              <AnswerOption
                questionId={item.id}
                value="C"
                label={item.option_c}
                selectedAnswers={selectedAnswers}
                onSelect={handleSelect}
              />
              <AnswerOption
                questionId={item.id}
                value="D"
                label={item.option_d}
                selectedAnswers={selectedAnswers}
                onSelect={handleSelect}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          Terjawab: {Object.keys(selectedAnswers).length} / {questions.length} soal
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Menghitung hasil..." : "Submit Jawaban"}
        </button>
      </div>
    </div>
  );
}

function AnswerOption({
  questionId,
  value,
  label,
  selectedAnswers,
  onSelect,
}: {
  questionId: string;
  value: string;
  label: string;
  selectedAnswers: SelectedAnswers;
  onSelect: (questionId: string, answer: string) => void;
}) {
  const isSelected = selectedAnswers[questionId] === value;

  return (
    <button
      type="button"
      onClick={() => onSelect(questionId, value)}
      className={`rounded-2xl border px-4 py-3 text-left transition ${
        isSelected
          ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
          : "border-slate-700 bg-slate-950 text-slate-200 hover:border-cyan-400"
      }`}
    >
      {value}. {label}
    </button>
  );
}
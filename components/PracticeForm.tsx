"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export type PracticeQuestion = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  order_index: number;
};

type PracticeModule = {
  id: string;
  title: string;
  slug: string;
};

type SelectedAnswers = Record<string, string>;

type PracticeResultItem = {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
};

type PracticeResult = {
  attemptId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  results: PracticeResultItem[];
};

type AiTutorState = Record<
  string,
  {
    loading: boolean;
    content: string;
    error: string;
  }
>;

export default function PracticeForm({
  module,
  questions,
}: {
  module: PracticeModule;
  questions: PracticeQuestion[];
}) {
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [aiTutor, setAiTutor] = useState<AiTutorState>({});

  function handleSelect(questionId: string, answer: string) {
    if (result) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    setMessage("");

    if (questions.length === 0) {
      setMessage("Belum ada soal latihan untuk modul ini.");
      setLoading(false);
      return;
    }

    if (Object.keys(selectedAnswers).length !== questions.length) {
      setMessage("Semua soal latihan wajib dijawab dulu.");
      setLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setMessage("Lu harus login dulu sebelum submit latihan.");
      setLoading(false);
      return;
    }

    const answers = questions.map((question) => ({
      questionId: question.id,
      selectedAnswer: selectedAnswers[question.id],
    }));

    const response = await fetch("/api/practice/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        moduleId: module.id,
        answers,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Gagal submit latihan.");
      setLoading(false);
      return;
    }

    setResult(data as PracticeResult);
    setLoading(false);
  }

  async function askAiTutor(questionId: string) {
    if (!result) return;

    setAiTutor((prev) => ({
      ...prev,
      [questionId]: {
        loading: true,
        content: prev[questionId]?.content ?? "",
        error: "",
      },
    }));

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setAiTutor((prev) => ({
        ...prev,
        [questionId]: {
          loading: false,
          content: "",
          error: "Lu harus login dulu untuk memakai AI Tutor.",
        },
      }));
      return;
    }

    const response = await fetch("/api/ai/tutor-explanation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        attemptId: result.attemptId,
        questionId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setAiTutor((prev) => ({
        ...prev,
        [questionId]: {
          loading: false,
          content: "",
          error: data.error || "Gagal mengambil penjelasan AI.",
        },
      }));
      return;
    }

    setAiTutor((prev) => ({
      ...prev,
      [questionId]: {
        loading: false,
        content: data.content,
        error: "",
      },
    }));
  }

  function getResultForQuestion(questionId: string) {
    return result?.results.find((item) => item.questionId === questionId);
  }

  return (
    <div>
      {message && (
        <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {message}
        </div>
      )}

      {result && (
        <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
          <p className="text-sm text-cyan-300">Hasil Latihan</p>
          <h2 className="mt-2 text-5xl font-bold">{result.score}</h2>
          <p className="mt-3 text-slate-300">
            Benar {result.correctCount} dari {result.totalQuestions} soal.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Kembali ke Dashboard
            </Link>

            <Link
              href="/practice"
              className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
            >
              Latihan Lainnya
            </Link>

            <Link
              href="/learn"
              className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
            >
              Kembali ke Materi
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-6">
        {questions.map((question, index) => {
          const itemResult = getResultForQuestion(question.id);
          const tutorState = aiTutor[question.id];

          return (
            <div
              key={question.id}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
                  Soal Latihan {index + 1}
                </span>

                {itemResult && (
                  <span
                    className={`rounded-full px-4 py-1 text-sm ${
                      itemResult.isCorrect
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-red-400/10 text-red-300"
                    }`}
                  >
                    {itemResult.isCorrect ? "Benar" : "Salah"}
                  </span>
                )}
              </div>

              <h2 className="text-lg font-semibold leading-8">
                {question.question_text}
              </h2>

              <div className="mt-5 grid gap-3">
                <AnswerOption
                  questionId={question.id}
                  value="A"
                  label={question.option_a}
                  selectedAnswers={selectedAnswers}
                  onSelect={handleSelect}
                  result={itemResult}
                />

                <AnswerOption
                  questionId={question.id}
                  value="B"
                  label={question.option_b}
                  selectedAnswers={selectedAnswers}
                  onSelect={handleSelect}
                  result={itemResult}
                />

                <AnswerOption
                  questionId={question.id}
                  value="C"
                  label={question.option_c}
                  selectedAnswers={selectedAnswers}
                  onSelect={handleSelect}
                  result={itemResult}
                />

                <AnswerOption
                  questionId={question.id}
                  value="D"
                  label={question.option_d}
                  selectedAnswers={selectedAnswers}
                  onSelect={handleSelect}
                  result={itemResult}
                />
              </div>

              {itemResult && (
                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">
                    Jawaban benar:{" "}
                    <span className="font-semibold text-cyan-300">
                      {itemResult.correctAnswer}
                    </span>
                  </p>
                  <p className="mt-2 leading-7 text-slate-300">
                    {itemResult.explanation}
                  </p>

                  <button
                    type="button"
                    onClick={() => askAiTutor(question.id)}
                    disabled={tutorState?.loading}
                    className="mt-5 rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {tutorState?.loading
                      ? "AI sedang menjelaskan..."
                      : tutorState?.content
                        ? "Muat Ulang AI Tutor"
                        : "Tanya AI Tutor"}
                  </button>

                  {tutorState?.error && (
                    <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
                      {tutorState.error}
                    </div>
                  )}

                  {tutorState?.content && (
                    <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                      <p className="text-sm font-semibold text-cyan-300">
                        Penjelasan AI Tutor
                      </p>
                      <div className="mt-3 whitespace-pre-line leading-8 text-slate-300">
                        {tutorState.content}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!result && (
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
            {loading ? "Mengoreksi..." : "Submit Latihan"}
          </button>
        </div>
      )}
    </div>
  );
}

function AnswerOption({
  questionId,
  value,
  label,
  selectedAnswers,
  onSelect,
  result,
}: {
  questionId: string;
  value: string;
  label: string;
  selectedAnswers: SelectedAnswers;
  onSelect: (questionId: string, answer: string) => void;
  result?: PracticeResultItem;
}) {
  const isSelected = selectedAnswers[questionId] === value;
  const isCorrectAnswer = result?.correctAnswer === value;
  const isWrongSelected = result && isSelected && !result.isCorrect;

  let className =
    "rounded-2xl border px-4 py-3 text-left transition border-slate-700 bg-slate-950 text-slate-200 hover:border-cyan-400";

  if (isSelected && !result) {
    className =
      "rounded-2xl border px-4 py-3 text-left transition border-cyan-400 bg-cyan-400/10 text-cyan-200";
  }

  if (result && isCorrectAnswer) {
    className =
      "rounded-2xl border px-4 py-3 text-left transition border-emerald-400 bg-emerald-400/10 text-emerald-200";
  }

  if (isWrongSelected) {
    className =
      "rounded-2xl border px-4 py-3 text-left transition border-red-400 bg-red-400/10 text-red-200";
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(questionId, value)}
      disabled={!!result}
      className={className}
    >
      {value}. {label}
    </button>
  );
}
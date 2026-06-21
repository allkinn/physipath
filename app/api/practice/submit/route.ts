import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

type SubmittedAnswer = {
  questionId: string;
  selectedAnswer: "A" | "B" | "C" | "D";
};

type PracticeQuestionFromDatabase = {
  id: string;
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
};

function isValidAnswer(answer: unknown): answer is "A" | "B" | "C" | "D" {
  return answer === "A" || answer === "B" || answer === "C" || answer === "D";
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json(
        { error: "Supabase env belum lengkap." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization) {
      return Response.json(
        { error: "Authorization token tidak ditemukan. Login dulu." },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        { error: "Session tidak valid. Login ulang dulu." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const moduleId = body.moduleId as string;
    const answers = body.answers as SubmittedAnswer[];

    if (!moduleId) {
      return Response.json(
        { error: "Module ID tidak ditemukan." },
        { status: 400 }
      );
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return Response.json(
        { error: "Jawaban kosong atau format jawaban salah." },
        { status: 400 }
      );
    }

    const invalidAnswer = answers.find(
      (item) => !item.questionId || !isValidAnswer(item.selectedAnswer)
    );

    if (invalidAnswer) {
      return Response.json(
        { error: "Ada jawaban yang formatnya tidak valid." },
        { status: 400 }
      );
    }

    const questionIds = answers.map((item) => item.questionId);

    const { data: questionData, error: questionError } = await supabaseAdmin
      .from("practice_questions")
      .select("id, correct_answer, explanation")
      .eq("module_id", moduleId)
      .in("id", questionIds);

    if (questionError || !questionData) {
      return Response.json(
        { error: questionError?.message || "Gagal mengambil kunci jawaban." },
        { status: 500 }
      );
    }

    const questions = questionData as PracticeQuestionFromDatabase[];

    if (questions.length !== answers.length) {
      return Response.json(
        { error: "Jumlah soal dari database tidak cocok dengan jawaban." },
        { status: 400 }
      );
    }

    const questionMap = new Map(
      questions.map((question) => [question.id, question])
    );

    const evaluatedAnswers = answers.map((answer) => {
      const question = questionMap.get(answer.questionId);

      if (!question) {
        throw new Error("Ada questionId yang tidak ditemukan.");
      }

      const isCorrect = answer.selectedAnswer === question.correct_answer;

      return {
        question_id: answer.questionId,
        selected_answer: answer.selectedAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        explanation: question.explanation,
      };
    });

    const correctCount = evaluatedAnswers.filter((item) => item.is_correct).length;
    const totalQuestions = evaluatedAnswers.length;
    const score = Number(((correctCount / totalQuestions) * 100).toFixed(2));

    const { data: attempt, error: attemptError } = await supabase
      .from("practice_attempts")
      .insert({
        user_id: user.id,
        module_id: moduleId,
        score,
        correct_count: correctCount,
        total_questions: totalQuestions,
      })
      .select("id")
      .single();

    if (attemptError || !attempt) {
      return Response.json(
        { error: attemptError?.message || "Gagal membuat attempt latihan." },
        { status: 500 }
      );
    }

    const answerRows = evaluatedAnswers.map((item) => ({
      attempt_id: attempt.id,
      question_id: item.question_id,
      selected_answer: item.selected_answer,
      is_correct: item.is_correct,
    }));

    const { error: answersInsertError } = await supabase
      .from("practice_answers")
      .insert(answerRows);

    if (answersInsertError) {
      return Response.json(
        { error: answersInsertError.message },
        { status: 500 }
      );
    }

    return Response.json({
      attemptId: attempt.id,
      score,
      correctCount,
      totalQuestions,
      results: evaluatedAnswers.map((item) => ({
        questionId: item.question_id,
        selectedAnswer: item.selected_answer,
        correctAnswer: item.correct_answer,
        isCorrect: item.is_correct,
        explanation: item.explanation,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi error tidak diketahui.";

    return Response.json({ error: message }, { status: 500 });
  }
}
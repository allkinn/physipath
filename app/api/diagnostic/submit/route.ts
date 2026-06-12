import { createClient } from "@supabase/supabase-js";

type SubmittedAnswer = {
  questionId: string;
  selectedAnswer: "A" | "B" | "C" | "D";
};

type QuestionFromDatabase = {
  id: string;
  topic_id: string;
  correct_answer: "A" | "B" | "C" | "D";
};

function getLevel(score: number) {
  if (score <= 40) return "Gap Berat";
  if (score <= 70) return "Perlu Penguatan";
  return "Cukup Menguasai";
}

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
    const answers = body.answers as SubmittedAnswer[];

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

    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("id, topic_id, correct_answer")
      .in("id", questionIds);

    if (questionsError || !questionsData) {
      return Response.json(
        { error: questionsError?.message || "Gagal mengambil kunci jawaban." },
        { status: 500 }
      );
    }

    const questions = questionsData as QuestionFromDatabase[];

    if (questions.length !== answers.length) {
      return Response.json(
        { error: "Jumlah soal dari database tidak cocok dengan jawaban." },
        { status: 400 }
      );
    }

    const questionMap = new Map(questions.map((question) => [question.id, question]));

    const evaluatedAnswers = answers.map((answer) => {
      const question = questionMap.get(answer.questionId);

      if (!question) {
        throw new Error("Ada questionId yang tidak ditemukan.");
      }

      const isCorrect = answer.selectedAnswer === question.correct_answer;

      return {
        question_id: answer.questionId,
        selected_answer: answer.selectedAnswer,
        is_correct: isCorrect,
        topic_id: question.topic_id,
      };
    });

    const correctCount = evaluatedAnswers.filter((item) => item.is_correct).length;
    const totalScore = Number(((correctCount / evaluatedAnswers.length) * 100).toFixed(2));

    const { data: attempt, error: attemptError } = await supabase
      .from("diagnostic_attempts")
      .insert({
        user_id: user.id,
        total_score: totalScore,
      })
      .select("id")
      .single();

    if (attemptError || !attempt) {
      return Response.json(
        { error: attemptError?.message || "Gagal membuat attempt." },
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
      .from("diagnostic_answers")
      .insert(answerRows);

    if (answersInsertError) {
      return Response.json(
        { error: answersInsertError.message },
        { status: 500 }
      );
    }

    const groupedByTopic = new Map<
      string,
      {
        total: number;
        correct: number;
      }
    >();

    for (const item of evaluatedAnswers) {
      const current = groupedByTopic.get(item.topic_id) ?? {
        total: 0,
        correct: 0,
      };

      current.total += 1;

      if (item.is_correct) {
        current.correct += 1;
      }

      groupedByTopic.set(item.topic_id, current);
    }

    const topicScoreRows = Array.from(groupedByTopic.entries()).map(
      ([topicId, value]) => {
        const score = Number(((value.correct / value.total) * 100).toFixed(2));

        return {
          attempt_id: attempt.id,
          topic_id: topicId,
          score,
          level: getLevel(score),
        };
      }
    );

    const { error: topicScoresError } = await supabase
      .from("topic_scores")
      .insert(topicScoreRows);

    if (topicScoresError) {
      return Response.json(
        { error: topicScoresError.message },
        { status: 500 }
      );
    }

    return Response.json({
      attemptId: attempt.id,
      totalScore,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi error tidak diketahui.";

    return Response.json({ error: message }, { status: 500 });
  }
}
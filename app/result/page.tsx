import ResultClient from "../../components/ResultClient";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string }>;
}) {
  const params = await searchParams;
  const attemptId = params.attempt ?? null;

  return <ResultClient attemptId={attemptId} />;
}

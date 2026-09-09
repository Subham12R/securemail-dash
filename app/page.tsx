import HomePage from "./pages/home";

type SearchParams = Promise<{ range?: string }>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { range } = await searchParams;
  const selectedRange = range === "all" || range === "30d" ? range : "7d";

  return <HomePage range={selectedRange} />;
}

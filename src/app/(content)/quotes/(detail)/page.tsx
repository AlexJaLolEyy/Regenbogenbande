import { getAllQuotes } from "@/src/app/current-storage/storage";
import { getSession } from "@/src/lib/auth-utils";
import QuoteList from "@/src/lib/components/quotes/quotes-list/quote-list";
import { prisma } from "@/src/lib/prisma";

export default async function Page() {
  const session = await getSession();
  const quotes = await getAllQuotes(session);
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return (
    <QuoteList initialQuotes={quotes} categories={categories} />
  );
}

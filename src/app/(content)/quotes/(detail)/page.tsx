import { getSession } from "@/src/lib/auth-utils";
import QuoteList from "@/src/lib/components/quotes/quotes-list/quote-list";
import { getQuotesForList } from "@/src/lib/db/selects/quotes";
import { prisma } from "@/src/lib/prisma";
import { QuoteListItem } from "@/src/lib/types/types";

export default async function Page() {
  const session = await getSession();
  const quotes: QuoteListItem[] = await getQuotesForList(session);
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, iconUrl: true },
    orderBy: { name: 'asc' }
  });

  return (
    <QuoteList initialQuotes={quotes} categories={categories} />
  );
}

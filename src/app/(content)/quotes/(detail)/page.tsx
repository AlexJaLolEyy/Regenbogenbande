import { getSession } from "@/src/lib/auth-utils";
import QuoteList from "@/src/lib/components/quotes/quote-list/quote-list";
import { getQuotesForList } from "@/src/lib/db/selects/quotes";
import { prisma } from "@/src/lib/prisma";
import { QUOTES_PER_PAGE } from "@/src/lib/queries/use-quotes";

export default async function Page() {
  const session = await getSession();
  const initial = await getQuotesForList(session, { limit: QUOTES_PER_PAGE });
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, iconUrl: true },
    orderBy: { name: 'asc' }
  });

  // People who are tagged in at least one item, for the "person" filter
  const people = await prisma.user.findMany({
    where: { quoteParticipants: { some: {} }, status: { not: "DISABLED" } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <QuoteList initial={initial} categories={categories} people={people} />
  );
}

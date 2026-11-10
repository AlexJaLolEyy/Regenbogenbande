import { getSession } from "@/src/lib/auth-utils";
import { getPicturesForList } from "@/src/lib/db/selects/pictures";
import { DateRange, SortOption } from '@/src/lib/types/filters';
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
  const search = searchParams.get('search') || undefined;
  const sort = (searchParams.get('sort') as SortOption) || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;
  const dateRange = (searchParams.get('dateRange') as DateRange) || undefined;
  const participantId = searchParams.get('participantId') || undefined;
  const unseenOnly = searchParams.get('unseenOnly') === '1';

  try {
    const result = await getPicturesForList(session, {
      page,
      limit,
      search,
      sort,
      categoryId,
      dateRange, participantId, unseenOnly,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error fetching pictures:', error);
    return NextResponse.json({ error: 'Failed to fetch pictures' }, { status: 500 });
  }
}

import { getSession } from "@/src/lib/auth-utils";
import { getVideosForList } from "@/src/lib/db/selects/videos";
import { DateRange, SortOption } from '@/src/lib/types/filters';
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const search = searchParams.get('search') || undefined;
  const sort = (searchParams.get('sort') as SortOption) || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;
  const dateRange = (searchParams.get('dateRange') as DateRange) || undefined;

  try {
    const videos = await getVideosForList(session, {
      page,
      limit,
      search,
      sort,
      categoryId,
      dateRange,
    });
    return NextResponse.json(videos);
  } catch (error) {
    console.error('API Error fetching videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

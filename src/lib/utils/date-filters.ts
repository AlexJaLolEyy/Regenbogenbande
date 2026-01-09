import { DateRange, SortOption } from '../types/filters';

export function getDateRangeFilter(dateRange: DateRange): { gte?: Date; lte?: Date } {
  const now = new Date();

  switch (dateRange) {
    case 'this-week':
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { gte: weekAgo };
    case 'last-30-days':
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return { gte: monthAgo };
    case 'this-year':
      return { gte: new Date(now.getFullYear(), 0, 1) };
    case '2024':
    case '2023':
    case '2022':
    case '2021':
    case '2020':
    case '2019':
    case '2018':
      const year = parseInt(dateRange);
      return {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31, 23, 59, 59)
      };
    default:
      return {};
  }
}

export function getSortOrder(sort: SortOption) {
  switch (sort) {
    case 'newest': return { createdAt: 'desc' as const };
    case 'oldest': return { createdAt: 'asc' as const };
    case 'popular': return { views: 'desc' as const };
    case 'random': return { createdAt: 'desc' as const }; // Random handled differently
    default: return { createdAt: 'desc' as const };
  }
}

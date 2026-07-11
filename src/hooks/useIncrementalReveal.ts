import { useEffect, useMemo, useState } from 'react';

export const INCREMENTAL_PAGE_SIZE = 5;

export function useIncrementalReveal<T>(
  items: T[],
  resetKey: string | number,
  pageSize = INCREMENTAL_PAGE_SIZE,
) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [resetKey, pageSize]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const remaining = Math.max(0, items.length - visibleCount);
  const hasMore = remaining > 0;
  const canShowLess = visibleCount > pageSize;

  const showMore = () => {
    setVisibleCount((current) => Math.min(current + pageSize, items.length));
  };

  const showLess = () => {
    setVisibleCount((current) => Math.max(pageSize, current - pageSize));
  };

  return { visibleItems, remaining, hasMore, canShowLess, showMore, showLess };
}

"use client";

import { useEffect } from 'react';
import { usePaginatedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { CrmTarget } from '@/lib/crm-types';

const PAGE_SIZE = 500;

// Loads the entire crmTargets table by paging through getCrmTargetsPaginated,
// since a single .collect() query exceeds Convex's 16MB per-execution read limit.
export function useAllCrmTargets(): CrmTarget[] | undefined {
  const { results, status, loadMore } = usePaginatedQuery(
    api.crmTargets.getCrmTargetsPaginated,
    {},
    { initialNumItems: PAGE_SIZE }
  );

  useEffect(() => {
    if (status === 'CanLoadMore') {
      loadMore(PAGE_SIZE);
    }
  }, [status, loadMore]);

  if (status === 'LoadingFirstPage' || status === 'CanLoadMore') {
    return undefined;
  }

  return results as unknown as CrmTarget[];
}

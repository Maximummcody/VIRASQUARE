export const VIRA_QUERY_DEFAULTS = {
  queries: {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  },
} as const;

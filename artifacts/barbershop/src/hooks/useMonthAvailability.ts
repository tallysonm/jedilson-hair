import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

export type MonthAvailabilityDay = {
  date: string;
  available: boolean;
};

export type MonthAvailabilityResponse = {
  month: string;
  days: MonthAvailabilityDay[];
};

export type MonthAvailabilityParams = {
  month: string;
  serviceId: string;
  barberId?: string;
};

function buildMonthAvailabilityUrl(params: MonthAvailabilityParams): string {
  const search = new URLSearchParams();
  search.set("month", params.month);
  search.set("serviceId", params.serviceId);
  if (params.barberId) search.set("barberId", params.barberId);
  return `/api/appointments/month-availability?${search.toString()}`;
}

export function getMonthAvailabilityQueryKey(params: MonthAvailabilityParams) {
  return ["month-availability", params.month, params.serviceId, params.barberId ?? null] as const;
}

export function useMonthAvailability(params: MonthAvailabilityParams, enabled: boolean) {
  return useQuery({
    queryKey: getMonthAvailabilityQueryKey(params),
    queryFn: ({ signal }) =>
      customFetch<MonthAvailabilityResponse>(buildMonthAvailabilityUrl(params), { signal }),
    enabled,
    // Availability changes as soon as a slot gets booked, so cached data is
    // never treated as fresh — every (re)enable/key-change triggers a fetch.
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  });
}

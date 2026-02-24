import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { FoodEntry, DailySummary, StepRecord, ExternalBlob } from '@/backend';

// ─── Food Entries ────────────────────────────────────────────────────────────

export function useEntriesForDate(date: string) {
  const { actor, isFetching } = useActor();

  return useQuery<FoodEntry[]>({
    queryKey: ['entries', date],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEntriesForDate(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useAddFoodEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      date,
      foodName,
      calories,
      image,
    }: {
      date: string;
      foodName: string;
      calories: bigint;
      image: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.addFoodEntry(date, foodName, calories, image);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entries', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['summary', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['availableDates'] });
    },
  });
}

// ─── Daily Summary ───────────────────────────────────────────────────────────

export function useDailySummary(date: string) {
  const { actor, isFetching } = useActor();

  return useQuery<DailySummary>({
    queryKey: ['summary', date],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getDailySummary(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

// ─── Steps ───────────────────────────────────────────────────────────────────

export function useStepsForDate(date: string) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint | null>({
    queryKey: ['steps', date],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getSteps(date);
      } catch {
        // No steps recorded for this date
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useAllStepRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<StepRecord[]>({
    queryKey: ['allStepRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStepRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Available Dates ─────────────────────────────────────────────────────────

export function useAvailableDates() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['availableDates'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAvailableDates();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── History Summaries ───────────────────────────────────────────────────────

export function useHistorySummaries(dates: string[]) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<{ date: string; summary: DailySummary }>>({
    queryKey: ['historySummaries', dates],
    queryFn: async () => {
      if (!actor || dates.length === 0) return [];
      const results = await Promise.all(
        dates.map(async (date) => {
          const summary = await actor.getDailySummary(date);
          return { date, summary };
        })
      );
      return results.sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled: !!actor && !isFetching && dates.length > 0,
  });
}

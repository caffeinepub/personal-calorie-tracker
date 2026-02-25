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
      id,
      date,
      foodName,
      calories,
      image,
    }: {
      id: string;
      date: string;
      foodName: string;
      calories: bigint;
      image: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.addFoodEntry(id, date, foodName, calories, image);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entries', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['summary', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['availableDates'] });
      queryClient.invalidateQueries({ queryKey: ['sevenDayHistory'] });
    },
  });
}

export function useDeleteFoodEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.deleteFoodEntry(id, date);
      if (result.__kind__ === 'failure') {
        throw new Error(result.failure);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entries', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['summary', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['sevenDayHistory'] });
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

export function useLogSteps() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, steps }: { date: string; steps: number }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.logSteps(date, BigInt(steps));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['steps', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['summary', variables.date] });
    },
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

// ─── Seven Day History ───────────────────────────────────────────────────────

function getLastSevenDays(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function useSevenDayHistory() {
  const { actor, isFetching } = useActor();
  const dates = getLastSevenDays();

  return useQuery<Array<{ date: string; calories: number }>>({
    queryKey: ['sevenDayHistory'],
    queryFn: async () => {
      if (!actor) return dates.map((date) => ({ date, calories: 0 }));
      const results = await Promise.all(
        dates.map(async (date) => {
          try {
            const summary = await actor.getDailySummary(date);
            return { date, calories: Number(summary.totalCaloriesConsumed) };
          } catch {
            return { date, calories: 0 };
          }
        })
      );
      return results;
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Calorie Limit ───────────────────────────────────────────────────────────

export function useCalorieLimit(date: string) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['calorieLimit', date],
    queryFn: async () => {
      if (!actor) return 2000;
      const limit = await actor.getCalorieLimit(date);
      return Number(limit);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useSetCalorieLimit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, limit }: { date: string; limit: number }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.setCalorieLimit(date, BigInt(limit));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calorieLimit', variables.date] });
    },
  });
}

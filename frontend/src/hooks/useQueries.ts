import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { ExternalBlob } from "../backend";

// ── Food Entries ──────────────────────────────────────────────────────────────

export function useGetFoodEntries(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["foodEntries", date],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEntriesForDate(date);
    },
    enabled: !!actor && !isFetching,
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
      if (!actor) throw new Error("Actor not initialized");
      return actor.addFoodEntry(id, date, foodName, calories, image);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["foodEntries", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["availableDates"] });
      queryClient.invalidateQueries({ queryKey: ["sevenDayHistory"] });
    },
  });
}

export function useDeleteFoodEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      if (!actor) throw new Error("Actor not initialized");
      const result = await actor.deleteFoodEntry(id, date);
      if (result.__kind__ === "failure") {
        throw new Error(result.failure);
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["foodEntries", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["availableDates"] });
      queryClient.invalidateQueries({ queryKey: ["sevenDayHistory"] });
    },
  });
}

// ── Daily Summary ─────────────────────────────────────────────────────────────

export function useGetDailySummary(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dailySummary", date],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDailySummary(date);
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Steps ─────────────────────────────────────────────────────────────────────

export function useGetSteps(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["steps", date],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      try {
        return await actor.getSteps(date);
      } catch {
        return BigInt(0);
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLogSteps() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, steps }: { date: string; steps: bigint }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.logSteps(date, steps);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["steps", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["sevenDayHistory"] });
    },
  });
}

// ── Calorie Limit ─────────────────────────────────────────────────────────────

export function useGetCalorieLimit(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["calorieLimit", date],
    queryFn: async () => {
      if (!actor) return BigInt(2000);
      return actor.getCalorieLimit(date);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetCalorieLimit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, limit }: { date: string; limit: bigint }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.setCalorieLimit(date, limit);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["calorieLimit", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["sevenDayHistory"] });
    },
  });
}

// ── Available Dates ───────────────────────────────────────────────────────────

export function useGetAvailableDates() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["availableDates"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAvailableDates();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Seven Day History ─────────────────────────────────────────────────────────

export function useSevenDayHistory(referenceDate: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["sevenDayHistory", referenceDate],
    queryFn: async () => {
      if (!actor) return [];
      const days: { date: string; calories: number; limit: number }[] = [];
      const ref = new Date(referenceDate);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(ref);
        d.setDate(ref.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        try {
          const [summary, limit] = await Promise.all([
            actor.getDailySummary(dateStr),
            actor.getCalorieLimit(dateStr),
          ]);
          days.push({
            date: dateStr,
            calories: Number(summary.totalCaloriesConsumed),
            limit: Number(limit),
          });
        } catch {
          days.push({ date: dateStr, calories: 0, limit: 2000 });
        }
      }
      return days;
    },
    enabled: !!actor && !isFetching,
  });
}

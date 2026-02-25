import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Footprints,
  TrendingDown,
  Target,
  AlertTriangle,
  Loader2,
  Edit2,
  Check,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import StatCard from "../components/StatCard";
import FoodEntryCard from "../components/FoodEntryCard";
import {
  useGetDailySummary,
  useGetFoodEntries,
  useGetCalorieLimit,
  useSetCalorieLimit,
  useLogSteps,
  useDeleteFoodEntry,
  useSevenDayHistory,
} from "../hooks/useQueries";

function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

function todayStr(): string {
  return toLocalDateStr(new Date());
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => todayStr());
  const [stepsInput, setStepsInput] = useState("");
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState("");

  const summary = useGetDailySummary(selectedDate);
  const entries = useGetFoodEntries(selectedDate);
  const calorieLimit = useGetCalorieLimit(selectedDate);
  const setCalorieLimit = useSetCalorieLimit();
  const logSteps = useLogSteps();
  const deleteFoodEntry = useDeleteFoodEntry();
  const sevenDay = useSevenDayHistory(selectedDate);

  const totalConsumed = summary.data ? Number(summary.data.totalCaloriesConsumed) : 0;
  const totalBurned = summary.data ? Number(summary.data.totalCaloriesBurned) : 0;
  const totalSteps = summary.data ? Number(summary.data.totalSteps) : 0;
  const netCalories = summary.data ? Number(summary.data.netCalories) : 0;
  const limit = calorieLimit.data ? Number(calorieLimit.data) : 2000;
  const remaining = limit - totalConsumed;
  const progressPct = Math.min((totalConsumed / limit) * 100, 100);
  const isOverLimit = totalConsumed > limit;

  const handlePrevDay = () => setSelectedDate(offsetDate(selectedDate, -1));
  const handleNextDay = () => {
    const next = offsetDate(selectedDate, 1);
    if (next <= todayStr()) setSelectedDate(next);
  };
  const isToday = selectedDate === todayStr();

  const handleLogSteps = async () => {
    const steps = parseInt(stepsInput, 10);
    if (isNaN(steps) || steps < 0) return;
    await logSteps.mutateAsync({ date: selectedDate, steps: BigInt(steps) });
    setStepsInput("");
  };

  const handleSaveLimit = async () => {
    const val = parseInt(limitInput, 10);
    if (isNaN(val) || val <= 0) return;
    await setCalorieLimit.mutateAsync({ date: selectedDate, limit: BigInt(val) });
    setEditingLimit(false);
    setLimitInput("");
  };

  const handleStartEditLimit = () => {
    setLimitInput(String(limit));
    setEditingLimit(true);
  };

  const chartData = (sevenDay.data ?? []).map((d) => ({
    date: d.date.slice(5), // MM-DD
    calories: d.calories,
    limit: d.limit,
    over: d.calories > d.limit,
  }));

  const avgLimit = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.limit, 0) / chartData.length)
    : 2000;

  return (
    <div className="space-y-6">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handlePrevDay}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <p className="font-semibold">{formatDate(selectedDate)}</p>
          {isToday && (
            <span className="text-xs text-primary font-medium">Today</span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={handleNextDay} disabled={isToday}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Over-limit alert */}
      {isOverLimit && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Calorie limit exceeded</AlertTitle>
          <AlertDescription>
            You've consumed {totalConsumed - limit} kcal over your daily limit of {limit} kcal.
          </AlertDescription>
        </Alert>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Consumed"
          value={totalConsumed}
          unit="kcal"
          icon={<Flame className="w-4 h-4" />}
          variant={isOverLimit ? "danger" : "default"}
        />
        <StatCard
          label="Burned"
          value={totalBurned}
          unit="kcal"
          icon={<TrendingDown className="w-4 h-4" />}
          variant="success"
        />
        <StatCard
          label="Steps"
          value={totalSteps.toLocaleString()}
          icon={<Footprints className="w-4 h-4" />}
          variant="info"
        />
        <StatCard
          label="Net"
          value={netCalories}
          unit="kcal"
          icon={<Target className="w-4 h-4" />}
          variant={netCalories > limit ? "danger" : "default"}
        />
      </div>

      {/* Calorie limit card */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Daily Calorie Limit</p>
          {editingLimit ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                className="w-24 h-7 text-sm"
                min={1}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={handleSaveLimit}
                disabled={setCalorieLimit.isPending}
              >
                {setCalorieLimit.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1"
              onClick={handleStartEditLimit}
            >
              <Edit2 className="w-3 h-3" />
              {limit} kcal
            </Button>
          )}
        </div>
        <Progress value={progressPct} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{totalConsumed} kcal consumed</span>
          <span className={remaining < 0 ? "text-destructive font-medium" : ""}>
            {remaining >= 0 ? `${remaining} kcal remaining` : `${Math.abs(remaining)} kcal over`}
          </span>
        </div>
      </div>

      {/* 7-day chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold mb-3">7-Day Calorie History</p>
        {sevenDay.isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [`${value} kcal`, "Calories"]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <ReferenceLine y={avgLimit} stroke="var(--color-warning)" strokeDasharray="4 2" />
              <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.over ? "var(--color-destructive)" : "var(--color-primary)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Step logger */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold mb-3">Log Steps</p>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Enter step count"
            value={stepsInput}
            onChange={(e) => setStepsInput(e.target.value)}
            min={0}
            disabled={logSteps.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleLogSteps}
            disabled={!stepsInput || logSteps.isPending}
          >
            {logSteps.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Log"
            )}
          </Button>
        </div>
      </div>

      {/* Food entries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Food Entries</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/upload" })}
          >
            + Add Food
          </Button>
        </div>

        {entries.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : entries.data && entries.data.length > 0 ? (
          <div className="space-y-2">
            {entries.data.map((entry) => (
              <FoodEntryCard
                key={entry.id}
                entry={entry}
                onDelete={() =>
                  deleteFoodEntry.mutate({ id: entry.id, date: entry.date })
                }
                isDeleting={
                  deleteFoodEntry.isPending &&
                  deleteFoodEntry.variables?.id === entry.id
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No food entries for this day.{" "}
            <button
              className="text-primary underline"
              onClick={() => navigate({ to: "/upload" })}
            >
              Log your first meal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

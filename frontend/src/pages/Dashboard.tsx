import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useEntriesForDate,
  useDailySummary,
  useLogSteps,
  useDeleteFoodEntry,
  useCalorieLimit,
  useSetCalorieLimit,
  useSevenDayHistory,
} from '@/hooks/useQueries';
import StatCard from '@/components/StatCard';
import FoodEntryCard from '@/components/FoodEntryCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Flame,
  Footprints,
  TrendingDown,
  TrendingUp,
  Plus,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Zap,
  Scale,
  AlertCircle,
  Target,
  BarChart2,
  CheckCircle2,
  Edit2,
} from 'lucide-react';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = getTodayDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === today) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function shiftDate(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [stepInput, setStepInput] = useState('');
  const [stepsSaved, setStepsSaved] = useState(false);
  const [limitInput, setLimitInput] = useState('');
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: entries, isLoading: entriesLoading } = useEntriesForDate(selectedDate);
  const { data: summary, isLoading: summaryLoading } = useDailySummary(selectedDate);
  const { data: calorieLimit, isLoading: limitLoading } = useCalorieLimit(selectedDate);
  const { data: sevenDayHistory, isLoading: historyLoading } = useSevenDayHistory();

  const logStepsMutation = useLogSteps();
  const deleteFoodEntryMutation = useDeleteFoodEntry();
  const setCalorieLimitMutation = useSetCalorieLimit();

  const isLoading = entriesLoading || summaryLoading;
  const isToday = selectedDate === getTodayDate();

  // Pre-fill step input from summary when date or summary changes
  useEffect(() => {
    if (summary && Number(summary.totalSteps) > 0) {
      setStepInput(String(Number(summary.totalSteps)));
    } else {
      setStepInput('');
    }
    setStepsSaved(false);
    logStepsMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, summary?.totalSteps]);

  // Sync limit input when calorieLimit loads or date changes
  useEffect(() => {
    if (calorieLimit !== undefined) {
      setLimitInput(String(calorieLimit));
    }
    setIsEditingLimit(false);
  }, [selectedDate, calorieLimit]);

  const handleSaveSteps = () => {
    if (!stepInput) return;
    const steps = parseInt(stepInput, 10);
    if (isNaN(steps) || steps < 0) return;

    logStepsMutation.mutate(
      { date: selectedDate, steps },
      {
        onSuccess: () => {
          setStepsSaved(true);
        },
      }
    );
  };

  const handleSaveLimit = () => {
    const limit = parseInt(limitInput, 10);
    if (isNaN(limit) || limit <= 0) return;
    setCalorieLimitMutation.mutate(
      { date: selectedDate, limit },
      {
        onSuccess: () => {
          setIsEditingLimit(false);
        },
      }
    );
  };

  const handleDeleteEntry = (id: string, date: string) => {
    setDeletingId(id);
    deleteFoodEntryMutation.mutate(
      { id, date },
      {
        onSettled: () => {
          setDeletingId(null);
        },
      }
    );
  };

  const totalCaloriesIn = summary ? Number(summary.totalCaloriesConsumed) : 0;
  const totalCaloriesBurned = summary ? Number(summary.totalCaloriesBurned) : 0;
  const netCalories = summary ? Number(summary.netCalories) : 0;
  const totalSteps = summary ? Number(summary.totalSteps) : 0;
  const currentLimit = calorieLimit ?? 2000;
  const caloriesRemaining = currentLimit - totalCaloriesIn;
  const isLimitExceeded = totalCaloriesIn > currentLimit && currentLimit > 0;
  const progressPercent = currentLimit > 0 ? Math.min((totalCaloriesIn / currentLimit) * 100, 100) : 0;

  const netVariant = netCalories <= 0 ? 'success' : netCalories < 500 ? 'warning' : 'danger';

  const motivationalMessage = () => {
    if (totalCaloriesIn === 0) return { text: "Start logging your meals to track your progress! 🍽️", positive: true };
    if (isLimitExceeded) return { text: "You've exceeded your calorie limit for today. Consider lighter meals! 🥗", positive: false };
    if (netCalories <= 0) return { text: "Amazing! You're in a calorie deficit — great for fat loss! 🎉", positive: true };
    if (netCalories < 200) return { text: "Almost there! A small deficit keeps you on track. 💪", positive: true };
    if (netCalories < 500) return { text: "You're close to your goal. Keep moving to burn more! 🏃", positive: false };
    return { text: "You're in a surplus today. Try adding more steps or lighter meals. 🥗", positive: false };
  };

  const message = motivationalMessage();

  // Chart data: label today's bar differently
  const chartData = (sevenDayHistory ?? []).map((d) => ({
    date: formatShortDate(d.date),
    fullDate: d.date,
    calories: d.calories,
    isToday: d.date === getTodayDate(),
  }));

  return (
    <div className="space-y-6 pb-4">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden h-32 md:h-40">
        <img
          src="/assets/generated/hero-food.dim_1200x400.png"
          alt="Healthy food"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).parentElement!.style.background = 'linear-gradient(135deg, oklch(0.75 0.15 145), oklch(0.65 0.18 145))';
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent flex items-center px-6">
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow">Daily Tracker</h1>
            <p className="text-white/80 text-sm mt-0.5">Stay on track with your fat-loss goals</p>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <p className="font-bold text-foreground text-lg">{formatDisplayDate(selectedDate)}</p>
          <p className="text-xs text-muted-foreground">{selectedDate}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
          disabled={selectedDate >= getTodayDate()}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Date Picker */}
      <div className="flex items-center gap-2">
        <Label htmlFor="date-picker" className="text-sm text-muted-foreground whitespace-nowrap">Jump to date:</Label>
        <Input
          id="date-picker"
          type="date"
          value={selectedDate}
          max={getTodayDate()}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-xl max-w-[180px]"
        />
        {!isToday && (
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSelectedDate(getTodayDate())}>
            Today
          </Button>
        )}
      </div>

      {/* Exceeded Limit Alert */}
      {!isLoading && !limitLoading && isLimitExceeded && (
        <Alert variant="destructive" className="rounded-2xl border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">Calorie Limit Exceeded!</AlertTitle>
          <AlertDescription>
            You've consumed <strong>{totalCaloriesIn.toLocaleString()} kcal</strong> today, which is{' '}
            <strong>{(totalCaloriesIn - currentLimit).toLocaleString()} kcal</strong> over your daily limit of{' '}
            <strong>{currentLimit.toLocaleString()} kcal</strong>. Consider lighter meals or more activity.
          </AlertDescription>
        </Alert>
      )}

      {/* Motivational Banner */}
      {!isLoading && !isLimitExceeded && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${message.positive ? 'bg-success/10 border border-success/30' : 'bg-warning/10 border border-warning/30'}`}>
          {message.positive ? (
            <TrendingDown className="w-5 h-5 text-success flex-shrink-0" />
          ) : (
            <TrendingUp className="w-5 h-5 text-warning flex-shrink-0" />
          )}
          <p className={`text-sm font-medium ${message.positive ? 'text-success' : 'text-warning'}`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Calories In"
              value={totalCaloriesIn.toLocaleString()}
              unit="kcal"
              icon={Utensils}
              variant="info"
            />
            <StatCard
              label="Calories Burned"
              value={totalCaloriesBurned.toLocaleString()}
              unit="kcal"
              icon={Flame}
              variant="warning"
            />
            <StatCard
              label="Net Calories"
              value={netCalories.toLocaleString()}
              unit="kcal"
              icon={Scale}
              variant={netVariant}
              subtitle={netCalories <= 0 ? 'In deficit! 🎉' : 'In surplus'}
            />
            <StatCard
              label="Steps"
              value={totalSteps.toLocaleString()}
              unit="steps"
              icon={Footprints}
              variant="default"
              subtitle={`≈ ${totalCaloriesBurned} kcal burned`}
            />
          </>
        )}
      </div>

      {/* Calorie Limit & Progress */}
      <Card className="border border-border rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-5 h-5 text-primary" />
            Daily Calorie Limit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {limitLoading ? (
            <Skeleton className="h-10 rounded-xl" />
          ) : (
            <>
              {/* Limit Input Row */}
              <div className="flex items-center gap-3">
                {isEditingLimit ? (
                  <>
                    <Input
                      type="number"
                      value={limitInput}
                      onChange={(e) => setLimitInput(e.target.value)}
                      className="rounded-xl flex-1 max-w-[160px]"
                      min="1"
                      max="10000"
                      placeholder="e.g. 2000"
                      disabled={setCalorieLimitMutation.isPending}
                      autoFocus
                    />
                    <Button
                      onClick={handleSaveLimit}
                      disabled={setCalorieLimitMutation.isPending || !limitInput}
                      className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                    >
                      {setCalorieLimitMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Save
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => {
                        setIsEditingLimit(false);
                        setLimitInput(String(currentLimit));
                      }}
                      disabled={setCalorieLimitMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="text-2xl font-bold text-foreground tabular-nums">
                        {currentLimit.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">kcal limit</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setIsEditingLimit(true)}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {totalCaloriesIn.toLocaleString()} / {currentLimit.toLocaleString()} kcal consumed
                  </span>
                  <span className={`font-semibold ${isLimitExceeded ? 'text-destructive' : caloriesRemaining < currentLimit * 0.1 ? 'text-warning' : 'text-success'}`}>
                    {isLimitExceeded
                      ? `${Math.abs(caloriesRemaining).toLocaleString()} kcal over`
                      : `${caloriesRemaining.toLocaleString()} kcal left`}
                  </span>
                </div>
                <Progress
                  value={progressPercent}
                  className={`h-3 rounded-full ${isLimitExceeded ? '[&>div]:bg-destructive' : progressPercent > 90 ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`}
                />
              </div>

              {/* Calories Remaining Callout */}
              {!isLimitExceeded && currentLimit > 0 && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
                  <Target className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    You can still consume{' '}
                    <span className="font-bold text-primary">{Math.max(0, caloriesRemaining).toLocaleString()} kcal</span>{' '}
                    today to stay within your limit.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 7-Day Progress Chart */}
      <Card className="border border-border rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="w-5 h-5 text-primary" />
            7-Day Calorie History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : (
            <div className="w-full h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.01 145)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'oklch(0.55 0.02 145)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'oklch(0.55 0.02 145)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'oklch(0.98 0.005 145)',
                      border: '1px solid oklch(0.88 0.02 145)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} kcal`, 'Consumed']}
                    labelStyle={{ fontWeight: 600, color: 'oklch(0.3 0.05 145)' }}
                  />
                  {currentLimit > 0 && (
                    <ReferenceLine
                      y={currentLimit}
                      stroke="oklch(0.55 0.18 30)"
                      strokeDasharray="5 3"
                      strokeWidth={2}
                      label={{
                        value: `Limit: ${currentLimit.toLocaleString()}`,
                        position: 'insideTopRight',
                        fontSize: 11,
                        fill: 'oklch(0.55 0.18 30)',
                        fontWeight: 600,
                      }}
                    />
                  )}
                  <Bar dataKey="calories" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.calories > currentLimit && currentLimit > 0
                            ? 'oklch(0.55 0.2 25)'
                            : entry.isToday
                            ? 'oklch(0.52 0.18 145)'
                            : 'oklch(0.68 0.14 145)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'oklch(0.52 0.18 145)' }} />
              Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'oklch(0.68 0.14 145)' }} />
              Previous days
            </span>
            {currentLimit > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'oklch(0.55 0.2 25)' }} />
                Over limit
              </span>
            )}
            {currentLimit > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 inline-block border-t-2 border-dashed" style={{ borderColor: 'oklch(0.55 0.18 30)' }} />
                Daily limit
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Tracker */}
      <Card className="border border-border rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Footprints className="w-5 h-5 text-primary" />
            Log Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="Enter step count..."
              value={stepInput}
              onChange={(e) => {
                setStepInput(e.target.value);
                setStepsSaved(false);
                if (logStepsMutation.isError) logStepsMutation.reset();
              }}
              className="rounded-xl flex-1"
              min="0"
              max="100000"
              disabled={logStepsMutation.isPending}
            />
            <Button
              onClick={handleSaveSteps}
              disabled={logStepsMutation.isPending || !stepInput}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {logStepsMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Saving...
                </span>
              ) : stepsSaved && !logStepsMutation.isError ? (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Saved!
                </span>
              ) : (
                'Save Steps'
              )}
            </Button>
          </div>

          {/* Error message */}
          {logStepsMutation.isError && (
            <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Failed to save steps. Please try again.</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            Each step burns approximately 0.04 kcal · {stepInput ? `${Math.round(parseInt(stepInput || '0') * 0.04)} kcal estimated` : 'Enter steps to see estimate'}
          </p>
        </CardContent>
      </Card>

      {/* Food Entries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            Food Log
            {entries && entries.length > 0 && (
              <Badge variant="secondary" className="ml-1">{entries.length}</Badge>
            )}
          </h2>
          <Button
            size="sm"
            className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => navigate({ to: '/upload' })}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Food
          </Button>
        </div>

        {entriesLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <FoodEntryCard
                key={`${entry.id}-${idx}`}
                entry={entry}
                onDelete={handleDeleteEntry}
                isDeleting={deletingId === entry.id && deleteFoodEntryMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <Card className="border border-dashed border-border rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Utensils className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">No food logged yet</p>
                <p className="text-sm text-muted-foreground mt-1">Upload a food photo to get started</p>
              </div>
              <Button
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 mt-1"
                onClick={() => navigate({ to: '/upload' })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Your First Meal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

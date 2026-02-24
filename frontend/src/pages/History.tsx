import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAvailableDates, useHistorySummaries } from '@/hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  TrendingDown,
  TrendingUp,
  Calendar,
  Flame,
  Footprints,
  ChevronRight,
  BarChart3,
  Scale,
} from 'lucide-react';

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function History() {
  const navigate = useNavigate();
  const { data: availableDates, isLoading: datesLoading } = useAvailableDates();

  const sortedDates = useMemo(() => {
    if (!availableDates) return [];
    return [...availableDates].sort((a, b) => b.localeCompare(a));
  }, [availableDates]);

  const { data: summaries, isLoading: summariesLoading } = useHistorySummaries(sortedDates);

  const isLoading = datesLoading || summariesLoading;

  const averageNetCalories = useMemo(() => {
    if (!summaries || summaries.length === 0) return null;
    const total = summaries.reduce((acc, { summary }) => acc + Number(summary.netCalories), 0);
    return Math.round(total / summaries.length);
  }, [summaries]);

  const handleRowClick = (date: string) => {
    navigate({ to: '/dashboard', search: { date } as any });
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          History
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your complete calorie tracking record
        </p>
      </div>

      {/* Average Summary Card */}
      {!isLoading && summaries && summaries.length > 0 && (
        <Card className="border border-primary/20 bg-primary/5 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">Overall Average</p>
                <p className="text-xs text-muted-foreground">{summaries.length} day{summaries.length !== 1 ? 's' : ''} tracked</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg In</p>
                <p className="font-bold text-foreground tabular-nums">
                  {Math.round(summaries.reduce((a, { summary }) => a + Number(summary.totalCaloriesConsumed), 0) / summaries.length).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Burned</p>
                <p className="font-bold text-foreground tabular-nums">
                  {Math.round(summaries.reduce((a, { summary }) => a + Number(summary.totalCaloriesBurned), 0) / summaries.length).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Net</p>
                <p className={`font-bold tabular-nums ${averageNetCalories !== null && averageNetCalories <= 0 ? 'text-success' : 'text-warning'}`}>
                  {averageNetCalories !== null ? averageNetCalories.toLocaleString() : '—'}
                </p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
            </div>
            {averageNetCalories !== null && (
              <div className={`mt-4 rounded-xl p-3 flex items-center gap-2 ${averageNetCalories <= 0 ? 'bg-success/10' : 'bg-warning/10'}`}>
                {averageNetCalories <= 0 ? (
                  <TrendingDown className="w-4 h-4 text-success flex-shrink-0" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-warning flex-shrink-0" />
                )}
                <p className={`text-sm font-medium ${averageNetCalories <= 0 ? 'text-success' : 'text-warning'}`}>
                  {averageNetCalories <= 0
                    ? `You're averaging a ${Math.abs(averageNetCalories)} kcal deficit — great progress! 🎉`
                    : `You're averaging a ${averageNetCalories} kcal surplus. Try to increase activity!`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History List */}
      <Card className="border border-border rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5 text-primary" />
            Daily Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : summaries && summaries.length > 0 ? (
            <div>
              {summaries.map(({ date, summary }, idx) => {
                const net = Number(summary.netCalories);
                const isDeficit = net <= 0;
                return (
                  <div key={date}>
                    {idx > 0 && <Separator />}
                    <button
                      className="w-full text-left px-4 py-4 hover:bg-muted/50 transition-colors duration-150 flex items-center gap-3"
                      onClick={() => handleRowClick(date)}
                    >
                      {/* Date */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground text-sm">{formatDisplayDate(date)}</p>
                          <Badge
                            variant="outline"
                            className={`text-xs px-2 py-0 ${isDeficit ? 'border-success/40 text-success bg-success/10' : 'border-warning/40 text-warning bg-warning/10'}`}
                          >
                            {isDeficit ? '↓ Deficit' : '↑ Surplus'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-accent-foreground" />
                            {Number(summary.totalCaloriesConsumed).toLocaleString()} in
                          </span>
                          <span className="flex items-center gap-1">
                            <Footprints className="w-3 h-3 text-primary" />
                            {Number(summary.totalSteps).toLocaleString()} steps
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-muted-foreground" />
                            {Number(summary.totalCaloriesBurned).toLocaleString()} burned
                          </span>
                        </div>
                      </div>

                      {/* Net Calories */}
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-lg tabular-nums ${isDeficit ? 'text-success' : 'text-warning'}`}>
                          {net > 0 ? '+' : ''}{net.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">net kcal</p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3 px-4">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Calendar className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">No history yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start logging meals to see your history here
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

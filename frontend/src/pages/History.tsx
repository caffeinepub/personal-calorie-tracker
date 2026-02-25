import { useNavigate } from "@tanstack/react-router";
import { Loader2, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import StatCard from "../components/StatCard";
import { useGetAvailableDates, useGetDailySummary, useGetCalorieLimit } from "../hooks/useQueries";

function DayRow({ date, onClick }: { date: string; onClick: () => void }) {
  const summary = useGetDailySummary(date);
  const limitQuery = useGetCalorieLimit(date);

  const consumed = summary.data ? Number(summary.data.totalCaloriesConsumed) : 0;
  const limit = limitQuery.data ? Number(limitQuery.data) : 2000;
  const isOver = consumed > limit;
  const diff = Math.abs(consumed - limit);

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Calendar className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{date}</p>
        <p className="text-xs text-muted-foreground">
          {summary.isLoading ? "Loading…" : `${consumed} kcal consumed`}
        </p>
      </div>
      {!summary.isLoading && (
        <Badge variant={isOver ? "destructive" : "secondary"}>
          {isOver ? (
            <>
              <TrendingUp className="w-3 h-3 mr-1" />+{diff} kcal
            </>
          ) : (
            <>
              <TrendingDown className="w-3 h-3 mr-1" />-{diff} kcal
            </>
          )}
        </Badge>
      )}
    </button>
  );
}

export default function History() {
  const navigate = useNavigate();
  const datesQuery = useGetAvailableDates();

  const dates = (datesQuery.data ?? []).slice().sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse your past food logs by date.
        </p>
      </div>

      {datesQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : dates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground" />
            <p className="font-medium">No history yet</p>
            <p className="text-sm text-muted-foreground">
              Start logging meals to see your history here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Average stat */}
          {dates.length > 0 && (
            <AverageStat dates={dates} />
          )}

          <div className="space-y-2">
            {dates.map((date) => (
              <DayRow
                key={date}
                date={date}
                onClick={() => navigate({ to: "/dashboard", search: { date } })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AverageStat({ dates }: { dates: string[] }) {
  // We can't easily aggregate here without calling hooks in a loop,
  // so show a simple count stat instead
  return (
    <StatCard
      label="Days Tracked"
      value={dates.length}
      unit="days"
      variant="info"
      description="Total days with food entries"
    />
  );
}

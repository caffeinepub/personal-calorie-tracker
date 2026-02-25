import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FoodEntry } from "../backend";

interface FoodEntryCardProps {
  entry: FoodEntry;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export default function FoodEntryCard({ entry, onDelete, isDeleting }: FoodEntryCardProps) {
  const imageUrl = entry.image.getDirectURL();

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={entry.foodName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{entry.foodName}</p>
        <p className="text-xs text-muted-foreground">{entry.date}</p>
      </div>

      {/* Calories badge */}
      <Badge variant="secondary" className="flex-shrink-0">
        {Number(entry.calories)} kcal
      </Badge>

      {/* Delete button */}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label="Delete entry"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
}

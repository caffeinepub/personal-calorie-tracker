import { FoodEntry } from '@/backend';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Utensils, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface FoodEntryCardProps {
  entry: FoodEntry;
  onDelete?: (id: string, date: string) => void;
  isDeleting?: boolean;
}

export default function FoodEntryCard({ entry, onDelete, isDeleting }: FoodEntryCardProps) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = entry.image.getDirectURL();

  return (
    <Card className="overflow-hidden border border-border hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-3">
          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
            {!imgError && imageUrl ? (
              <img
                src={imageUrl}
                alt={entry.foodName}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <Utensils className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate capitalize">{entry.foodName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{entry.date}</p>
          </div>

          {/* Calories */}
          <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0 bg-accent/20 text-accent-foreground border-accent/30">
            <Flame className="w-3 h-3 text-accent-foreground" />
            <span className="font-bold tabular-nums">{Number(entry.calories)}</span>
            <span className="text-xs font-normal">kcal</span>
          </Badge>

          {/* Delete Button */}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => onDelete(entry.id, entry.date)}
              disabled={isDeleting}
              aria-label="Delete food entry"
            >
              {isDeleting ? (
                <span className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

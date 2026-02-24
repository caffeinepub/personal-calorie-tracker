import { FoodEntry } from '@/backend';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Utensils } from 'lucide-react';
import { useState } from 'react';

interface FoodEntryCardProps {
  entry: FoodEntry;
}

export default function FoodEntryCard({ entry }: FoodEntryCardProps) {
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
        </div>
      </CardContent>
    </Card>
  );
}

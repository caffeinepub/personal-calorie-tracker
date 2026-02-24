import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-card border-border',
  success: 'bg-success/10 border-success/30',
  warning: 'bg-warning/10 border-warning/30',
  danger: 'bg-destructive/10 border-destructive/30',
  info: 'bg-primary/10 border-primary/30',
};

const iconStyles: Record<string, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  danger: 'bg-destructive/20 text-destructive',
  info: 'bg-primary/20 text-primary',
};

const valueStyles: Record<string, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  info: 'text-primary',
};

export default function StatCard({ label, value, unit, icon: Icon, variant = 'default', subtitle }: StatCardProps) {
  return (
    <Card className={`border ${variantStyles[variant]} transition-all duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold tabular-nums ${valueStyles[variant]}`}>{value}</span>
              {unit && <span className="text-sm text-muted-foreground font-medium">{unit}</span>}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {Icon && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconStyles[variant]}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

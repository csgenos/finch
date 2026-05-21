import { FinancialHealthScore } from '../../types/finance';
import { cn } from '../../lib/utils/cn';

interface HealthScoreCardProps {
  score: FinancialHealthScore;
}

const metricLabels: Record<keyof Omit<FinancialHealthScore, 'overall' | 'label'>, string> = {
  savingsRate: 'Savings Rate',
  emergencyFund: 'Emergency Fund',
  debtToIncome: 'Debt-to-Income',
  investmentDiversity: 'Investments',
  budgetAdherence: 'Budget Adherence',
};

export function HealthScoreCard({ score }: HealthScoreCardProps) {
  const metrics = Object.entries(metricLabels) as [keyof typeof metricLabels, string][];

  const scoreColor =
    score.overall >= 80
      ? 'text-positive'
      : score.overall >= 65
        ? 'text-brand'
        : score.overall >= 50
          ? 'text-warning'
          : 'text-negative';

  const labelColor =
    score.overall >= 80
      ? 'bg-green-50 text-positive'
      : score.overall >= 65
        ? 'bg-accent text-brand'
        : score.overall >= 50
          ? 'bg-amber-50 text-warning'
          : 'bg-red-50 text-negative';

  return (
    <div className="bg-surface border border-border rounded-lg shadow-card p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Financial Health
          </p>
          <p className={cn('text-3xl font-semibold mt-1 tabular-nums', scoreColor)}>
            {score.overall}
          </p>
        </div>
        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', labelColor)}>
          {score.label}
        </span>
      </div>
      <div className="space-y-3">
        {metrics.map(([key, label]) => (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xs font-medium text-foreground tabular-nums">
                {score[key]}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  score[key] >= 80
                    ? 'bg-positive'
                    : score[key] >= 65
                      ? 'bg-brand'
                      : score[key] >= 50
                        ? 'bg-warning'
                        : 'bg-negative'
                )}
                style={{ width: `${score[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

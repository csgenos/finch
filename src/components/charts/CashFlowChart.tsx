import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../lib/utils/format';
import { brandTokens, chartPalette } from '../../lib/theme/brand';

interface CashFlowDataPoint {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface CashFlowChartProps {
  data: CashFlowDataPoint[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg shadow-card-hover p-3 space-y-1.5">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-xs text-muted-foreground capitalize">{entry.dataKey}</span>
          </div>
          <span className="text-xs font-medium text-foreground">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
        barCategoryGap="30%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke={brandTokens.grid} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: brandTokens.tick }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: brandTokens.tick }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => formatCurrency(v, 'USD', true)}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: brandTokens.hover }} />
        <Bar dataKey="income" fill={chartPalette.positive} radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenses" fill={chartPalette.neutral} radius={[3, 3, 0, 0]} />
        <Bar dataKey="savings" fill={chartPalette.primary} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

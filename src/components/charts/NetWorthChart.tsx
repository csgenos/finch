import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { NetWorthSnapshot } from '../../types/finance';
import { formatCurrency } from '../../lib/utils/format';
import { formatMonthYear } from '../../lib/utils/dates';
import { brandTokens, chartPalette } from '../../lib/theme/brand';

interface NetWorthChartProps {
  data: NetWorthSnapshot[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg shadow-card-hover p-3">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {formatCurrency(payload[0]?.value)}
      </p>
    </div>
  );
}

export function NetWorthChart({ data }: NetWorthChartProps) {
  const chartData = data.map(d => ({
    date: formatMonthYear(d.date),
    netWorth: d.netWorth,
    assets: d.totalAssets,
    liabilities: d.totalLiabilities,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartPalette.primary} stopOpacity={0.18} />
            <stop offset="95%" stopColor={chartPalette.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={brandTokens.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: brandTokens.tick }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: brandTokens.tick }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => formatCurrency(v, 'USD', true)}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="netWorth"
          stroke={chartPalette.primary}
          strokeWidth={2}
          fill="url(#netWorthGradient)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: chartPalette.primaryDeep }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

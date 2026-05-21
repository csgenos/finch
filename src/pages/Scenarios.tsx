import { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useFinanceStore } from '../store/useFinanceStore';
import { Scenario, OneTimeEvent } from '../types/scenario';
import { generateProjections } from '../lib/finance/projections';
import { calculateNetWorth, calculateMonthSummary } from '../lib/finance/cashflow';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../lib/utils/format';
import { generateId } from '../lib/storage/localStore';
import { cn } from '../lib/utils/cn';
import { clamp, parseFiniteNumber, parseMoney } from '../lib/utils/numbers';
import { brandTokens, chartPalette } from '../lib/theme/brand';

const SCENARIO_COLORS = [chartPalette.primary, chartPalette.positive, chartPalette.warning, chartPalette.coral, chartPalette.plum, chartPalette.teal];

interface ScenarioFormState {
  name: string;
  description: string;
  annualIncomeGrowth: string;
  annualExpenseGrowth: string;
  annualInvestmentReturn: string;
  annualInflation: string;
  targetSavingsRate: string;
  retirementAge: string;
}

function EventForm({
  startYear,
  onAdd,
  onCancel,
}: {
  startYear: number;
  onAdd: (e: OneTimeEvent) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    year: startYear.toString(),
    label: '',
    netWorthImpact: '',
    incomeImpact: '',
    expenseImpact: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const year = parseFiniteNumber(form.year);
    const netWorthImpact = parseMoney(form.netWorthImpact);
    const incomeImpact = form.incomeImpact ? parseMoney(form.incomeImpact) : null;
    const expenseImpact = form.expenseImpact ? parseMoney(form.expenseImpact) : null;
    if (!form.label.trim() || year === null || netWorthImpact === null) return;
    onAdd({
      year: Math.trunc(year),
      label: form.label.trim(),
      netWorthImpact,
      incomeImpact: incomeImpact ?? undefined,
      expenseImpact: expenseImpact ?? undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Year" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
        <Input label="Label" placeholder="e.g. Buy a house" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Net Worth Impact ($)" type="number" placeholder="-50000" value={form.netWorthImpact} onChange={e => setForm(f => ({ ...f, netWorthImpact: e.target.value }))} />
        <Input label="Income Change ($/yr)" type="number" placeholder="0" value={form.incomeImpact} onChange={e => setForm(f => ({ ...f, incomeImpact: e.target.value }))} />
        <Input label="Expense Change ($/yr)" type="number" placeholder="0" value={form.expenseImpact} onChange={e => setForm(f => ({ ...f, expenseImpact: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm">Add Event</Button>
      </div>
    </form>
  );
}

function ScenarioForm({
  onSuccess,
  onCancel,
  colorIndex,
}: {
  onSuccess: (s: Scenario) => void;
  onCancel: () => void;
  colorIndex: number;
}) {
  const { assumptions } = useFinanceStore();
  const startYear = new Date().getFullYear();
  const [form, setForm] = useState<ScenarioFormState>({
    name: '',
    description: '',
    annualIncomeGrowth: (assumptions.annualIncomeGrowth * 100).toFixed(1),
    annualExpenseGrowth: (assumptions.annualExpenseGrowth * 100).toFixed(1),
    annualInvestmentReturn: (assumptions.annualInvestmentReturn * 100).toFixed(1),
    annualInflation: (assumptions.annualInflation * 100).toFixed(1),
    targetSavingsRate: (assumptions.targetSavingsRate * 100).toFixed(0),
    retirementAge: assumptions.retirementAge.toString(),
  });
  const [errors, setErrors] = useState<Partial<ScenarioFormState>>({});
  const [events, setEvents] = useState<OneTimeEvent[]>([]);
  const [addingEvent, setAddingEvent] = useState(false);

  const set = (field: keyof ScenarioFormState, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Required' }); return; }
    const annualIncomeGrowth = parseFiniteNumber(form.annualIncomeGrowth);
    const annualExpenseGrowth = parseFiniteNumber(form.annualExpenseGrowth);
    const annualInvestmentReturn = parseFiniteNumber(form.annualInvestmentReturn);
    const annualInflation = parseFiniteNumber(form.annualInflation);
    const targetSavingsRate = parseFiniteNumber(form.targetSavingsRate);
    const retirementAge = parseFiniteNumber(form.retirementAge);
    if ([annualIncomeGrowth, annualExpenseGrowth, annualInvestmentReturn, annualInflation, targetSavingsRate, retirementAge].some(v => v === null)) {
      setErrors({ annualIncomeGrowth: 'Enter valid numbers' });
      return;
    }
    const scenario: Scenario = {
      id: generateId(),
      name: form.name.trim(),
      description: form.description.trim(),
      createdAt: new Date().toISOString(),
      color: SCENARIO_COLORS[colorIndex % SCENARIO_COLORS.length],
      assumptions: {
        annualIncomeGrowth: clamp(annualIncomeGrowth! / 100, -0.5, 0.5),
        annualExpenseGrowth: clamp(annualExpenseGrowth! / 100, -0.5, 0.5),
        annualInvestmentReturn: clamp(annualInvestmentReturn! / 100, -0.5, 0.5),
        annualInflation: clamp(annualInflation! / 100, -0.5, 0.5),
        targetSavingsRate: clamp(targetSavingsRate! / 100, 0, 1),
        retirementAge: Math.trunc(clamp(retirementAge!, 0, 120)),
        currentAge: assumptions.currentAge,
        oneTimeEvents: events.length > 0 ? events : undefined,
      },
    };
    onSuccess(scenario);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Scenario Name" placeholder="e.g. New Job + Bay Area Move" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} />
      <Input label="Description (optional)" placeholder="Brief description of this scenario" value={form.description} onChange={e => set('description', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Income Growth (%/yr)" type="number" step="0.1" value={form.annualIncomeGrowth} onChange={e => set('annualIncomeGrowth', e.target.value)} />
        <Input label="Expense Growth (%/yr)" type="number" step="0.1" value={form.annualExpenseGrowth} onChange={e => set('annualExpenseGrowth', e.target.value)} />
        <Input label="Investment Return (%/yr)" type="number" step="0.1" value={form.annualInvestmentReturn} onChange={e => set('annualInvestmentReturn', e.target.value)} />
        <Input label="Inflation (%/yr)" type="number" step="0.1" value={form.annualInflation} onChange={e => set('annualInflation', e.target.value)} />
        <Input label="Target Savings Rate (%)" type="number" step="1" value={form.targetSavingsRate} onChange={e => set('targetSavingsRate', e.target.value)} />
        <Input label="Retirement Age" type="number" step="1" value={form.retirementAge} onChange={e => set('retirementAge', e.target.value)} />
      </div>

      <div className="border border-border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-foreground">One-Time Events</p>
          <button type="button" onClick={() => setAddingEvent(true)} className="text-xs text-brand hover:underline">+ Add event</button>
        </div>
        {events.length === 0 && !addingEvent && (
          <p className="text-xs text-muted-foreground">No events — add milestones like buying a house or inheritance.</p>
        )}
        {events.map((ev, i) => (
          <div key={i} className="flex items-center justify-between text-xs bg-muted/40 rounded px-2.5 py-1.5">
            <span className="font-medium text-foreground">{ev.year} · {ev.label}</span>
            <div className="flex items-center gap-3">
              <span className={cn('tabular-nums font-medium', ev.netWorthImpact >= 0 ? 'text-positive' : 'text-negative')}>
                {ev.netWorthImpact >= 0 ? '+' : ''}{formatCurrency(ev.netWorthImpact)}
              </span>
              <button type="button" onClick={() => setEvents(es => es.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-negative">×</button>
            </div>
          </div>
        ))}
        {addingEvent && (
          <EventForm
            startYear={startYear}
            onAdd={ev => { setEvents(es => [...es, ev]); setAddingEvent(false); }}
            onCancel={() => setAddingEvent(false)}
          />
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Add Scenario</Button>
      </div>
    </form>
  );
}

export function Scenarios() {
  const { accounts, transactions, assumptions, scenarios, addScenario, deleteScenario } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const now = new Date();

  const netWorth = useMemo(() => calculateNetWorth(accounts), [accounts]);
  const summary = useMemo(() => calculateMonthSummary(transactions, now.getFullYear(), now.getMonth() + 1), [transactions]);

  const baseProjections = useMemo(() =>
    generateProjections(netWorth, summary.totalIncome * 12, summary.totalExpenses * 12, assumptions, 30),
    [netWorth, summary, assumptions]
  );

  const scenarioProjections = useMemo(() =>
    scenarios.map(sc => ({
      scenario: sc,
      projections: generateProjections(netWorth, summary.totalIncome * 12, summary.totalExpenses * 12, sc.assumptions, 30),
    })),
    [scenarios, netWorth, summary]
  );

  const chartData = baseProjections.map((bp, i) => {
    const point: Record<string, number> = { year: bp.year, 'Base Case': bp.netWorth };
    scenarioProjections.forEach(({ scenario, projections }) => {
      point[scenario.name] = projections[i]?.netWorth ?? 0;
    });
    return point;
  });

  const eventYears = useMemo(() => {
    const years = new Map<number, string[]>();
    scenarios.forEach(sc => {
      (sc.assumptions.oneTimeEvents ?? []).forEach(ev => {
        const labels = years.get(ev.year) ?? [];
        labels.push(ev.label);
        years.set(ev.year, labels);
      });
    });
    return years;
  }, [scenarios]);

  return (
    <div className="p-6 space-y-5 max-w-screen-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Compare financial trajectories under different assumptions</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={13} />New Scenario
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-1">Net Worth Projection</h2>
        <p className="text-xs text-muted-foreground mb-4">30-year trajectory — base case vs your scenarios</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={brandTokens.grid} vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: brandTokens.tick }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: brandTokens.tick }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCurrency(v, 'USD', true)} width={65} />
              <Tooltip formatter={(v: number, name: string) => [formatCurrency(v), name]} contentStyle={{ fontSize: 12, border: `1px solid ${brandTokens.border}`, borderRadius: 8, background: brandTokens.surface }} />
              <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
              {Array.from(eventYears.entries()).map(([year, labels]) => (
                <ReferenceLine
                  key={year}
                  x={year}
                  stroke={brandTokens.tick}
                  strokeDasharray="3 3"
                  label={{ value: labels[0], position: 'top', fontSize: 10, fill: brandTokens.tick }}
                />
              ))}
              <Line type="monotone" dataKey="Base Case" stroke={brandTokens.ink} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: brandTokens.ink }} />
              {scenarios.map(sc => (
                <Line key={sc.id} type="monotone" dataKey={sc.name} stroke={sc.color} strokeWidth={1.5} strokeDasharray="5 4" dot={false} activeDot={{ r: 3, fill: sc.color }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {scenarios.length === 0 && (
        <div className="bg-surface border border-border rounded-lg shadow-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">No scenarios yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Create a scenario to compare financial outcomes — new job, moving cities, buying a house.</p>
          <Button onClick={() => setModalOpen(true)}><Plus size={13} />Create First Scenario</Button>
        </div>
      )}

      {scenarios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((sc) => {
            const proj = scenarioProjections.find(p => p.scenario.id === sc.id);
            const retirementYear = sc.assumptions.retirementAge - sc.assumptions.currentAge;
            const retirementIndex = Math.max(0, Math.min(retirementYear, 29));
            const atRetirement = proj?.projections[retirementIndex]?.netWorth ?? 0;
            const baseAtRetirement = baseProjections[retirementIndex]?.netWorth ?? 0;
            const diff = atRetirement - baseAtRetirement;
            const eventCount = (sc.assumptions.oneTimeEvents ?? []).length;

            return (
              <div key={sc.id} className="bg-surface border border-border rounded-lg shadow-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: sc.color }} />
                    <p className="text-sm font-semibold text-foreground">{sc.name}</p>
                    {eventCount > 0 && (
                      <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{eventCount} event{eventCount > 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <button onClick={() => deleteScenario(sc.id)} className="p-1.5 rounded text-muted-foreground hover:text-negative hover:bg-red-50 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
                {sc.description && <p className="text-xs text-muted-foreground mb-3">{sc.description}</p>}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">At Retirement</p>
                    <p className="font-semibold text-foreground tabular-nums">{formatCurrency(atRetirement, 'USD', true)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">vs Base Case</p>
                    <p className={cn('font-semibold tabular-nums', diff >= 0 ? 'text-positive' : 'text-negative')}>
                      {diff >= 0 ? '+' : ''}{formatCurrency(diff, 'USD', true)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Return</p>
                    <p className="font-medium text-foreground">{(sc.assumptions.annualInvestmentReturn * 100).toFixed(1)}%/yr</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Retire at</p>
                    <p className="font-medium text-foreground">Age {sc.assumptions.retirementAge}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onOpenChange={setModalOpen} title="New Scenario" description="Model a different financial future and compare it to your base case.">
        <ScenarioForm
          colorIndex={scenarios.length + 1}
          onSuccess={(scenario) => { addScenario(scenario); setModalOpen(false); }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

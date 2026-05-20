import { addDays, format } from 'date-fns';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { TaxResidencySelect } from '../components/ui/TaxResidencySelect';
import {
  getCountryFromTaxResidency,
  getStateFromTaxResidency,
} from '../data/taxes/jurisdictions';
import { cn } from '../lib/utils/cn';
import { generateId } from '../lib/storage/localStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { OnboardingProfile, PayFrequency, RecurringExpense } from '../types/planning';

const TOTAL_STEPS = 5;

const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

const payFreqOptions: { value: PayFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every two weeks (Biweekly)' },
  { value: 'semimonthly', label: 'Twice a month (Semimonthly)' },
  { value: 'monthly', label: 'Monthly' },
];

interface QuickBill {
  name: string;
  amount: string;
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-1 rounded-full transition-all duration-300',
            i <= current ? 'bg-foreground' : 'bg-border',
          )}
          style={{ width: i === current ? 24 : 8 }}
        />
      ))}
    </div>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useSettingsStore();
  const { addRecurringExpense, categories, updateAssumptions } = useFinanceStore();

  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [taxResidency, setTaxResidency] = useState('US-CA');
  const [currentAge, setCurrentAge] = useState('30');
  const [retirementAge, setRetirementAge] = useState('65');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('biweekly');
  const [nextPayDate, setNextPayDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [bills, setBills] = useState<QuickBill[]>([
    { name: '', amount: '' },
    { name: '', amount: '' },
    { name: '', amount: '' },
  ]);
  const [savingsGoal, setSavingsGoal] = useState('');
  const [emergencyTarget, setEmergencyTarget] = useState('');
  const [emergencyCurrent, setEmergencyCurrent] = useState('');

  const updateBill = (index: number, field: keyof QuickBill, value: string) => {
    setBills(prev => prev.map((bill, billIndex) => (
      billIndex === index ? { ...bill, [field]: value } : bill
    )));
  };

  const next = () => setStep(value => Math.min(value + 1, TOTAL_STEPS - 1));
  const back = () => setStep(value => Math.max(value - 1, 0));

  const finish = () => {
    const country = getCountryFromTaxResidency(taxResidency);
    const state = getStateFromTaxResidency(taxResidency);
    const profile: OnboardingProfile = {
      completed: true,
      completedAt: new Date().toISOString(),
      currency,
      locale: 'en-US',
      country,
      state,
      taxResidency,
      currentAge: parseInt(currentAge, 10) || 30,
      retirementAge: parseInt(retirementAge, 10) || 65,
      monthlyIncome: parseFloat(monthlyIncome) || 0,
      payFrequency,
      nextPayDate,
      savingsGoalMonthly: parseFloat(savingsGoal) || 0,
      emergencyFundTarget: parseFloat(emergencyTarget) || 0,
      emergencyFundCurrent: parseFloat(emergencyCurrent) || 0,
    };

    completeOnboarding(profile);
    updateAssumptions({
      currentAge: profile.currentAge,
      retirementAge: profile.retirementAge,
    });

    const expenseCategory = categories.find(category => category.type === 'expense')?.id ?? '';
    bills.forEach(bill => {
      if (!bill.name.trim() || !bill.amount) return;

      const expense: RecurringExpense = {
        id: generateId(),
        name: bill.name.trim(),
        amount: parseFloat(bill.amount) || 0,
        categoryId: expenseCategory,
        accountId: '',
        recurrence: 'monthly',
        nextDueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        autopay: false,
        status: 'upcoming',
      };
      addRecurringExpense(expense);
    });

    navigate('/');
  };

  const steps = [
    <div key="welcome" className="space-y-5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Welcome to Flint</h2>
        <p className="text-sm text-muted-foreground mt-1">Let's set up your financial profile. This takes about 2 minutes.</p>
      </div>
      <Select label="Currency" value={currency} onValueChange={setCurrency} options={currencyOptions} />
      <TaxResidencySelect value={taxResidency} onValueChange={setTaxResidency} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Current Age" type="number" min="18" max="100" value={currentAge} onChange={e => setCurrentAge(e.target.value)} />
        <Input label="Retirement Age" type="number" min="50" max="100" value={retirementAge} onChange={e => setRetirementAge(e.target.value)} />
      </div>
    </div>,

    <div key="income" className="space-y-5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Your Income</h2>
        <p className="text-sm text-muted-foreground mt-1">Tell us about your paycheck so we can build your budget.</p>
      </div>
      <Input label="Monthly Take-Home Income" type="number" placeholder="0.00" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} hint="After taxes and deductions" />
      <Select label="Pay Frequency" value={payFrequency} onValueChange={value => setPayFrequency(value as PayFrequency)} options={payFreqOptions} />
      <Input label="Next Pay Date" type="date" value={nextPayDate} onChange={e => setNextPayDate(e.target.value)} />
    </div>,

    <div key="bills" className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Fixed Monthly Bills</h2>
        <p className="text-sm text-muted-foreground mt-1">Add your biggest recurring expenses - rent, car payment, subscriptions.</p>
      </div>
      {bills.map((bill, index) => (
        <div key={index} className="grid grid-cols-3 gap-3 items-end">
          <div className="col-span-2">
            <Input
              label={index === 0 ? 'Bill name' : undefined}
              placeholder={['Rent / Mortgage', 'Car Payment', 'Insurance'][index]}
              value={bill.name}
              onChange={e => updateBill(index, 'name', e.target.value)}
            />
          </div>
          <Input
            label={index === 0 ? 'Monthly' : undefined}
            type="number"
            placeholder="0"
            value={bill.amount}
            onChange={e => updateBill(index, 'amount', e.target.value)}
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">You can add more bills later in the bills page.</p>
    </div>,

    <div key="goals" className="space-y-5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Savings and Goals</h2>
        <p className="text-sm text-muted-foreground mt-1">Set your savings targets. You can always adjust these later.</p>
      </div>
      <Input label="Monthly Savings Goal" type="number" placeholder="500" value={savingsGoal} onChange={e => setSavingsGoal(e.target.value)} hint="How much do you want to save each month?" />
      <Input label="Emergency Fund Target" type="number" placeholder="15000" value={emergencyTarget} onChange={e => setEmergencyTarget(e.target.value)} hint="3-6 months of expenses is ideal" />
      <Input label="Current Emergency Fund" type="number" placeholder="0" value={emergencyCurrent} onChange={e => setEmergencyCurrent(e.target.value)} hint="How much do you have saved right now?" />
    </div>,

    <div key="done" className="space-y-5 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
          <CheckCircle size={28} className="text-positive" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-foreground">You're all set</h2>
      <p className="text-sm text-muted-foreground">Your financial profile is ready. Flint will use these details to personalize your dashboard and projections.</p>
      {monthlyIncome && (
        <div className="bg-muted rounded-lg p-4 text-left space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Summary</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <span className="text-muted-foreground">Monthly income</span>
            <span className="font-medium text-foreground">${parseFloat(monthlyIncome || '0').toLocaleString()}</span>
            <span className="text-muted-foreground">Pay frequency</span>
            <span className="font-medium text-foreground capitalize">{payFrequency}</span>
            {savingsGoal && (
              <>
                <span className="text-muted-foreground">Savings goal</span>
                <span className="font-medium text-foreground">${parseFloat(savingsGoal).toLocaleString()}/mo</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>,
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">F</span>
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">Flint</span>
        </div>

        <StepIndicator current={step} total={TOTAL_STEPS} />

        <div className="animate-fade-in">
          {steps[step]}
        </div>

        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <Button variant="ghost" onClick={back}>
              <ChevronLeft size={14} />
              Back
            </Button>
          ) : <div />}

          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={next}>
              {step === 0 ? 'Get Started' : 'Continue'}
              <ChevronRight size={14} />
            </Button>
          ) : (
            <Button onClick={finish}>
              Open Flint
              <ChevronRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

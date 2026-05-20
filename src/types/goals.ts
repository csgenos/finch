export type GoalCategory =
  | 'emergency_fund'
  | 'vacation'
  | 'home'
  | 'education'
  | 'retirement'
  | 'car'
  | 'debt_payoff'
  | 'other';

export interface Goal {
  id: string;
  name: string;
  category: GoalCategory;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;   // YYYY-MM-DD
  accountId?: string;
  notes?: string;
  createdAt: string;
}

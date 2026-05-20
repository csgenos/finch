import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Dashboard } from '../pages/Dashboard';
import { Budget } from '../pages/Budget';
import { Transactions } from '../pages/Transactions';
import { Goals } from '../pages/Goals';
import { Bills } from '../pages/Bills';
import { Paychecks } from '../pages/Paychecks';
import { CashflowForecast } from '../pages/CashflowForecast';
import { Projections } from '../pages/Projections';
import { MonteCarlo } from '../pages/MonteCarlo';
import { Taxes } from '../pages/Taxes';
import { Scenarios } from '../pages/Scenarios';
import { ImportExport } from '../pages/ImportExport';
import { Settings } from '../pages/Settings';
import { Onboarding } from '../pages/Onboarding';
import { useSettingsStore } from '../store/useSettingsStore';

function RequireOnboarding() {
  const onboarding = useSettingsStore(s => s.onboarding);
  return onboarding?.completed ? <AppShell /> : <Navigate to="/onboarding" replace />;
}

function OnboardingEntry() {
  const onboarding = useSettingsStore(s => s.onboarding);
  return onboarding?.completed ? <Navigate to="/" replace /> : <Onboarding />;
}

export const router = createBrowserRouter([
  {
    path: '/onboarding',
    element: <OnboardingEntry />,
  },
  {
    path: '/',
    element: <RequireOnboarding />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'goals', element: <Goals /> },
      { path: 'budget', element: <Budget /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'bills', element: <Bills /> },
      { path: 'paychecks', element: <Paychecks /> },
      { path: 'cashflow', element: <CashflowForecast /> },
      { path: 'projections', element: <Projections /> },
      { path: 'monte-carlo', element: <MonteCarlo /> },
      { path: 'taxes', element: <Taxes /> },
      { path: 'scenarios', element: <Scenarios /> },
      { path: 'import', element: <ImportExport /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);

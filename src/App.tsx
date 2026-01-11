import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { LogOut, Download } from 'lucide-react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import type { Expense, ExpenseFilters, ExpenseCategory } from './types/expense';
import ExpenseForm from './components/ExpenseForm';
import DashboardStats from './components/DashboardStats';
import TransactionList from './components/TransactionList';
import Filters from './components/Filters';
import ThemeToggle from './components/ThemeToggle';
import { CategoryPieChart, CategoryBarChart, TrendLineChart } from './components/Charts';
import { filterExpenses, getTotal, getTodayTotal } from './utils/helpers';

const THEME_KEY = 'expense-tracker-theme';

import LandingPage from './components/LandingPage';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [isDark, setIsDark] = useState(false);

  const handleExport = () => {
    if (expenses.length === 0) return;
    const dataToExport = filteredExpenses.length > 0 ? filteredExpenses : expenses;
    import('./utils/export').then(mod => mod.exportToExcel(dataToExport, `expenses-${new Date().toISOString().split('T')[0]}.xlsx`));
  };


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch expenses and subscribe to changes
  useEffect(() => {
    if (!session?.user) {
      setExpenses([]);
      return;
    }

    const fetchExpenses = async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('createdAt', { ascending: true });

      if (error) {
        console.error('Error fetching expenses:', error);
      } else {
        setExpenses(data || []);
      }
    };

    fetchExpenses();

    // Debugging: Log subscription attempt
    console.log('Attempting to subscribe to expenses for user:', session.user.id);

    const subscription = supabase
      .channel('expenses_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          // Removed client-side filter to rely on RLS policies for broadcasting.
          // This often fixes issues where the filter string string doesn't match perfectly.
        },
        (payload) => {
          console.log('Realtime event received:', payload); // Debug log
          if (payload.eventType === 'INSERT') {
            setExpenses((prev) => {
              // Prevent duplicate insertion from optimistic update
              if (prev.some(e => e.id === payload.new.id)) return prev;

              // Fix: Parse numeric fields from string (Supabase JSON) to number
              const newExpense = {
                ...payload.new,
                amount: Number(payload.new.amount),
                createdAt: Number(payload.new.createdAt)
              } as Expense;

              return [...prev, newExpense];
            });
          } else if (payload.eventType === 'DELETE') {
            setExpenses((prev) => prev.filter((expense) => expense.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setExpenses((prev) =>
              prev.map((expense) => {
                if (expense.id === payload.new.id) {
                  return {
                    ...payload.new,
                    amount: Number(payload.new.amount),
                    createdAt: Number(payload.new.createdAt)
                  } as Expense;
                }
                return expense;
              })
            );
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Subscription status:', status);
        if (err) console.error('Subscription error:', err);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [session]);

  const addExpense = async (expenseData: {
    amount: number;
    category: ExpenseCategory;
    date: string;
    note?: string;
  }) => {
    if (!session?.user) return;

    // 1. Optimistic Update (Immediate Feedback)
    const tempId = crypto.randomUUID();
    const newExpense: Expense = {
      ...expenseData,
      id: tempId, // Temporary ID, will be replaced by real ID from DB if we were refetching, but subscription handles it
      user_id: session.user.id,
      createdAt: Date.now(),
    };

    setExpenses((prev) => [...prev, newExpense]);

    // 2. Database Insert
    const { error } = await supabase.from('expenses').insert([newExpense]);

    if (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
      // Rollback optimistic update on error
      setExpenses((prev) => prev.filter((e) => e.id !== tempId));
    }
  };

  const deleteExpense = async (id: string) => {
    // 1. Optimistic Update
    const prevExpenses = [...expenses];
    setExpenses((prev) => prev.filter((e) => e.id !== id));

    // 2. Database Delete
    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense.');
      // Rollback
      setExpenses(prevExpenses);
    }
  };

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const filteredExpenses = filterExpenses(expenses, filters);
  const totalExpenses = getTotal(filteredExpenses);
  const todayExpenses = getTodayTotal(filteredExpenses);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || session.user.role !== 'authenticated') {
    if (showLogin) {
      return (
        <div className="relative">
          <button
            onClick={() => setShowLogin(false)}
            className={`absolute top-4 left-4 z-50 p-2 rounded-full ${isDark ? 'text-white hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Back
          </button>
          <Login isDark={isDark} />
        </div>
      );
    }
    return <LandingPage onGetStarted={() => setShowLogin(true)} isDark={isDark} />;
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-white to-green-50'
        }`}
    >
      <div className="w-full px-4 sm:px-8 py-4 flex justify-between items-center z-50">
        <div>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>

        <div>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md transition-all duration-300 ${isDark
              ? 'bg-gray-800/50 text-red-500 hover:bg-gray-700/50'
              : 'bg-white/50 text-red-600 hover:bg-white/80'
              } shadow-lg border ${isDark ? 'border-gray-700' : 'border-white/20'
              } hover:scale-105 active:scale-95`}
            title="Sign Out"
          >
            <span className="font-semibold">Logout</span>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
        <header className="mb-8 sm:mb-12 text-center">
          <h1
            className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-3 bg-gradient-to-r from-blue-500 via-green-500 to-cyan-500 bg-clip-text text-transparent animate-gradient`}
          >
            Expense Tracker
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Welcome, {session.user.email}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-1 space-y-6">
            <ExpenseForm onAddExpense={addExpense} isDark={isDark} />
          </div>

          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <div className="space-y-6">
              <Filters
                filters={filters}
                onFilterChange={setFilters}
                onExport={handleExport}
                isDark={isDark}
              />

              <DashboardStats
                total={totalExpenses}
                todayTotal={todayExpenses}
                expenseCount={filteredExpenses.length}
                isDark={isDark}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div
                className={`${isDark
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white/70 border-white/20'
                  } backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border`}
              >
                <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                  Category Breakdown
                </h3>
                <CategoryPieChart expenses={filteredExpenses} isDark={isDark} />
              </div>

              <div
                className={`${isDark
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white/70 border-white/20'
                  } backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border`}
              >
                <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                  Spending by Category
                </h3>
                <CategoryBarChart expenses={filteredExpenses} isDark={isDark} />
              </div>
            </div>

            <div
              className={`${isDark
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-white/70 border-white/20'
                } backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border`}
            >
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                7-Day Spending Trend
              </h3>
              <TrendLineChart expenses={filteredExpenses} isDark={isDark} />
            </div>

            <TransactionList
              expenses={filteredExpenses}
              onDelete={deleteExpense}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

"use client";

import { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PiggyBank,
  BarChart3,
  PieChart,
  Target,
} from "lucide-react";
import { Transaction, SavingsGoal } from "../types";
import { formatMoney } from "../utils/money";
import {
  filterTransactionsByMonth,
  calculateMonthlyTotals,
  calculateSavings,
  calculateGoalProgress,
} from "../utils/calculations";

interface AnalyticsClientProps {
  currentDate: Date;
  transactions: Transaction[];
  monthlyBudget: number;
  goals: SavingsGoal[];
  categoryTotals: Record<string, number>;
  trendData: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

export function AnalyticsClient({
  currentDate: initialDate,
  transactions,
  monthlyBudget,
  goals,
  categoryTotals,
  trendData,
}: AnalyticsClientProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);

  const currentMonthTransactions = filterTransactionsByMonth(
    transactions,
    currentDate
  );
  const previousMonthTransactions = filterTransactionsByMonth(
    transactions,
    subMonths(currentDate, 1)
  );

  const currentTotals = calculateMonthlyTotals(currentMonthTransactions);
  const previousTotals = calculateMonthlyTotals(previousMonthTransactions);
  const { netSavings, savingsRate } = calculateSavings(
    currentTotals.income,
    currentTotals.expenses
  );

  // Chart data preparation
  const categoryChartData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        data: Object.values(categoryTotals),
        backgroundColor: [
          "#8B4513",
          "#A0522D",
          "#B8860B",
          "#CD853F",
          "#D2691E",
          "#DEB887",
        ],
        borderWidth: 0,
      },
    ],
  };

  const trendChartData = {
    labels: trendData.map((d) => d.month),
    datasets: [
      {
        label: "Income",
        data: trendData.map((d) => d.income),
        borderColor: "#22C55E",
        backgroundColor: "#22C55E20",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Expenses",
        data: trendData.map((d) => d.expenses),
        borderColor: "#EF4444",
        backgroundColor: "#EF444420",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white/80 rounded-2xl p-6 backdrop-blur-sm">
        <button
          onClick={() => setCurrentDate((prev) => subMonths(prev, 1))}
          className="p-2 hover:bg-[#8B4513]/5 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#8B4513]" />
        </button>
        <h2 className="text-2xl font-semibold text-[#8B4513]">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => setCurrentDate((prev) => addMonths(prev, 1))}
          className="p-2 hover:bg-[#8B4513]/5 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#8B4513]" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="bg-white/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-xl">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#8B4513]/70">Income</h3>
              <p className="text-2xl font-semibold text-green-600">
                {formatMoney(currentTotals.income)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {currentTotals.income > previousTotals.income ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className="text-[#8B4513]/60">vs last month</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-xl">
              <Wallet className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#8B4513]/70">
                Expenses
              </h3>
              <p className="text-2xl font-semibold text-red-600">
                {formatMoney(currentTotals.expenses)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {currentTotals.expenses < previousTotals.expenses ? (
              <TrendingDown className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingUp className="w-4 h-4 text-red-500" />
            )}
            <span className="text-[#8B4513]/60">vs last month</span>
          </div>
        </div>

        {/* Savings Card */}
        <div className="bg-white/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <PiggyBank className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#8B4513]/70">
                Net Savings
              </h3>
              <p
                className={`text-2xl font-semibold ${
                  netSavings >= 0 ? "text-blue-600" : "text-red-600"
                }`}
              >
                {formatMoney(netSavings)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`font-medium ${
                savingsRate >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {savingsRate.toFixed(1)}%
            </span>
            <span className="text-[#8B4513]/60">savings rate</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Goals and Categories */}
      <div className="grid grid-cols-2 gap-6">
        {/* Savings Goals Progress */}
        <div className="bg-white/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#8B4513]/10 rounded-xl">
              <Target className="w-5 h-5 text-[#8B4513]" />
            </div>
            <h3 className="text-lg font-medium text-[#8B4513]">
              Savings Goals Progress
            </h3>
          </div>
          <div className="space-y-6">
            {goals.map((goal) => {
              const { percentage, isComplete } = calculateGoalProgress(
                goal.current_amount,
                goal.target_amount
              );

              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#8B4513]">
                      {goal.name}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isComplete ? "text-green-600" : "text-[#8B4513]"
                      }`}
                    >
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#8B4513]/70">
                    <span>{formatMoney(goal.current_amount)}</span>
                    <span>of</span>
                    <span>{formatMoney(goal.target_amount)}</span>
                  </div>
                  <div className="h-2 bg-[#8B4513]/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? "bg-green-500" : "bg-[#8B4513]"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#8B4513]/10 rounded-xl">
              <BarChart3 className="w-5 h-5 text-[#8B4513]" />
            </div>
            <h3 className="text-lg font-medium text-[#8B4513]">
              Spending by Category
            </h3>
          </div>
          <div className="space-y-4">
            {Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-[#8B4513]">
                      {category}
                    </span>
                    <span className="text-[#8B4513]">
                      {formatMoney(amount)}
                    </span>
                  </div>
                  <div className="h-2 bg-[#8B4513]/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8B4513] rounded-full transition-all duration-500"
                      style={{
                        width: `${(amount / currentTotals.expenses) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#8B4513]/10 rounded-xl">
              <PieChart className="w-5 h-5 text-[#8B4513]" />
            </div>
            <h3 className="text-lg font-medium text-[#8B4513]">
              Spending Distribution
            </h3>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            <Pie
              data={categoryChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      usePointStyle: true,
                      padding: 20,
                      font: {
                        size: 12,
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Income vs Expenses Trend */}
        <div className="bg-white/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#8B4513]/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-[#8B4513]" />
            </div>
            <h3 className="text-lg font-medium text-[#8B4513]">
              Income vs Expenses
            </h3>
          </div>
          <div className="h-[300px]">
            <Line
              data={trendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      usePointStyle: true,
                      padding: 20,
                      font: {
                        size: 12,
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: "#8B451310",
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

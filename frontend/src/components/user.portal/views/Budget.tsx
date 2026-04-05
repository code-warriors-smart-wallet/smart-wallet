import { useParams } from "react-router-dom";
import axios from "axios";
import Button from "../../Button";
import { useEffect, useState } from "react";
import { capitalize, toStrdSpaceType } from "../../../utils/utils";
import { TransactionType } from "./Transactions";
import { CategoryService } from "../../../services/category.service";
import { BudgetService } from "../../../services/budget.service";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store/store";
import BudgetList from "./Budgets/BudgetList";
import BudgetModal from "./Budgets/BudgetModal";
import UpdateBudgetModal from "./Budgets/UpdateBudgetModal";
import { PieChart, Calendar, TrendingUp, Donut } from "lucide-react";
import Loading from "../../../components/Loading";

export enum BudgetType {
  ONE_TIME = "ONE_TIME",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY"
}

interface BudgetInfo {
  name: string;
  amount: number;
  type: BudgetType;
  mainCategoryId: string;
  subCategoryIds: string[];
  spaceIds: string[];
  spaceTypes: string[];
  startDate: string;
  endDate: string;
}

interface BackendCategory {
  parentCategoryId: string;
  parentCategory: string;
  spaces: string[];
  color: string;
  subCategoryId: string;
  subCategoryName: string;
  transactionTypes: TransactionType[];
  subCategoryColor: string;
  userId?: string;
}

interface BudgetItem {
  _id: string;
  name: string;
  amount: number | { $numberDecimal: string };
  spent?: number;
  type: BudgetType;
  mainCategoryId: string;
  subCategoryIds: string[];
  spaceIds: string[];
  spaceTypes: string[];
  isMultiSpace: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  entries?: any[];
  currentEntry?: any;
}

interface BudgetWithSpending extends BudgetItem {
  spent: number;
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
  spendingData?: any;
  currentEntry?: any;
  entries?: any[];
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface PieChartComponentProps {
  data: Array<{
    label: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  totalSpent: number;
  currency: string;
  title?: string;
}

// Helper function to get decimal amount from budget
const getBudgetAmount = (amount: number | { $numberDecimal: string }): number => {
  if (typeof amount === 'number') {
    return amount;
  } else if (amount && typeof amount === 'object' && '$numberDecimal' in amount) {
    return parseFloat(amount.$numberDecimal);
  }
  return 0;
};

const getStartOfDay = (date: Date): Date => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start;
};

// Helper function to get end of day (23:59:59.999)
const getEndOfDay = (date: Date): Date => {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
};

// function to get start of week (Monday)
const getStartOfWeek = (date: Date): Date => {
  const day = date.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday

  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff));
  return getStartOfDay(start);
};

// function to get end of week (Sunday)
const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(new Date(date));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return getEndOfDay(end);
};

// function to get start of month (1st day)
const getStartOfMonth = (date: Date): Date => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return getStartOfDay(start);
};

// function to get end of month (last day)
const getEndOfMonth = (date: Date): Date => {
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return getEndOfDay(end);
};

const formatDateForDisplay = (date: Date): string => {
  return date.toISOString();
};

// Calculate start and end dates based on budget type
const calculateBudgetDates = (budgetType: BudgetType, selectedDate?: string): { startDate: string; endDate: string } => {
  const baseDate = selectedDate ? new Date(selectedDate) : new Date();
  let startDate: Date;
  let endDate: Date;

  switch (budgetType) {
    case BudgetType.ONE_TIME:
      startDate = getStartOfDay(baseDate);
      if (selectedDate) {
        endDate = getEndOfDay(baseDate);
      } else {
        endDate = getEndOfDay(baseDate);
      }
      break;

    case BudgetType.WEEKLY:
      startDate = getStartOfWeek(baseDate);
      endDate = getEndOfWeek(baseDate);
      break;

    case BudgetType.MONTHLY:
      startDate = getStartOfMonth(baseDate);
      endDate = getEndOfMonth(baseDate);
      break;

    default:
      startDate = getStartOfDay(baseDate);
      endDate = getEndOfDay(baseDate);
  }

  return {
    startDate: formatDateForDisplay(startDate),
    endDate: formatDateForDisplay(endDate)
  };
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-[1000] grid place-items-center bg-black/50 overflow-auto p-4">
      <div className="relative w-full max-w-md rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-6">
        <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
          {title}
        </div>

        <div className="pb-6">
          <p className="text-text-light-primary dark:text-text-dark-primary">
            {message}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end space-x-3">
          <Button
            text={cancelText}
            className="max-w-fit cursor-pointer"
            priority="secondary"
            onClick={onClose}
            type="button"
          />
          <Button
            text={confirmText}
            className="max-w-fit hover:!bg-red-600 !bg-red-500 cursor-pointer"
            onClick={onConfirm}
            type="button"
          />
        </div>
      </div>
    </div>
  );
};

// Helper function to get space name
const getSpaceName = (spaceId: string, spaces: Array<{ id: string; name: string; type: string }>): string => {
  const space = spaces.find(space => space.id === spaceId);
  return space ? capitalize(space.name) : "Unknown Space";
};

const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  totalSpent,
  currency,
  title = "Spending by Category"
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <Donut size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-text-light-secondary dark:text-text-dark-secondary">
          No spending data available for categories
        </p>
      </div>
    );
  }

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Generate SVG pie chart
  const radius = 120;
  const strokeWidth = 30;
  const innerRadius = radius - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const dashArray = (percentage / 100) * circumference;
    const dashOffset = circumference - dashArray;
    const rotation = accumulatedAngle;

    accumulatedAngle += angle;

    return {
      ...item,
      dashArray,
      dashOffset,
      rotation,
      angle,
      startAngle: accumulatedAngle - angle,
      endAngle: accumulatedAngle
    };
  });

  // Find the largest segment
  const largestSegment = data.reduce((max, item) =>
    item.value > max.value ? item : max, data[0]
  );

  return (
    <div className="bg-bg-light-primary dark:bg-bg-dark-primary rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-6 flex items-center gap-2">
        <PieChart size={24} className="text-primary" />
        {title}
      </h3>

      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Pie Chart Visualization */}
        <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
          <svg width={radius * 2} height={radius * 2}>
            {segments.map((segment, index) => {
              const startAngle = (segment.startAngle - 90) * (Math.PI / 180);
              const endAngle = (segment.endAngle - 90) * (Math.PI / 180);

              const largeArcFlag = segment.angle > 180 ? 1 : 0;

              const x1 = radius + radius * Math.cos(startAngle);
              const y1 = radius + radius * Math.sin(startAngle);

              const x2 = radius + radius * Math.cos(endAngle);
              const y2 = radius + radius * Math.sin(endAngle);

              // Special case for single segment (full circle)
              let pathData;
              if (data.length === 1) {
                // For single category, create a full circle donut
                const outerRadius = radius;
                const innerRadiusRatio = 0.7;
                const innerRadiusValue = outerRadius * innerRadiusRatio;

                // Create donut path: Outer circle to inner circle
                pathData = `
                  M ${radius} ${radius - outerRadius}
                  A ${outerRadius} ${outerRadius} 0 1 1 ${radius} ${radius + outerRadius}
                  A ${outerRadius} ${outerRadius} 0 1 1 ${radius} ${radius - outerRadius}
                  Z
                  M ${radius} ${radius - innerRadiusValue}
                  A ${innerRadiusValue} ${innerRadiusValue} 0 1 1 ${radius} ${radius + innerRadiusValue}
                  A ${innerRadiusValue} ${innerRadiusValue} 0 1 1 ${radius} ${radius - innerRadiusValue}
                  Z
                `;
              } else {
                // For multiple categories, use normal donut segment logic
                const outerRadius = radius;
                const innerRadiusValue = innerRadius;

                // Outer arc points
                const outerX1 = radius + outerRadius * Math.cos(startAngle);
                const outerY1 = radius + outerRadius * Math.sin(startAngle);
                const outerX2 = radius + outerRadius * Math.cos(endAngle);
                const outerY2 = radius + outerRadius * Math.sin(endAngle);

                // Inner arc points (for donut hole)
                const innerX1 = radius + innerRadiusValue * Math.cos(endAngle);
                const innerY1 = radius + innerRadiusValue * Math.sin(endAngle);
                const innerX2 = radius + innerRadiusValue * Math.cos(startAngle);
                const innerY2 = radius + innerRadiusValue * Math.sin(startAngle);

                // Create donut segment path
                pathData = `
                  M ${outerX1} ${outerY1}
                  A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}
                  L ${innerX1} ${innerY1}
                  A ${innerRadiusValue} ${innerRadiusValue} 0 ${largeArcFlag} 0 ${innerX2} ${innerY2}
                  Z
                `;
              }

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={segment.color}
                  opacity={
                    hoveredSegment === null || hoveredSegment === index ? 1 :
                      data.length === 1 ? 1 : 0.7
                  }
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredSegment(index)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  stroke="white"
                  strokeWidth={data.length === 1 ? "0" : "1"}
                />
              );
            })}

            {/* Center text - Always show 100% for budget usage */}
            <text
              x={radius}
              y={radius - 10}
              textAnchor="middle"
              className="text-2xl font-bold fill-text-light-primary dark:fill-text-dark-primary"
            >
              100%
            </text>

            <text
              x={radius}
              y={radius + 15}
              textAnchor="middle"
              className="text-sm fill-text-light-secondary dark:fill-text-dark-secondary"
            >
              of budget
            </text>
          </svg>

          {/* Hover effect tooltip */}
          {hoveredSegment !== null && (
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-bg-light-secondary dark:bg-bg-dark-secondary p-4 rounded-lg shadow-lg z-10 min-w-[200px]"
              style={{
                left: `${radius + Math.cos((segments[hoveredSegment].startAngle + segments[hoveredSegment].angle / 2) * Math.PI / 180) * (radius * 0.7)}px`,
                top: `${radius + Math.sin((segments[hoveredSegment].startAngle + segments[hoveredSegment].angle / 2) * Math.PI / 180) * (radius * 0.7)}px`
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: data[hoveredSegment].color }}
                />
                <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                  {data[hoveredSegment].label}
                </span>
              </div>
              <div className="text-sm">
                <p className="text-text-light-primary dark:text-text-dark-primary">
                  {currency} {data[hoveredSegment].value.toFixed(2)}
                </p>
                <p className="text-text-light-secondary dark:text-text-dark-secondary">
                  {data[hoveredSegment].percentage.toFixed(1)}% of total spending
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Legend and Details */}
        <div className="flex-1 min-w-0">
          {/* Top Spending Summary */}
          <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Largest Category
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: largestSegment.color }}
                />
                <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                  {largestSegment.label}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                {currency} {largestSegment.value.toFixed(2)}
              </span>
              <span className="text-lg font-semibold text-primary">
                {largestSegment.percentage.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Category Breakdown List */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {data.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer ${hoveredSegment === index
                  ? 'bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm'
                  : 'hover:bg-bg-light-secondary/50 dark:hover:bg-bg-dark-secondary/50'
                  }`}
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      {item.label}
                    </span>
                    <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    {currency} {item.value.toFixed(2)}
                  </div>
                  <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border-light-primary dark:border-border-dark-primary">
            <div>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Total Categories
              </p>
              <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                {data.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Total Spending
              </p>
              <p className="text-lg font-bold text-primary">
                {currency} {totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Budget Detail Modal Component
interface BudgetDetailModalProps {
  budget: BudgetItem;
  spendingData: any;
  categories: BackendCategory[];
  currency: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateAmount: (scope: 'current' | 'future' | 'all') => void;
  getSpaceName: (spaceId: string) => string;
}

const BudgetDetailModal: React.FC<BudgetDetailModalProps> = ({
  budget,
  spendingData,
  categories,
  currency,
  onClose,
  onEdit,
  onDelete,
  onUpdateAmount,
  getSpaceName
}) => {
  const [showUpdateBudgetModal, setShowUpdateBudgetModal] = useState(false);

  const currentEntry = budget.currentEntry || spendingData?.currentEntry;

  const startDate = currentEntry?.start_date ? new Date(currentEntry.start_date) :
    budget.startDate ? new Date(budget.startDate) : new Date();
  const endDate = currentEntry?.end_date ? new Date(currentEntry.end_date) :
    budget.endDate ? new Date(budget.endDate) : new Date();

  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Transform categories for easier access
  const transformCategories = (backendCategories: BackendCategory[]): any[] => {
    const categoryMap = new Map();

    backendCategories.forEach(cat => {
      if (!categoryMap.has(cat.parentCategoryId)) {
        categoryMap.set(cat.parentCategoryId, {
          _id: cat.parentCategoryId,
          parentCategory: cat.parentCategory,
          color: cat.color,
          spaces: cat.spaces,
          subCategories: []
        });
      }

      const category = categoryMap.get(cat.parentCategoryId);
      category.subCategories.push({
        _id: cat.subCategoryId,
        name: cat.subCategoryName,
        color: cat.subCategoryColor,
        transactionTypes: cat.transactionTypes
      });
    });

    return Array.from(categoryMap.values());
  };

  const transformedCategories = transformCategories(categories);
  const mainCategory = transformedCategories.find(cat => cat._id === budget.mainCategoryId);
  const budgetAmount = currentEntry ?
    getBudgetAmount(currentEntry.amount || currentEntry.amount) :
    getBudgetAmount(budget.amount);

  // Calculate values from spendingData
  const spent = spendingData?.totalSpent || budget.spent || currentEntry?.spent || 0;
  const percentage = spendingData?.percentage ||
    (budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0);
  const remaining = spendingData?.remainingAmount || Math.max(0, budgetAmount - spent);
  const categoryBreakdown = spendingData?.categoryBreakdown || [];

  const trendEntries = spendingData?.trendData || budget.entries || [];

  // Get category color for the progress bar
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-orange-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const prepareTrendData = () => {
    if (!trendEntries || trendEntries.length === 0) {
      return { displayData: [], periodLabel: '', totalBudgetAmount: 0, totalSpent: 0 };
    }

    let displayEntries = [];
    let totalBudgetAmount = 0;
    let totalSpent = 0;

    switch (budget.type) {
      case BudgetType.MONTHLY:
        // Get last 12 months
        displayEntries = trendEntries
          .slice()
          .sort((a: any, b: any) =>
            new Date(a.start_date || a.period).getTime() -
            new Date(b.start_date || b.period).getTime()
          )
          .slice(-12);

        displayEntries.forEach((entry: any) => {
          totalBudgetAmount += getBudgetAmount(entry.amount);
          totalSpent += entry.spent || 0;
        });
        break;

      case BudgetType.WEEKLY:
        // Get last 12 weeks
        displayEntries = trendEntries
          .slice()
          .sort((a: any, b: any) =>
            new Date(a.start_date || a.period).getTime() -
            new Date(b.start_date || b.period).getTime()
          )
          .slice(-12);

        displayEntries.forEach((entry: any) => {
          totalBudgetAmount += getBudgetAmount(entry.amount);
          totalSpent += entry.spent || 0;
        });
        break;

      case BudgetType.ONE_TIME:
        // For one-time budgets, show all entries for the entire period
        // Sort by date and use all available entries
        displayEntries = trendEntries
          .slice()
          .sort((a: any, b: any) =>
            new Date(a.start_date || a.period).getTime() -
            new Date(b.start_date || b.period).getTime()
          );

        // For long one-time budgets, limit display for readability
        if (displayEntries.length > 12) {
          displayEntries = displayEntries.slice(-12);
        }

        // Calculate totals from display entries
        displayEntries.forEach((entry: any) => {
          totalBudgetAmount += getBudgetAmount(entry.amount);
          totalSpent += entry.spent || 0;
        });
        break;

      default:
        displayEntries = trendEntries.slice(-12);
    }

    const displayData = displayEntries.map((entry: any, index: number) => {
      const entryAmount = getBudgetAmount(entry.amount);
      const entrySpent = entry.spent || 0;
      const spentPercentage = entryAmount > 0 ? (entrySpent / entryAmount) * 100 : 0;

      let periodLabel = '';
      let periodDates = '';

      // Format labels based on budget type
      const startDate = new Date(entry.start_date || entry.period);
      const endDate = entry.end_date ? new Date(entry.end_date) : startDate;

      switch (budget.type) {
        case BudgetType.MONTHLY:
          // Format: "DEC 2025", "JAN 2026" (Month Year)
          const monthlyYear = startDate.getUTCFullYear();
          const monthlyMonth = startDate.getUTCMonth();

          // Map month number to short name
          const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
            'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

          periodLabel = `${monthNames[monthlyMonth]} ${monthlyYear}`;
          periodDates = periodLabel;
          break;

        case BudgetType.WEEKLY:
          // Format: "15-21 DEC" or "15 DEC-21 DEC" (day ranges)
          const startDay = startDate.getUTCDate();
          const startMonth = startDate.getUTCMonth();
          const endDay = endDate.getUTCDate();
          const endMonth = endDate.getUTCMonth();

          const monthNamesShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
            'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

          const startMonthName = monthNamesShort[startMonth];
          const endMonthName = monthNamesShort[endMonth];

          if (startMonth === endMonth) {
            periodLabel = `${startDay}-${endDay} ${startMonthName}`;
          } else {
            periodLabel = `${startDay} ${startMonthName}-${endDay} ${endMonthName}`;
          }
          periodDates = periodLabel;
          break;

        case BudgetType.ONE_TIME:
          const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;

          const monthNamesOneTime = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
            'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

          const startMonthOneTime = startDate.getUTCMonth();
          const startDayOneTime = startDate.getUTCDate();
          const endMonthOneTime = endDate.getUTCMonth();
          const endDayOneTime = endDate.getUTCDate();

          if (totalDays <= 30) {
            // Daily granularity: "15 DEC"
            periodLabel = `${startDayOneTime} ${monthNamesOneTime[startMonthOneTime]}`;
            periodDates = periodLabel;
          } else if (totalDays <= 90) {
            // Weekly granularity
            const weekNum = Math.floor((startDayOneTime - 1) / 7) + 1;
            periodLabel = `Week ${weekNum} (${monthNamesOneTime[startMonthOneTime]})`;
            periodDates = `${startDayOneTime} ${monthNamesOneTime[startMonthOneTime]}-${endDayOneTime} ${monthNamesOneTime[endMonthOneTime]}`;
          } else {
            // Monthly granularity: "DEC 2025"
            const yearOneTime = startDate.getUTCFullYear();
            periodLabel = `${monthNamesOneTime[startMonthOneTime]} ${yearOneTime}`;
            periodDates = periodLabel;
          }
          break;

        default:
          periodLabel = `Entry ${index + 1}`;
      }

      return {
        ...entry,
        entryAmount,
        entrySpent,
        spentPercentage,
        periodLabel,
        periodDates,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    });

    let periodLabel = '';
    switch (budget.type) {
      case BudgetType.MONTHLY:
        periodLabel = 'Month';
        break;
      case BudgetType.WEEKLY:
        periodLabel = 'Week';
        break;
      case BudgetType.ONE_TIME:
        if (displayData.length <= 30) periodLabel = 'Day';
        else if (displayData.length <= 90) periodLabel = 'Week';
        else periodLabel = 'Month';
        break;
    }

    return { displayData, periodLabel, totalBudgetAmount, totalSpent };
  };

  const getChartTitle = () => {
    switch (budget.type) {
      case BudgetType.ONE_TIME:
        if (displayData.length > 90) return "Monthly Spending Trend";
        if (displayData.length > 30) return "Weekly Spending Trend";
        return "Daily Spending Trend";
      case BudgetType.WEEKLY:
        return "Weekly Spending Trend (Last 12 Weeks)";
      case BudgetType.MONTHLY:
        return "Monthly Spending Trend (Last 12 Months)";
      default:
        return "Spending Trend";
    }
  };

  const { displayData, periodLabel, totalBudgetAmount, totalSpent } = prepareTrendData();

  const avgSpendingPercentage = displayData.length > 0
    ? (displayData.reduce((sum: number, data: any) => sum + data.spentPercentage, 0) / displayData.length)
    : 0;

  // Get the maximum amount for Y-axis scaling
  const getMaxAmount = () => {
    if (displayData.length === 0) return 0;

    // Find maximum of both budget amounts and spent amounts
    const maxBudget = Math.max(...displayData.map((d: any) => d.entryAmount));
    const maxSpent = Math.max(...displayData.map((d: any) => d.entrySpent));

    // Add some padding (10%) and round up to nearest nice number
    const maxValue = Math.max(maxBudget, maxSpent) * 1.1;

    // Round up to nearest nice number for Y-axis
    const niceNumbers = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
    for (const niceNum of niceNumbers) {
      if (niceNum >= maxValue) return niceNum;
    }

    // If no nice number found, round up to nearest 100
    return Math.ceil(maxValue / 100) * 100;
  };

  const maxAmount = getMaxAmount();
  const yTicks = 5;
  const tickStep = maxAmount / yTicks;

  // Format period label for X-axis
  const formatEntryLabel = (data: any, index: number) => {
    return data.periodLabel || `Entry ${index + 1}`;
  };

  const getPieChartData = () => {
    if (!categoryBreakdown || categoryBreakdown.length === 0) return [];

    const totalSpent = categoryBreakdown.reduce((sum: number, cat: any) => sum + cat.totalAmount, 0);

    return categoryBreakdown.map((category: any) => {
      const subCategory = mainCategory?.subCategories?.find((sc: any) => sc._id === category.subCategoryId);
      const categoryPercentage = totalSpent > 0 ? (category.totalAmount / totalSpent) * 100 : 0;

      return {
        label: subCategory?.name || 'Unknown Category',
        value: category.totalAmount,
        percentage: categoryPercentage,
        color: subCategory?.color || '#6B7280'
      };
    }).sort((a: { value: number; label: string; percentage: number; color: string },
      b: { value: number; label: string; percentage: number; color: string }) => b.value - a.value);
  };

  const pieChartData = getPieChartData();

  const handleUpdateScope = (scope: 'current' | 'future' | 'all') => {
    onUpdateAmount(scope);
    setShowUpdateBudgetModal(false);
  };

  // Determine which space to show
  const displaySpaceIds = spendingData?.spaceId ? [spendingData.spaceId] : budget.spaceIds;
  const isSingleSpaceView = displaySpaceIds.length === 1;

  // Get space type name
  const getSpaceTypeName = (spaceType: string): string => {
    return capitalize(spaceType.toLowerCase().replace('_', ' '));
  };

  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-[1001] grid place-items-center bg-black/50 overflow-auto p-4">
      <div className="relative w-full max-w-2xl rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {budget.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 text-xs rounded-full ${budget.type === BudgetType.ONE_TIME
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                : budget.type === BudgetType.WEEKLY
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                }`}>
                {capitalize(budget.type.toLowerCase().replace('_', ' '))}
              </span>
              {mainCategory && (
                <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  • {mainCategory.parentCategory}
                </span>
              )}
              {budget.isMultiSpace && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                  Multi-space
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Budget Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-text-light-primary dark:text-text-dark-primary font-medium">
              Budget Progress
            </span>
            <span className={`font-bold ${percentage >= 90 ? 'text-red-500' :
              percentage >= 75 ? 'text-orange-500' :
                percentage >= 50 ? 'text-yellow-500' :
                  'text-green-500'
              }`}>
              {percentage.toFixed(1)}%
            </span>
            <span className={`font-bold ${percentage >= 90 ? 'text-red-500' :
              percentage >= 75 ? 'text-orange-500' :
                percentage >= 50 ? 'text-yellow-500' :
                  'text-green-500'
              }`}>
              {spendingData?.isOverBudget ? 'Over Budget!' : 'On Track'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
            <div
              className={`h-full ${getProgressBarColor(percentage)} transition-all duration-500`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-sm text-text-light-secondary dark:text-text-dark-secondary">
            <span>0%</span>
            <span>100%</span>
          </div>

          {/* Amount Details */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Budget</p>
              <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                {currency} {budgetAmount.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Spent</p>
              <p className="text-lg font-bold text-red-500">
                {currency} {spent.toFixed(2)}
              </p>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                {spendingData?.totalTransactions || 0} transactions
              </p>
              {spendingData?.isOverBudget && (
                <p className="text-xs text-red-500 mt-1">
                  Over by {currency} {spendingData.overBudgetAmount?.toFixed(2) || '0.00'}
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Remaining</p>
              <p className="text-lg font-bold text-green-500">
                {currency} {remaining.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Budget Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Period
            </h3>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-text-light-secondary dark:text-text-dark-secondary" />
              <span className="text-text-light-primary dark:text-text-dark-primary">
                {startDate.toISOString().split('T')[0]} - {endDate.toISOString().split('T')[0]}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Days Remaining: {daysRemaining}
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{
                  width: `${(() => {
                    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
                    const daysPassed = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
                    return totalDays > 0 ? Math.min((daysPassed / totalDays) * 100, 100) : 0;
                  })()}%`
                }}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Category
            </h3>
            <div className="flex items-center gap-2">
              {mainCategory && (
                <>
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: mainCategory.color }}
                  />
                  <span className="text-text-light-primary dark:text-text-dark-primary">
                    {mainCategory.parentCategory}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Spaces display for multi-space budgets */}
          <div className="col-span-2">
            <h3 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Spaces {!isSingleSpaceView ? `(${displaySpaceIds?.length || 0})` : ''}
            </h3>
            <div className="flex flex-wrap gap-2">
              {displaySpaceIds && displaySpaceIds.length > 0 ? (
                displaySpaceIds.map((spaceId: string, index: number) => {
                  const spaceType = budget.spaceTypes?.[index] || 'UNKNOWN';
                  return (
                    <span
                      key={spaceId}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-text-light-primary dark:text-text-dark-primary"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            spaceType === 'CASH' ? '#F59E0B' :
                              spaceType === 'BANK' ? '#3B82F6' :
                                spaceType === 'CREDIT_CARD' ? '#8B5CF6' : '#6B7280'
                        }}
                      />
                      {getSpaceName(spaceId)} ({getSpaceTypeName(spaceType)})
                    </span>
                  );
                })
              ) : (
                <span className="text-text-light-secondary dark:text-text-dark-secondary italic">
                  No spaces selected
                </span>
              )}
            </div>
          </div>

          <div className="col-span-2">
            <h3 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Sub-categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {budget.subCategoryIds && budget.subCategoryIds.length > 0 ? (
                budget.subCategoryIds.map((subCatId: string) => {
                  const subCategory = mainCategory?.subCategories?.find((sc: any) => sc._id === subCatId);
                  return subCategory ? (
                    <span
                      key={subCatId}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-text-light-primary dark:text-text-dark-primary"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: subCategory.color }}
                      />
                      {capitalize(subCategory.name)}
                    </span>
                  ) : null;
                })
              ) : (
                <span className="text-text-light-secondary dark:text-text-dark-secondary italic">
                  All sub-categories
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Spending Trend Section with view toggle for monthly budgets */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary flex items-center gap-2">
              <TrendingUp size={24} className="text-primary" />
              {getChartTitle()}
            </h3>
            <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Showing {displayData.length} {periodLabel.toLowerCase()}{displayData.length !== 1 ? 's' : ''}
            </div>
          </div>

          {displayData.length > 0 ? (
            <div className="bg-bg-light-primary dark:bg-bg-dark-primary rounded-xl p-6 shadow-sm">
              {/* Budget Summary Bar */}
              {/* <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                <div>
                  <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
                    Total Budget Amount
                  </div>
                  <div className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                    {currency} {totalBudgetAmount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
                    Total Spent
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {currency} {totalSpent.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
                    Avg. Spending %
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {avgSpendingPercentage.toFixed(1)}%
                  </div>
                </div>
              </div> */}

              {/* Trend Chart Container */}
              <div className="relative">
                {/* Y-axis Labels (Amount) */}
                <div className="absolute left-0 top-0 h-64 flex flex-col justify-between pb-10 pl-1">
                  {(() => {
                    const tickValues = [];
                    for (let i = yTicks; i >= 0; i--) {
                      const value = i * tickStep;
                      tickValues.push(value);
                    }
                    return tickValues.map((value, index) => (
                      <div
                        key={index}
                        className="text-xs text-text-light-secondary dark:text-text-dark-secondary flex items-center justify-end pr-2 h-12"
                        style={{ marginBottom: index === 0 ? '10px' : '0' }}
                      >
                        {currency} {value.toFixed(0)}
                      </div>
                    ));
                  })()}
                </div>

                {/* Chart Area */}
                <div
                  className="ml-12 pr-2 flex justify-between items-end h-64 gap-2 mb-10 border-l border-b border-border-light-primary dark:border-border-dark-primary pl-4 pb-4"
                  style={{ minHeight: '280px' }}
                >
                  {displayData.map((data: any, index: number) => {
                    const label = formatEntryLabel(data, index);

                    // Calculate heights for bars (0-100% of chart height)
                    const budgetHeight = (data.entryAmount / maxAmount) * 100;
                    const spentHeight = (data.entrySpent / maxAmount) * 100;

                    return (
                      <div key={index} className="flex flex-col items-center flex-1 h-full group">
                        {/* Amount Labels (above bars) - Show actual amounts */}
                        <div className="mb-2 text-center min-h-[40px]">
                          <div className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary opacity-80 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-blue-600 dark:text-blue-400">
                                {currency} {data.entryAmount.toFixed(0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className={`font-bold ${data.spentPercentage > 100 ? 'text-red-500' : data.spentPercentage > 80 ? 'text-orange-500' : 'text-green-500'}`}>
                                {currency} {data.entrySpent.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bars Container */}
                        <div className="relative w-full flex justify-center items-end h-48">
                          {/* Budget Bar (Background) */}
                          <div
                            className="absolute w-3/4 rounded-t-sm bg-blue-100 dark:bg-blue-900/30 transition-all duration-300"
                            style={{
                              height: `${budgetHeight}%`,
                              maxHeight: '160px'
                            }}
                          >
                            {/* Budget Line Indicator */}
                            <div className="absolute -top-0.5 left-0 right-0">
                              <div className="relative">
                                <div className="w-full h-0.5 bg-blue-500"></div>
                                {/* Budget Label */}
                                <div className="absolute -right-10 -top-6 text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                  Budget: {currency} {data.entryAmount.toFixed(0)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Spent Bar (Foreground) */}
                          <div
                            className={`relative w-3/4 rounded-t-sm transition-all duration-300 ${data.spentPercentage > 100 ? 'bg-red-500' :
                              data.spentPercentage > 80 ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                            style={{
                              height: `${Math.min(spentHeight, 100)}%`,
                              maxHeight: '160px'
                            }}
                          >
                            {/* Spent Percentage Badge */}
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${data.spentPercentage > 100 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                data.spentPercentage > 80 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                                  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                }`}>
                                {data.spentPercentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 text-center min-h-[50px]">
                          <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                            {label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-border-light-primary dark:border-border-dark-primary">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-blue-500"></div>
                    <span className="text-sm text-text-light-primary dark:text-text-dark-primary">Budget Amount</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-green-500"></div>
                    <span className="text-sm text-text-light-primary dark:text-text-dark-primary">Below 80% spent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-orange-500"></div>
                    <span className="text-sm text-text-light-primary dark:text-text-dark-primary">80-100% spent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-red-500"></div>
                    <span className="text-sm text-text-light-primary dark:text-text-dark-primary">Over budget</span>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              {/* <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-border-light-primary dark:border-border-dark-primary">
                <div className="text-center">
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Avg. Budget
                  </p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {currency} {(totalBudgetAmount / displayData.length).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Avg. Spent
                  </p>
                  <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                    {currency} {(totalSpent / displayData.length).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Highest Spent
                  </p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {currency} {Math.max(...displayData.map((d: any) => d.entrySpent)).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Lowest Spent
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {currency} {Math.min(...displayData.map((d: any) => d.entrySpent)).toFixed(2)}
                  </p>
                </div>
              </div> */}
            </div>
          ) : (
            <div className="bg-bg-light-primary dark:bg-bg-dark-primary rounded-xl p-12 text-center border-2 border-dashed border-border-light-primary dark:border-border-dark-primary">
              <TrendingUp size={48} className="mx-auto text-text-light-secondary dark:text-text-dark-secondary mb-4" />
              <h4 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                No Trend Data Available
              </h4>
              <p className="text-text-light-secondary dark:text-text-dark-secondary max-w-md mx-auto">
                {budget.type === BudgetType.ONE_TIME
                  ? "This is a one-time budget. Transaction data will appear once the budget period starts."
                  : `This is the first ${periodLabel.toLowerCase()} of your ${budget.type.toLowerCase()} budget. Data will accumulate over time.`}
              </p>
            </div>
          )}
        </div>

        {pieChartData.length > 0 && (
          <div className="mb-8">
            <PieChartComponent
              data={pieChartData}
              totalSpent={spent}
              currency={currency}
              title="Spending by Category"
            />
          </div>
        )}

        {/* Update Scope Modal */}
        <UpdateBudgetModal
          isOpen={showUpdateBudgetModal}
          onClose={() => setShowUpdateBudgetModal(false)}
          onSelectScope={handleUpdateScope}
          budgetType={budget.type.toLowerCase()}
          currentPeriod={startDate.toISOString().split('T')[0] + ' to ' + endDate.toISOString().split('T')[0]}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-light-primary dark:border-border-dark-primary">
          <Button
            text="Edit"
            className="max-w-fit cursor-pointer"
            priority="secondary"
            onClick={onEdit}
          />
          <Button
            text="Delete"
            className="max-w-fit hover:!bg-red-600 !bg-red-500 cursor-pointer"
            onClick={onDelete}
          />
        </div>
      </div>
    </div>
  );
};

function Budget() {
  const { spacetype, spaceid } = useParams();
  const { spaces, currency } = useSelector((state: RootState) => state.auth);
  const { getCategoriesBySpace } = CategoryService();
  const {
    createBudget,
    getBudgetsBySpace,
    getBudgetsBySpaceType,
    deleteBudget,
    getBudgetSpending,
    updateBudgetAmount
  } = BudgetService();

  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [budgetsWithSpending, setBudgetsWithSpending] = useState<BudgetWithSpending[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [newOrEditMode, setNewOrEditMode] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [spaceSelectionPhase, setSpaceSelectionPhase] = useState<boolean>(false);
  const [selectedSpacesForAllSpaces, setSelectedSpacesForAllSpaces] = useState<string[]>([]);

  // Budget detail modal state
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    budget: BudgetItem | null;
    spendingData: any;
  }>({
    isOpen: false,
    budget: null,
    spendingData: null
  });

  // Collapsed states for each budget type
  const [collapsedSections, setCollapsedSections] = useState<Record<BudgetType, boolean>>({
    [BudgetType.ONE_TIME]: false,
    [BudgetType.WEEKLY]: false,
    [BudgetType.MONTHLY]: false,
  });

  const [inputs, setInputs] = useState<BudgetInfo>({
    name: "",
    amount: 0,
    type: BudgetType.MONTHLY,
    mainCategoryId: "",
    subCategoryIds: [],
    spaceIds: spaceid === "all" ? [] : spaceid ? [spaceid] : [],
    spaceTypes: [],
    startDate: "",
    endDate: "",
  });

  const [selectedSubCategories, setSelectedSubCategories] = useState<Set<string>>(new Set());

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  // Get allowed transaction type based on space type
  const getAllowedTransactionType = (spaceTypeParam: string): TransactionType => {
    const standardizedSpaceType = toStrdSpaceType(spaceTypeParam);

    if (standardizedSpaceType === "CREDIT_CARD") {
      return TransactionType.BALANCE_INCREASE;
    } else if (["CASH", "BANK"].includes(standardizedSpaceType)) {
      return TransactionType.EXPENSE;
    }

    return TransactionType.EXPENSE;
  };

  // Get space name by ID
  const getSpaceName = (spaceId: string): string => {
    const space = spaces.find(space => space.id === spaceId);
    return space ? capitalize(space.name) : "Unknown Space";
  };

  // Get space type name
  const getSpaceTypeName = (spaceType: string): string => {
    return capitalize(spaceType.toLowerCase().replace('_', ' '));
  };

  // Get space types for selected spaces
  const getSpaceTypesForSelectedSpaces = (selectedSpaceIds: string[]): string[] => {
    return selectedSpaceIds.map(spaceId => {
      const space = spaces.find(s => s.id === spaceId);
      return space ? toStrdSpaceType(space.type) : "UNKNOWN";
    });
  };

  // Filter budgets by type
  const getBudgetsByType = (type: BudgetType) => {
    return budgetsWithSpending.filter(budget => budget.type === type);
  };

  // Get budgets for all spaces
  const fetchAllSpacesBudgets = async () => {
    setLoading(true);
    try {
      // Get budgets from all allowed space types
      const allowedSpaceTypes = ["CASH", "BANK", "CREDIT_CARD"];
      const allBudgetsPromises = allowedSpaceTypes.map(spaceType =>
        getBudgetsBySpaceType(spaceType)
      );

      const budgetsByType = await Promise.all(allBudgetsPromises);
      const allBudgets = budgetsByType.flat();

      // Process each budget and create separate entries for each space
      const budgetsWithEntriesPromises = allBudgets.map(async (budget: BudgetItem) => {
        // For multi-space budgets, we need to create separate budget entries for each space
        const budgetSpaces = budget.spaceIds || [];
        const budgetEntries = [];

        for (const spaceId of budgetSpaces) {
          try {
            const spendingData = await getBudgetSpending(budget._id, undefined, spaceId.toString());

            if (!spendingData || !spendingData.currentEntry) {
              console.warn(`No current entry for budget ${budget._id} in space ${spaceId}`);
              continue;
            }

            const currentEntry = spendingData.currentEntry;
            const budgetAmount = currentEntry.amount;
            const spent = currentEntry.spent || 0;
            const percentage = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;

            const today = new Date();
            const entryStartDate = new Date(currentEntry.start_date);
            const entryEndDate = new Date(currentEntry.end_date);

            if (today < entryStartDate || today > entryEndDate) {
              continue;
            }

            // Create a separate budget entry for this space
            budgetEntries.push({
              ...budget,
              // Clone budget but with space-specific data
              _id: `${budget._id}_${spaceId}`,
              spaceIds: [spaceId],
              spaceTypes: [budget.spaceTypes[budget.spaceIds.indexOf(spaceId)] || 'UNKNOWN'], // Corresponding space type
              isMultiSpace: false,
              spent,
              percentage,
              remaining: Math.max(0, budgetAmount - spent),
              isOverBudget: spent > budgetAmount,
              overBudgetAmount: Math.max(0, spent - budgetAmount),
              spendingData: spendingData,
              currentEntry: currentEntry,
              entries: spendingData.trendData || [],
              // Add space-specific identifier
              originalBudgetId: budget._id,
              spaceId: spaceId
            } as BudgetWithSpending);
          } catch (error) {
            console.error(`Error processing budget ${budget._id} for space ${spaceId}:`, error);
          }
        }

        return budgetEntries;
      });

      const budgetsWithEntriesResults = await Promise.all(budgetsWithEntriesPromises);

      // Flatten the array of arrays
      const allBudgetEntries = budgetsWithEntriesResults.flat();

      setBudgets(allBudgets);
      setBudgetsWithSpending(allBudgetEntries);

      // Log summary
      const totalBudgetAmount = allBudgetEntries.reduce((sum, b) => sum + (b.currentEntry?.amount || getBudgetAmount(b.amount)), 0);
      const totalSpent = allBudgetEntries.reduce((sum, b) => sum + (b.spent || 0), 0);

      console.log('All Spaces Budget Summary:', {
        totalBudgets: allBudgets.length,
        activeBudgetEntries: allBudgetEntries.length,
        totalBudgetAmount,
        totalSpent,
        overallPercentage: totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0
      });
    } catch (error) {
      console.error("Error fetching all spaces budgets:", error);
      toast.error("Failed to load budgets");
      setBudgets([]);
      setBudgetsWithSpending([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = (spaceId?: string) => {
    setLoading(true);
    let targetSpaceId: string;

    if (spaceId && spaceId !== "all") {
      // Use the provided spaceId for single space mode
      targetSpaceId = spaceId;
    } else if (spaceid && spaceid !== "all") {
      // Fallback to the current spaceid from params
      targetSpaceId = spaceid;
    } else if (selectedSpacesForAllSpaces.length > 0) {
      // For multi-space mode, use the first selected space
      targetSpaceId = selectedSpacesForAllSpaces[0];
    } else {
      // If no valid space ID, don't fetch categories
      setLoading(false);
      setCategories([]);
      return;
    }

    getCategoriesBySpace(targetSpaceId)
      .then((res) => {
        console.log("Fetched categories for space ID:", targetSpaceId, res);
        setCategories(res || []);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setCategories([]);
        toast.error("Failed to load categories");
      })
      .finally(() => setLoading(false));
  };

  const fetchBudgetsWithSpending = async () => {
    if (!spaceid) return;

    setLoading(true);
    try {
      // If "all" is selected, fetch budgets from all allowed spaces
      if (spaceid === "all") {
        await fetchAllSpacesBudgets();
        return;
      }
      // Fetch budgets
      const budgetsData = await getBudgetsBySpace(spaceid);
      const budgetsList = budgetsData || [];

      // Fetch spending for each budget with timeout to prevent hanging
      const budgetsWithEntriesPromises = budgetsList.map(async (budget: BudgetItem) => {
        try {
          // Get spending data for current period
          const spendingData = await getBudgetSpending(budget._id, undefined, spaceid);

          if (!spendingData) {
            console.warn(`No spending data for budget ${budget._id} - budget may not have started yet`);
            const budgetAmount = getBudgetAmount(budget.amount);

            // Check if this is a future ONE_TIME budget
            const today = new Date();
            const budgetStartDate = new Date(budget.startDate);

            // If it's a future budget, exclude it from display
            if (budget.type === BudgetType.ONE_TIME && today < budgetStartDate) {
              console.log(`Skipping future ONE_TIME budget ${budget._id} (starts on ${budgetStartDate.toISOString()})`);
              return null;
            }

            return {
              ...budget,
              spent: 0,
              percentage: 0,
              remaining: budgetAmount,
              isOverBudget: false,
              overBudgetAmount: 0,
              currentEntry: null,
              entries: []
            } as BudgetWithSpending;
          }

          if (!spendingData.currentEntry) {
            console.warn(`No current entry for budget ${budget._id} - budget may not have started yet`);
            const budgetAmount = getBudgetAmount(budget.amount);

            // Check if this is a future ONE_TIME budget
            const today = new Date();
            const budgetStartDate = new Date(budget.startDate);

            // If it's a future budget, exclude it from display
            if (budget.type === BudgetType.ONE_TIME && today < budgetStartDate) {
              console.log(`Skipping future ONE_TIME budget ${budget._id} (starts on ${budgetStartDate.toISOString()})`);
              return null;
            }

            return {
              ...budget,
              spent: 0,
              percentage: 0,
              remaining: budgetAmount,
              isOverBudget: false,
              overBudgetAmount: 0,
              spendingData: spendingData,
              currentEntry: null,
              entries: spendingData.trendData || []
            } as BudgetWithSpending;
          }

          const currentEntry = spendingData.currentEntry;
          const budgetAmount = currentEntry.amount;
          const spent = currentEntry.spent || 0;
          const percentage = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;

          // Check if current date falls within entry period
          const today = new Date();
          const entryStartDate = new Date(currentEntry.start_date);
          const entryEndDate = new Date(currentEntry.end_date);

          if (today < entryStartDate || today > entryEndDate) {
            console.log(`Budget ${budget._id} skipped: current date outside entry period`);
            return null;
          }

          // Filter entries to only include those for the current space
          const allEntries = (spendingData.trendData || []).filter((entry: any) => {
            return entry.spaceId === spaceid || spaceid === "all";
          });

          return {
            ...budget,
            spent,
            percentage,
            remaining: Math.max(0, budgetAmount - spent),
            isOverBudget: spent > budgetAmount,
            overBudgetAmount: Math.max(0, spent - budgetAmount),
            spendingData: {
              ...spendingData,
              trendData: allEntries
            },
            currentEntry: currentEntry,
            entries: allEntries
          } as BudgetWithSpending;
        } catch (error) {
          console.error(`Error fetching spending for budget ${budget._id}:`, error);
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.log(`Budget ${budget._id} not found for current period - likely hasn't started yet`);
            return null;
          }
          const budgetAmount = getBudgetAmount(budget.amount);
          return {
            ...budget,
            spent: 0,
            percentage: 0,
            remaining: budgetAmount,
            isOverBudget: false,
            overBudgetAmount: 0,
            spendingData: null
          } as BudgetWithSpending;
        }
      });

      const budgetsWithEntriesResults = await Promise.all(budgetsWithEntriesPromises);

      // Filter out null values (budgets without current entries)
      const validBudgets = budgetsWithEntriesResults.filter(b => b !== null) as BudgetWithSpending[];

      setBudgets(budgetsList);
      setBudgetsWithSpending(validBudgets);

      // Log summary
      const totalBudgetAmount = validBudgets.reduce((sum, b) =>
        sum + (b.currentEntry?.amount || getBudgetAmount(b.amount)), 0);
      const totalSpent = validBudgets.reduce((sum, b) => sum + (b.spent || 0), 0);

      console.log('Budget Summary:', {
        totalBudgets: budgetsList.length,
        activeBudgets: validBudgets.length,
        totalBudgetAmount,
        totalSpent,
        overallPercentage: totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0
      });
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast.error("Failed to load budgets");
      setBudgets([]);
      setBudgetsWithSpending([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetDetail = async (budgetId: string) => {
    try {
      // Determine which space to use for fetching spending data
      let targetSpaceId: string | undefined;

      if (spaceid && spaceid !== "all") {
        // Use the current space from navbar
        targetSpaceId = spaceid;
      } else if (detailModal.budget?.spaceIds && detailModal.budget.spaceIds.length > 0) {
        // Use the first space from the budget
        targetSpaceId = detailModal.budget.spaceIds[0].toString();
      }

      const spendingData = await getBudgetSpending(budgetId, undefined, targetSpaceId);
      const budget = budgets.find(b => b._id === budgetId);

      if (budget) {
        setDetailModal({
          isOpen: true,
          budget,
          spendingData
        });
      }
    } catch (error) {
      console.error("Error fetching budget details:", error);
      toast.error("Failed to load budget details");
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;

    if (name === "mainCategoryId") {
      // Reset subcategory selections when main category changes
      setSelectedSubCategories(new Set());
      setInputs(prev => ({
        ...prev,
        mainCategoryId: value,
        subCategoryIds: []
      }));
    } else if (name === "type") {
      // When budget type changes, recalculate end date if start date exists
      const newType = value as BudgetType;
      const { startDate, endDate } = calculateBudgetDates(newType);

      setInputs(prev => ({
        ...prev,
        type: newType,
        startDate,
        endDate
      }));
    } else if (name === "startDate" || name === "endDate") {
      setInputs(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setInputs(prev => ({
        ...prev,
        [name]: name === "amount" ? parseFloat(value) || 0 : value
      }));
    }
  };

  const onSubCategoryToggle = (subCategoryId: string) => {
    const newSelected = new Set(selectedSubCategories);

    if (newSelected.has(subCategoryId)) {
      newSelected.delete(subCategoryId);
    } else {
      newSelected.add(subCategoryId);
    }

    setSelectedSubCategories(newSelected);
    setInputs(prev => ({
      ...prev,
      subCategoryIds: Array.from(newSelected)
    }));
  };

  // Space selection functions for multi-space support
  const onSpaceToggle = (spaceId: string) => {
    const newSelected = new Set(selectedSpacesForAllSpaces);

    if (newSelected.has(spaceId)) {
      newSelected.delete(spaceId);
    } else {
      newSelected.add(spaceId);
    }

    const newSelectedArray = Array.from(newSelected);
    setSelectedSpacesForAllSpaces(newSelectedArray);

    // Get space types for selected spaces
    const spaceTypes = getSpaceTypesForSelectedSpaces(newSelectedArray);

    setInputs(prev => ({
      ...prev,
      spaceIds: newSelectedArray,
      spaceTypes: spaceTypes
    }));
  };

  const selectAllSpaces = () => {
    const allAllowedSpaceIds = allowedSpaces.map(space => space.id);
    const spaceTypes = getSpaceTypesForSelectedSpaces(allAllowedSpaceIds);

    setSelectedSpacesForAllSpaces(allAllowedSpaceIds);
    setInputs(prev => ({
      ...prev,
      spaceIds: allAllowedSpaceIds,
      spaceTypes: spaceTypes
    }));
  };

  const clearAllSpaces = () => {
    setSelectedSpacesForAllSpaces([]);
    setInputs(prev => ({
      ...prev,
      spaceIds: [],
      spaceTypes: []
    }));
  };

  const selectAllSubCategories = () => {
    const transformedCategories = transformCategories(categories);
    const mainCategory = transformedCategories.find(cat => cat._id === inputs.mainCategoryId);
    if (!mainCategory || !mainCategory.subCategories) return;

    const allIds = mainCategory.subCategories.map((subCat: any) => subCat._id);
    setSelectedSubCategories(new Set(allIds));
    setInputs(prev => ({
      ...prev,
      subCategoryIds: allIds
    }));
  };

  const clearAllSubCategories = () => {
    setSelectedSubCategories(new Set());
    setInputs(prev => ({
      ...prev,
      subCategoryIds: []
    }));
  };

  const transformCategories = (backendCategories: BackendCategory[]): any[] => {
    const categoryMap = new Map();

    backendCategories.forEach(cat => {
      if (!categoryMap.has(cat.parentCategoryId)) {
        categoryMap.set(cat.parentCategoryId, {
          _id: cat.parentCategoryId,
          parentCategory: cat.parentCategory,
          color: cat.color,
          spaces: cat.spaces,
          subCategories: []
        });
      }

      const category = categoryMap.get(cat.parentCategoryId);
      category.subCategories.push({
        _id: cat.subCategoryId,
        name: cat.subCategoryName,
        color: cat.subCategoryColor,
        transactionTypes: cat.transactionTypes
      });
    });

    return Array.from(categoryMap.values());
  };

  const getFilteredCategories = () => {
    // Transform backend categories first
    const transformedCategories = transformCategories(categories);

    // If in "All spaces" mode and spaces are selected, filter categories
    if (spaceid === "all" && selectedSpacesForAllSpaces.length > 0) {
      return transformedCategories.filter(category => {
        // Check if category is valid for any selected space
        return selectedSpacesForAllSpaces.some(spaceId => {
          const space = spaces.find(s => s.id === spaceId);
          if (!space) return false;

          const spaceType = toStrdSpaceType(space.type);
          const allowedTransactionType = getAllowedTransactionType(spaceType);

          const hasValidSpace = category.spaces && category.spaces.includes(spaceType);
          const hasValidSubCategories = category.subCategories && category.subCategories.some((subCat: any) =>
            subCat.transactionTypes && subCat.transactionTypes.includes(allowedTransactionType)
          );

          return hasValidSpace && hasValidSubCategories;
        });
      });
    } else if (spaceid && spaceid !== "all") {
      // Single space mode - use current space directly
      const currentSpace = spaces.find(s => s.id === spaceid);
      if (!currentSpace) return transformedCategories;

      const spaceType = toStrdSpaceType(currentSpace.type);
      const allowedTransactionType = getAllowedTransactionType(spaceType);

      return transformedCategories.filter(category => {
        const hasValidSpace = category.spaces && category.spaces.includes(spaceType);
        const hasValidSubCategories = category.subCategories && category.subCategories.some((subCat: any) =>
          subCat.transactionTypes && subCat.transactionTypes.includes(allowedTransactionType)
        );

        return hasValidSpace && hasValidSubCategories;
      });
    }

    // If no filtering needed, return all transformed categories
    return transformedCategories;
  };


  const getFilteredSubCategories = () => {
    if (!inputs.mainCategoryId) return [];

    const transformedCategories = transformCategories(categories);
    const mainCategory = transformedCategories.find(cat => cat._id === inputs.mainCategoryId);
    if (!mainCategory || !mainCategory.subCategories) return [];

    // Handle both single space mode and multi-space mode
    if (spaceid === "all") {
      // For multi-space mode, filter subcategories that are valid for ALL selected spaces
      if (selectedSpacesForAllSpaces.length === 0) return [];

      return mainCategory.subCategories.filter((subCat: any) => {
        // Check if subcategory is valid for all selected spaces
        return selectedSpacesForAllSpaces.every(spaceId => {
          const space = spaces.find(s => s.id === spaceId);
          if (!space) return false;

          const spaceType = toStrdSpaceType(space.type);
          const allowedTransactionType = getAllowedTransactionType(spaceType);

          return subCat.transactionTypes && subCat.transactionTypes.includes(allowedTransactionType);
        });
      });
    } else {
      // For single space mode, use the current spaceid
      const currentSpace = spaces.find(s => s.id === spaceid);
      if (!currentSpace) return [];

      const spaceType = toStrdSpaceType(currentSpace.type);
      const allowedTransactionType = getAllowedTransactionType(spaceType);

      // Filter subcategories for the current single space
      return mainCategory.subCategories.filter((subCat: any) => {
        return subCat.transactionTypes && subCat.transactionTypes.includes(allowedTransactionType);
      });
    }
  };

  const onNewOrEditMode = () => {
    if (spaceid === "all") {
      // "All spaces" mode - go to space selection phase
      setSpaceSelectionPhase(true);
      setNewOrEditMode(true);
      setEditId(null);

      const { startDate, endDate } = calculateBudgetDates(BudgetType.MONTHLY);
      setInputs({
        name: "",
        amount: 0,
        type: BudgetType.MONTHLY,
        mainCategoryId: "",
        subCategoryIds: [],
        spaceIds: [],
        spaceTypes: [],
        startDate: startDate.split('T')[0],
        endDate: endDate.split('T')[0],
      });
      setSelectedSubCategories(new Set());
      setSelectedSpacesForAllSpaces([]);
      // Don't fetch categories yet - wait for space selection
    } else {
      // Single space mode - directly open budget form
      setSpaceSelectionPhase(false);
      setNewOrEditMode(true);
      setEditId(null);

      const { startDate, endDate } = calculateBudgetDates(BudgetType.MONTHLY);

      // Get current space info
      const currentSpace = spaces.find(s => s.id === spaceid);
      const spaceType = currentSpace ? toStrdSpaceType(currentSpace.type) : "CASH";

      setInputs({
        name: "",
        amount: 0,
        type: BudgetType.MONTHLY,
        mainCategoryId: "",
        subCategoryIds: [],
        spaceIds: spaceid ? [spaceid] : [],
        spaceTypes: [spaceType],
        startDate: startDate.split('T')[0],
        endDate: endDate.split('T')[0],
      });
      setSelectedSubCategories(new Set());

      // Pass the spaceid to fetchCategories
      if (spaceid) {
        fetchCategories(spaceid);
      }
    }
  };

  const handleSpaceSelection = () => {
    if (selectedSpacesForAllSpaces.length === 0) {
      toast.error("Please select at least one space first!");
      return;
    }

    // For multi-space budgets, fetch categories for the first selected space
    const firstSpaceId = selectedSpacesForAllSpaces[0];

    // Move to the main budget form
    setSpaceSelectionPhase(false);

    // Fetch categories for the first selected space
    fetchCategories(firstSpaceId);
  };

  const onEditMode = (budget: BudgetItem) => {
    // Handle edit mode differently for "All spaces" mode
    if (spaceid === "all") {
      // For All spaces mode in edit, we need to handle multi-space budgets
      setSpaceSelectionPhase(false);
      setNewOrEditMode(true);
      setEditId(budget._id);

      const budgetAmount = getBudgetAmount(budget.amount);

      let startDate = "";
      let endDate = "";

      if (budget.type === BudgetType.ONE_TIME) {
        // For one-time budgets, use the stored dates
        startDate = budget.startDate?.split('T')[0] || "";
        endDate = budget.endDate?.split('T')[0] || "";
      } else {
        // For recurring budgets, calculate current period dates
        const calculatedDates = calculateBudgetDates(budget.type);
        startDate = calculatedDates.startDate.split('T')[0];
        endDate = calculatedDates.endDate.split('T')[0];
      }

      // Handle multi-space budgets in edit mode
      setInputs({
        name: budget.name,
        amount: budgetAmount,
        type: budget.type,
        mainCategoryId: budget.mainCategoryId,
        subCategoryIds: budget.subCategoryIds || [],
        spaceIds: budget.spaceIds || [],
        spaceTypes: budget.spaceTypes || [],
        startDate: startDate,
        endDate: endDate,
      });

      // Set selected spaces
      setSelectedSpacesForAllSpaces(budget.spaceIds || []);

      // Set selected subcategories
      let initialSelectedSubCategories = new Set<string>();
      if (budget.subCategoryIds && budget.subCategoryIds.length > 0) {
        initialSelectedSubCategories = new Set(budget.subCategoryIds);
      }

      setSelectedSubCategories(initialSelectedSubCategories);

      // Fetch categories for the first space in the budget
      if (budget.spaceIds && budget.spaceIds.length > 0) {
        fetchCategories(budget.spaceIds[0]);
      }
    } else {
      // Normal edit mode (single space)
      setSpaceSelectionPhase(false);
      setNewOrEditMode(true);
      setEditId(budget._id);

      const budgetAmount = getBudgetAmount(budget.amount);

      let startDate = "";
      let endDate = "";

      if (budget.type === BudgetType.ONE_TIME) {
        // For one-time budgets, use the stored dates
        startDate = budget.startDate?.split('T')[0] || "";
        endDate = budget.endDate?.split('T')[0] || "";
      } else {
        // For recurring budgets, calculate current period dates
        const calculatedDates = calculateBudgetDates(budget.type);
        startDate = calculatedDates.startDate.split('T')[0];
        endDate = calculatedDates.endDate.split('T')[0];
      }

      setInputs({
        name: budget.name,
        amount: budgetAmount,
        type: budget.type,
        mainCategoryId: budget.mainCategoryId,
        subCategoryIds: budget.subCategoryIds || [],
        spaceIds: budget.spaceIds || [],
        spaceTypes: budget.spaceTypes || [],
        startDate: budget.startDate?.split('T')[0] || "",
        endDate: budget.endDate?.split('T')[0] || "",
      });

      // Set selected subcategories
      let initialSelectedSubCategories = new Set<string>();
      if (budget.subCategoryIds && budget.subCategoryIds.length > 0) {
        initialSelectedSubCategories = new Set(budget.subCategoryIds);
      }

      setSelectedSubCategories(initialSelectedSubCategories);
    }
  };

  const handleUpdateBudgetAmount = async (budgetId: string, amount: number, scope: 'current' | 'future' | 'all') => {
    try {
      // Extract original budget ID if it's a space-specific budget
      let originalBudgetId = budgetId;
      let spaceId = '';

      // Check if this is a space-specific budget from "All spaces" view
      if (budgetId.includes('_') && budgetId.split('_').length > 1) {
        const parts = budgetId.split('_');
        originalBudgetId = parts[0];
        spaceId = parts[1];
      }

      await updateBudgetAmount(originalBudgetId, amount, scope);

      if (spaceid === "all") {
        await fetchAllSpacesBudgets();
      } else {
        fetchBudgetsWithSpending();
      }
    } catch (error) {
      console.error("Failed to update budget amount:", error);
    }
  };

  const onCancel = () => {
    setSpaceSelectionPhase(false);
    setNewOrEditMode(false);
    setEditId(null);
    setSelectedSpacesForAllSpaces([]);
    setInputs({
      name: "",
      amount: 0,
      type: BudgetType.MONTHLY,
      mainCategoryId: "",
      subCategoryIds: [],
      spaceIds: spaceid === "all" ? [] : spaceid ? [spaceid] : [],
      spaceTypes: spaceid === "all" ? [] : [toStrdSpaceType(spacetype || "")],
      startDate: "",
      endDate: "",
    });
    setSelectedSubCategories(new Set());

    if (spacetype && spacetype !== "all" && spaceid !== "all") {
      fetchCategories(spaceid);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!inputs.name.trim()) {
      toast.error("Budget name is required!");
      return;
    }

    if (inputs.amount <= 0) {
      toast.error("Budget amount must be greater than 0!");
      return;
    }

    if (!inputs.mainCategoryId) {
      toast.error("Please select a main category!");
      return;
    }

    if (!inputs.type) {
      toast.error("Please select the budget type!");
      return;
    }

    if (inputs.spaceIds.length === 0) {
      toast.error("Please select at least one space!");
      return;
    }

    setLoading(true);

    try {
      // Calculate dates based on budget type
      let startDateToSend: string;
      let endDateToSend: string;

      if (inputs.type === BudgetType.ONE_TIME) {
        if (!inputs.startDate || !inputs.endDate) {
          toast.error("Please select both start and end dates for One-Time budget!");
          setLoading(false);
          return;
        }

        // For One-Time budgets, use the selected dates
        const start = new Date(inputs.startDate);
        const end = new Date(inputs.endDate);

        // Set proper times
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);

        startDateToSend = start.toISOString();
        endDateToSend = end.toISOString();
      } else {
        // For Weekly/Monthly budgets, calculate dates based on current date
        const { startDate, endDate } = calculateBudgetDates(inputs.type);

        // Use the calculated dates
        startDateToSend = startDate;
        endDateToSend = endDate;

        // Also update inputs for display consistency
        setInputs(prev => ({
          ...prev,
          startDate: startDate.split('T')[0],
          endDate: endDate.split('T')[0]
        }));
      }

      // Validate all selected spaces
      const invalidSpaces = inputs.spaceIds.filter(spaceId => {
        const space = spaces.find(s => s.id === spaceId);
        return !space || !['CASH', 'BANK', 'CREDIT_CARD'].includes(space.type);
      });

      if (invalidSpaces.length > 0) {
        toast.error("Budgets can only be created for Cash, Bank, or Credit Card spaces!");
        setLoading(false);
        return;
      }

      // Get all subcategory IDs for the selected main category if none are selected
      let subCategoryIdsToSend = [...inputs.subCategoryIds];

      if (inputs.mainCategoryId && subCategoryIdsToSend.length === 0) {
        const allSubCategories = getFilteredSubCategories();
        subCategoryIdsToSend = allSubCategories.map((subCat: any) => subCat._id);
        setSelectedSubCategories(new Set(subCategoryIdsToSend));
      }

      // Prepare budget data with spaceIds array and isMultiSpace flag
      const budgetData = {
        ...inputs,
        subCategoryIds: subCategoryIdsToSend,
        spaceIds: inputs.spaceIds,
        spaceTypes: inputs.spaceTypes,
        isMultiSpace: inputs.spaceIds.length > 1,
        startDate: startDateToSend,
        endDate: endDateToSend
      };

      console.log("Submitting budget:", {
        ...budgetData,
        startDate: startDateToSend,
        endDate: endDateToSend
      });

      await createBudget(budgetData);

      fetchBudgetsWithSpending();
      onCancel();
    } catch (error) {
      toast.error("Failed to save budget!");
      console.error("Error saving budget:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (type: BudgetType) => {
    setCollapsedSections(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // In the openBudgetDetail function
  const openBudgetDetail = (budget: BudgetItem | BudgetWithSpending) => {
    // Check if this is a space-specific budget entry from "All spaces" view
    const isSpaceSpecific = budget._id.includes('_') && budget._id.split('_').length > 1;

    if (isSpaceSpecific) {
      // Extract original budget ID and space ID
      const parts = budget._id.split('_');
      const originalBudgetId = parts[0];
      const spaceId = parts[1];

      // Find the original budget
      const originalBudget = budgets.find(b => b._id === originalBudgetId);
      if (originalBudget) {
        // Use the space-specific spending data that's already in the budget object
        const budgetWithSpending = budget as BudgetWithSpending;

        // Create a BudgetWithSpending object for the detail modal
        const budgetForDetail: BudgetWithSpending = {
          ...originalBudget,
          // Override with space-specific data
          _id: budget._id,
          spaceIds: [spaceId],
          spaceTypes: [budget.spaceTypes[0] || 'UNKNOWN'],
          isMultiSpace: false,
          spent: budgetWithSpending.spent,
          percentage: budgetWithSpending.percentage,
          currentEntry: budgetWithSpending.currentEntry,
          entries: budgetWithSpending.entries,
          // required properties from BudgetWithSpending interface
          remaining: budgetWithSpending.remaining || 0,
          isOverBudget: budgetWithSpending.isOverBudget || false,
          overBudgetAmount: budgetWithSpending.overBudgetAmount || 0,
          spendingData: budgetWithSpending.spendingData || null
        };

        setDetailModal({
          isOpen: true,
          budget: budgetForDetail,
          spendingData: budgetWithSpending.spendingData || null
        });
      }
    } else {
      // Find the budget with spending data from budgetsWithSpending
      const budgetWithSpending = budgetsWithSpending.find(b => b._id === budget._id);

      if (budgetWithSpending) {
        setDetailModal({
          isOpen: true,
          budget: budgetWithSpending,
          spendingData: budgetWithSpending.spendingData || null
        });
      } else {
        // Fallback: fetch the data if not found
        fetchBudgetDetail(budget._id);
      }
    }
  };

  // Close budget detail modal
  const closeBudgetDetail = () => {
    setDetailModal({
      isOpen: false,
      budget: null,
      spendingData: null
    });
  };

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    budgetId: string | null;
    budgetName: string;
  }>({
    isOpen: false,
    budgetId: null,
    budgetName: ""
  });

  const openDeleteConfirmation = (budgetId: string, budgetName: string) => {
    setConfirmationModal({
      isOpen: true,
      budgetId,
      budgetName
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      budgetId: null,
      budgetName: ""
    });
  };

  const handleDelete = async () => {
    if (!confirmationModal.budgetId) return;

    setLoading(true);
    try {
      await deleteBudget(confirmationModal.budgetId);
      fetchBudgetsWithSpending();
      closeConfirmationModal();
    } catch (error) {
      toast.error("Failed to delete budget!");
      console.error("Error deleting budget:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (spaceid === "all") {
      // For "All spaces" mode, only fetch budgets initially
      fetchBudgetsWithSpending();
      // Don't fetch categories until user selects spaces for a new budget
    } else if (spaceid && spaceid !== "all") {
      // For normal single space mode, fetch both categories and budgets
      fetchCategories(spaceid);
      fetchBudgetsWithSpending();
    }
  }, [spacetype, spaceid]);

  const filteredCategories = getFilteredCategories();
  const filteredSubCategories = getFilteredSubCategories();

  // For "All Spaces" view, get all spaces
  const currentSpace = spaceid === "all"
    ? null
    : spaces.find(space => space.id === spaceid);

  const oneTimeBudgets = getBudgetsByType(BudgetType.ONE_TIME);
  const weeklyBudgets = getBudgetsByType(BudgetType.WEEKLY);
  const monthlyBudgets = getBudgetsByType(BudgetType.MONTHLY);

  // Filter spaces for budget creation dropdown
  const allowedSpaces = spaces.filter(space =>
    ['CASH', 'BANK', 'CREDIT_CARD'].includes(space.type)
  );

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">Budgets</h1>
          {currentSpace ? (
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              For {capitalize(currentSpace.name)} - {capitalize(currentSpace.type.replace('_', ' '))}
            </p>
          ) : spaceid === "all" ? (
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              All Cash, Bank, and Credit Card Spaces
            </p>
          ) : null}
        </div>

        <Button
          text="New Budget"
          className="max-w-fit text-sm py-2 px-6 cursor-pointer"
          onClick={onNewOrEditMode}
          disabled={loading}
        />
      </div>

      {/* Budgets Sections */}
      <div className="space-y-6">
        {/* One Time Budgets */}
        <BudgetList
          title="One Time"
          type={BudgetType.ONE_TIME}
          budgets={oneTimeBudgets}
          currency={currency || ""}
          categories={categories}
          isCollapsed={collapsedSections[BudgetType.ONE_TIME]}
          onToggle={() => toggleSection(BudgetType.ONE_TIME)}
          onEdit={onEditMode}
          onDelete={openDeleteConfirmation}
          onViewDetails={openBudgetDetail}
          getSpaceName={getSpaceName}
          getSpaceTypeName={getSpaceTypeName}
          showSpaceInfo={spaceid === "all"}
        />

        {/* Weekly Budgets */}
        <BudgetList
          title="Weekly"
          type={BudgetType.WEEKLY}
          budgets={weeklyBudgets}
          currency={currency || ""}
          categories={categories}
          isCollapsed={collapsedSections[BudgetType.WEEKLY]}
          onToggle={() => toggleSection(BudgetType.WEEKLY)}
          onEdit={onEditMode}
          onDelete={openDeleteConfirmation}
          onViewDetails={openBudgetDetail}
          getSpaceName={getSpaceName}
          getSpaceTypeName={getSpaceTypeName}
          showSpaceInfo={spaceid === "all"}
        />

        {/* Monthly Budgets */}
        <BudgetList
          title="Monthly"
          type={BudgetType.MONTHLY}
          budgets={monthlyBudgets}
          currency={currency || ""}
          categories={categories}
          isCollapsed={collapsedSections[BudgetType.MONTHLY]}
          onToggle={() => toggleSection(BudgetType.MONTHLY)}
          onEdit={onEditMode}
          onDelete={openDeleteConfirmation}
          onViewDetails={openBudgetDetail}
          getSpaceName={getSpaceName}
          getSpaceTypeName={getSpaceTypeName}
          showSpaceInfo={spaceid === "all"}
        />
      </div>

      {/* Empty State */}
      {!loading && budgets.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-border-light-primary dark:border-border-dark-primary rounded-lg mt-6">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <PieChart size={32} />
            </div>
          </div>
          <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
            No Budgets Yet
          </h3>
          <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6 max-w-md mx-auto">
            Create your first budget to track spending and manage your finances effectively.
          </p>
          <Button
            text="Create Your First Budget"
            className="max-w-fit cursor-pointer"
            onClick={onNewOrEditMode}
          />
        </div>
      )}

      {/* Loading State */}
      {loading && budgets.length === 0 && (
          <Loading/>
      )}

      {/* CHANGED: Updated Space Selection Modal for multi-space support */}
      {newOrEditMode && spaceSelectionPhase && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-black/50 overflow-auto p-4 pt-10">
          <div className="relative w-full max-w-2xl rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-xl p-6">
            <div className="flex shrink-0 items-center pb-6 text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              Select Spaces for Budget
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-text-light-primary dark:text-text-dark-primary font-medium">
                    Select Spaces <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Button
                      text="Select All"
                      className="max-w-fit text-xs cursor-pointer"
                      priority="secondary"
                      onClick={selectAllSpaces}
                    />
                    <Button
                      text="Clear All"
                      className="max-w-fit text-xs cursor-pointer"
                      priority="secondary"
                      onClick={clearAllSpaces}
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-border-light-primary dark:border-border-dark-primary rounded-md p-4">
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">
                    {selectedSpacesForAllSpaces.length === 0 ? (
                      <span className="text-blue-600 dark:text-blue-400 italic">
                        Select one or more spaces for this budget
                      </span>
                    ) : selectedSpacesForAllSpaces.length === allowedSpaces.length ? (
                      <span className="text-green-600 dark:text-green-400 italic">
                        All available spaces selected
                      </span>
                    ) : (
                      `Selected ${selectedSpacesForAllSpaces.length} of ${allowedSpaces.length} spaces`
                    )}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allowedSpaces.map((space) => (
                      <label
                        key={space.id}
                        className="flex items-center space-x-3 p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md hover:bg-bg-light-primary dark:hover:bg-bg-dark-primary cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSpacesForAllSpaces.includes(space.id)}
                          onChange={() => onSpaceToggle(space.id)}
                          className="rounded border-border-light-primary dark:border-border-dark-primary text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                            {capitalize(space.name)}
                          </div>
                          <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                            {capitalize(space.type.replace('_', ' '))}
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${space.type === 'CASH' ? 'bg-amber-500' :
                          space.type === 'BANK' ? 'bg-blue-500' :
                            space.type === 'CREDIT_CARD' ? 'bg-purple-500' : 'bg-gray-500'
                          }`} />
                      </label>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-3 px-1">
                  You can select multiple spaces to apply the same budget across them
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center pt-8 justify-end space-x-3 border-t border-border-light-primary/30 dark:border-border-dark-primary/30">
                <Button
                  text="Cancel"
                  className="max-w-fit px-6 cursor-pointer"
                  priority="secondary"
                  onClick={onCancel}
                  type="button"
                />
                <Button
                  text="Continue"
                  className="max-w-fit px-6 cursor-pointer"
                  onClick={handleSpaceSelection}
                  disabled={selectedSpacesForAllSpaces.length === 0}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New/Edit Budget Modal */}
      {newOrEditMode && !spaceSelectionPhase && (
        <BudgetModal
          isOpen={newOrEditMode}
          onClose={onCancel}
          onSubmit={onSubmit}
          inputs={inputs}
          onInputChange={onInputChange}
          onUpdateAmount={handleUpdateBudgetAmount}
          onSubCategoryToggle={onSubCategoryToggle}
          selectAllSubCategories={selectAllSubCategories}
          clearAllSubCategories={clearAllSubCategories}
          filteredCategories={filteredCategories}
          filteredSubCategories={filteredSubCategories}
          selectedSubCategories={selectedSubCategories}
          editId={editId}
          loading={loading}
          getTodayDate={getTodayDate}
          allowedSpaces={allowedSpaces}
          showSpaceField={spaceid === "all" && !spaceSelectionPhase}
          isAllSpacesMode={spaceid === "all"}
          selectedSpacesForAllSpaces={selectedSpacesForAllSpaces}
        />
      )}

      {/* Budget Detail Modal */}
      {detailModal.isOpen && detailModal.budget && (
        <BudgetDetailModal
          budget={detailModal.budget}
          spendingData={detailModal.spendingData}
          categories={categories}
          currency={currency || ""}
          onClose={closeBudgetDetail}
          onEdit={() => {
            closeBudgetDetail();
            onEditMode(detailModal.budget!);
          }}
          onDelete={() => {
            closeBudgetDetail();
            openDeleteConfirmation(detailModal.budget!._id, detailModal.budget!.name);
          }}
          onUpdateAmount={(scope: 'current' | 'future' | 'all') => {
            const budgetId = detailModal.budget!._id;
            handleUpdateBudgetAmount(budgetId, getBudgetAmount(detailModal.budget!.amount), scope);
          }}
          getSpaceName={getSpaceName}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleDelete}
        title="Delete Budget"
        message={`Are you sure you want to delete the budget "${confirmationModal.budgetName}"? This action cannot be undone.`}
        confirmText="Delete Budget"
        cancelText="Cancel"
      />
    </>
  );
}

export default Budget;
export type { BudgetInfo };
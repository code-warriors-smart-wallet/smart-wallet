import { capitalize } from "../../../../utils/utils";
import Button from "../../../Button";
import { BudgetType } from "../Budget";
import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Fallback icons if lucide-react is not available
const Eye = (props: any) => <span {...props}>👁️</span>;

interface BudgetListProps {
  title: string;
  type: BudgetType;
  budgets: any[];
  currency: string;
  categories: any[];
  isCollapsed: boolean;
  onToggle: () => void;
  onEdit: (budget: any) => void;
  onDelete: (budgetId: string, budgetName: string) => void;
  onViewDetails: (budget: any) => void;
  getSpaceName: (spaceId: string) => string;
  getSpaceTypeName: (spaceType: string) => string;
  showSpaceInfo: boolean;
}

function BudgetList({
  title,
  type,
  budgets,
  currency,
  categories,
  isCollapsed,
  onToggle,
  onEdit,
  onDelete,
  onViewDetails,
  getSpaceName,
  getSpaceTypeName,
  showSpaceInfo
}: BudgetListProps) {

  const transformCategories = (backendCategories: any[]) => {
    const categoryMap = new Map();

    backendCategories.forEach((cat: any) => {
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

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-orange-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getProgressTextColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 75) return "text-orange-500";
    if (percentage >= 50) return "text-yellow-500";
    return "text-green-500";
  };

  // Helper function to get budget amount
  const getBudgetAmount = (amount: any): number => {
    if (typeof amount === 'number') {
      return amount;
    } else if (amount && typeof amount === 'object' && '$numberDecimal' in amount) {
      return parseFloat(amount.$numberDecimal);
    }
    return 0;
  };

  if (budgets.length === 0) return null;

  return (
    <div className="border border-border-light-primary dark:border-border-dark-primary rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex justify-between items-center bg-bg-light-primary dark:bg-bg-dark-primary hover:bg-bg-light-secondary dark:hover:bg-bg-dark-secondary transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-3 h-12 rounded ${type === BudgetType.ONE_TIME ? 'bg-blue-500' :
              type === BudgetType.WEEKLY ? 'bg-green-500' :
                'bg-purple-500'
            }`} />
          <div className="text-left">
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              {title}
            </h2>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {budgets.length} budget{budgets.length !== 1 ? 's' : ''}
              {showSpaceInfo && ` across ${new Set(budgets.map(b => b.spaceId)).size} spaces`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {isCollapsed ? 'Show' : 'Hide'}
          </span>
          {isCollapsed ? (
            <ChevronDown size={20} className="text-text-light-secondary dark:text-text-dark-secondary" />
          ) : (
            <ChevronUp size={20} className="text-text-light-secondary dark:text-text-dark-secondary" />
          )}
        </div>
      </button>

      {/* Budget Cards - Collapsible */}
      {!isCollapsed && (
        <div className="p-6 bg-bg-light-secondary dark:bg-bg-dark-secondary">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => {
              const mainCategory = transformedCategories.find((cat: any) => cat._id === budget.mainCategoryId);
              const budgetAmount = getBudgetAmount(budget.amount);
              const spent = budget.spent || 0;
              const percentage = budget.percentage || (budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0);
              const remaining = budget.remaining || (budgetAmount - spent);

              return (
                <div
                  key={budget._id}
                  className="p-4 border border-border-light-primary dark:border-border-dark-primary rounded-lg bg-bg-light-primary dark:bg-bg-dark-primary hover:shadow-md transition-shadow"
                >
                  {/* Budget Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
                        {budget.name}
                      </h3>
                      {mainCategory && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: mainCategory.color }}
                          />
                          <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                            {capitalize(mainCategory.parentCategory)}
                          </span>
                        </div>
                      )}
                      {showSpaceInfo && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${budget.spaceType === 'CASH'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                              : budget.spaceType === 'BANK'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : budget.spaceType === 'CREDIT_CARD'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}>
                            {getSpaceTypeName(budget.spaceType)}
                          </span>
                          <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                            {getSpaceName(budget.spaceId)}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onViewDetails(budget)}
                      className="p-1 hover:bg-bg-light-secondary dark:hover:bg-bg-dark-secondary rounded cursor-pointer"
                      title="View Details"
                    >
                      <Eye size={16} className="text-text-light-secondary dark:text-text-dark-secondary" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        Progress
                      </span>
                      <span className={`text-xs font-bold ${getProgressTextColor(percentage)}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressBarColor(percentage)} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget Amounts */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        Budget:
                      </span>
                      <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                        {currency} {budgetAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        Spent:
                      </span>
                      <span className="font-medium text-red-500">
                        {currency} {spent.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        Remaining:
                      </span>
                      <span className="font-medium text-green-500">
                        {currency} {remaining.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Period */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        Period:
                      </span>
                      <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
                        {budget.startDate?.split('T')[0]} to {budget.endDate?.split('T')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      text="Edit"
                      className="max-w-fit flex-1 text-xs py-1 cursor-pointer"
                      onClick={() => onEdit(budget)}
                    />
                    <Button
                      text="Delete"
                      className="max-w-fit flex-1 text-xs py-1 hover:!bg-red-600 !bg-red-500 cursor-pointer"
                      onClick={() => onDelete(budget._id, budget.name)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetList;

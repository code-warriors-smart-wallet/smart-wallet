// import { capitalize } from "../../../../utils/utils";
// import Button from "../../../Button";
// import { BudgetType } from "../Budget";
// import React, { useEffect, useState, useMemo, useCallback } from "react";
// import { ChevronDown, ChevronUp } from "lucide-react";
// import { FaCreditCard, FaMoneyBillWave, FaUniversity } from "react-icons/fa"

// const Eye = (props: any) => <span {...props}>👁️</span>;

// interface BudgetListProps {
//   title: string;
//   type: BudgetType;
//   budgets: any[];
//   currency: string;
//   categories: any[];
//   isCollapsed: boolean;
//   onToggle: () => void;
//   onEdit: (budget: any) => void;
//   onDelete: (budgetId: string, budgetName: string) => void;
//   onViewDetails: (budget: any) => void;
//   getSpaceName: (spaceId: string) => string;
//   getSpaceTypeName: (spaceType: string) => string;
//   showSpaceInfo: boolean;
//   currentDate?: Date;
// }

// function BudgetList({
//   title,
//   type,
//   budgets,
//   currency,
//   categories,
//   isCollapsed,
//   onToggle,
//   onEdit,
//   onDelete,
//   onViewDetails,
//   getSpaceName,
//   getSpaceTypeName,
//   showSpaceInfo,
//   currentDate = new Date()
// }: BudgetListProps) {

//   const [budgetsWithCurrentEntries, setBudgetsWithCurrentEntries] = useState<any[]>([]);

//   const memoizedCurrentDate = useMemo(() => currentDate, [
//     currentDate.getTime()
//   ]);

//   // Memoize budgets to prevent unnecessary re-renders
//   const memoizedBudgets = useMemo(() => budgets, [JSON.stringify(budgets)]);

//   // Memoize the filter function
//   const filterBudgetsWithCurrentEntries = useCallback(async () => {
//     if (!memoizedBudgets || memoizedBudgets.length === 0) {
//       setBudgetsWithCurrentEntries([]);
//       return;
//     }

//     // Use a Set to track seen budget IDs to avoid duplicates
//     const seenBudgetIds = new Set<string>();
//     const uniqueBudgets: any[] = [];

//     // First, filter out duplicates based on _id
//     memoizedBudgets.forEach(budget => {
//       if (budget._id && !seenBudgetIds.has(budget._id)) {
//         seenBudgetIds.add(budget._id);
//         uniqueBudgets.push(budget);
//       }
//     });

//     // Filter budgets that have current entries for the current date
//     const budgetsWithEntries = uniqueBudgets.filter(budget => {
//       if (budget.entries && budget.entries.length > 0) {
//         const hasCurrentEntry = budget.entries.some((entry: any) => {
//           if (!entry.start_date || !entry.end_date) return false;

//           const entryStartDate = new Date(entry.start_date);
//           const entryEndDate = new Date(entry.end_date);
//           const today = memoizedCurrentDate;

//           return today >= entryStartDate && today <= entryEndDate;
//         });

//         return hasCurrentEntry;
//       }

//       // For budgets without entries array, check if they have currentEntry
//       if (budget.currentEntry) {
//         const entryStartDate = new Date(budget.currentEntry.start_date);
//         const entryEndDate = new Date(budget.currentEntry.end_date);
//         const today = memoizedCurrentDate;

//         return today >= entryStartDate && today <= entryEndDate;
//       }

//       // For ONE_TIME budgets with explicit dates
//       if (budget.type === 'ONE_TIME') {
//         const today = memoizedCurrentDate;
//         const budgetStartDate = budget.startDate ? new Date(budget.startDate) : null;
//         const budgetEndDate = budget.endDate ? new Date(budget.endDate) : null;

//         if (!budgetStartDate || !budgetEndDate) return false;

//         return today >= budgetStartDate && today <= budgetEndDate;
//       }

//       return false;
//     });


//     const budgetsWithCurrentEntry = budgetsWithEntries.map(budget => {
//       // Use existing currentEntry or find one
//       if (budget.currentEntry) {
//         return budget;
//       }

//       // If no currentEntry but has entries, find the current one
//       if (budget.entries && budget.entries.length > 0) {
//         const currentEntry = budget.entries.find((entry: any) => {
//           if (!entry.start_date || !entry.end_date) return false;

//           const entryStartDate = new Date(entry.start_date);
//           const entryEndDate = new Date(entry.end_date);
//           const today = memoizedCurrentDate;

//           return today >= entryStartDate && today <= entryEndDate;
//         });

//         return {
//           ...budget,
//           currentEntry
//         };
//       }

//       // For ONE_TIME budgets
//       if (budget.type === 'ONE_TIME') {
//         return {
//           ...budget,
//           currentEntry: {
//             start_date: budget.startDate,
//             end_date: budget.endDate,
//             amount: budget.amount,
//             spent: budget.spent || 0
//           }
//         };
//       }

//       return budget;
//     }).filter(budget => budget.currentEntry); // Only keep budgets with currentEntry

//     setBudgetsWithCurrentEntries(budgetsWithCurrentEntry);
//   }, [memoizedBudgets, memoizedCurrentDate]);

//   useEffect(() => {
//     filterBudgetsWithCurrentEntries();
//   }, [filterBudgetsWithCurrentEntries]);

//   // Memoize transformed categories to prevent unnecessary re-renders
//   const transformedCategories = useMemo(() => {
//     const categoryMap = new Map();

//     categories.forEach((cat: any) => {
//       if (!categoryMap.has(cat.parentCategoryId)) {
//         categoryMap.set(cat.parentCategoryId, {
//           _id: cat.parentCategoryId,
//           parentCategory: cat.parentCategory,
//           color: cat.color,
//           spaces: cat.spaces,
//           subCategories: []
//         });
//       }

//       const category = categoryMap.get(cat.parentCategoryId);
//       category.subCategories.push({
//         _id: cat.subCategoryId,
//         name: cat.subCategoryName,
//         color: cat.subCategoryColor,
//         transactionTypes: cat.transactionTypes
//       });
//     });

//     return Array.from(categoryMap.values());
//   }, [categories]);

//   const getProgressBarColor = (percentage: number) => {
//     if (percentage >= 90) return "bg-red-500";
//     if (percentage >= 75) return "bg-orange-500";
//     if (percentage >= 50) return "bg-yellow-500";
//     return "bg-green-500";
//   };

//   const getProgressTextColor = (percentage: number) => {
//     if (percentage >= 90) return "text-red-500";
//     if (percentage >= 75) return "text-orange-500";
//     if (percentage >= 50) return "text-yellow-500";
//     return "text-green-500";
//   };

//   // Helper function to get budget amount
//   const getBudgetAmount = (amount: any): number => {
//     if (typeof amount === 'number') {
//       return amount;
//     } else if (amount && typeof amount === 'object' && '$numberDecimal' in amount) {
//       return parseFloat(amount.$numberDecimal);
//     }
//     return 0;
//   };

//   if (budgetsWithCurrentEntries.length === 0) return null;

//   return (
//     <div className="border border-border-light-primary dark:border-border-dark-primary rounded-lg overflow-hidden">
//       {/* Header */}
//       <button
//         onClick={onToggle}
//         className="w-full px-6 py-4 flex justify-between items-center bg-bg-light-primary dark:bg-bg-dark-primary hover:bg-bg-light-secondary dark:hover:bg-bg-dark-secondary transition-colors cursor-pointer"
//       >
//         <div className="flex items-center gap-3">
//           <div className={`w-3 h-12 rounded ${type === BudgetType.ONE_TIME ? 'bg-blue-500' :
//             type === BudgetType.WEEKLY ? 'bg-green-500' :
//               'bg-purple-500'
//             }`} />
//           <div className="text-left">
//             <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
//               {title}
//             </h2>
//             <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
//               {budgetsWithCurrentEntries.length} active budget{budgetsWithCurrentEntries.length !== 1 ? 's' : ''}
//               {showSpaceInfo && ` across ${new Set(budgetsWithCurrentEntries.flatMap(b => b.spaceIds || [])).size} spaces`}
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2">
//           <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
//             {isCollapsed ? 'Show' : 'Hide'}
//           </span>
//           {isCollapsed ? (
//             <ChevronDown size={20} className="text-text-light-secondary dark:text-text-dark-secondary" />
//           ) : (
//             <ChevronUp size={20} className="text-text-light-secondary dark:text-text-dark-secondary" />
//           )}
//         </div>
//       </button>

//       {/* Budget Cards */}
//       {!isCollapsed && (
//         <div className="p-6 bg-bg-light-secondary dark:bg-bg-dark-secondary">
//           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//             {budgetsWithCurrentEntries.map((budget) => {
//               const mainCategory = transformedCategories.find((cat: any) => cat._id === budget.mainCategoryId);

//               const budgetAmount = budget.currentEntry
//                 ? getBudgetAmount(budget.currentEntry.amount || budget.currentEntry.amount)
//                 : getBudgetAmount(budget.amount);

//               const spent = budget.currentEntry?.spent || 0;
//               const percentage = budget.percentage || (budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0);
//               const remaining = budget.remaining || (budgetAmount - spent);

//               const budgetSpaceIds = budget.spaceIds || [];
//               const isMultiSpace = budget.isMultiSpace || budgetSpaceIds.length > 1;

//               return (
//                 <div
//                   key={budget._id}
//                   className="p-4 border border-border-light-primary dark:border-border-dark-primary rounded-lg bg-bg-light-primary dark:bg-bg-dark-primary hover:shadow-md transition-shadow"
//                 >
//                   {/* Budget Header */}
//                   <div className="flex justify-between items-start mb-4">
//                     <div>
//                       <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
//                         {budget.name}
//                       </h3>
//                       {isMultiSpace && (
//                         <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full mb-2 inline-block">
//                           Multi-space ({budgetSpaceIds.length})
//                         </span>
//                       )}
//                       {mainCategory && (
//                         <div className="flex items-center gap-2 mt-1">
//                           <div
//                             className="w-3 h-3 rounded"
//                             style={{ backgroundColor: mainCategory.color }}
//                           />
//                           <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
//                             {capitalize(mainCategory.parentCategory)}
//                           </span>
//                         </div>
//                       )}
//                       {showSpaceInfo && (
//                         <div className="mt-2">
//                           <div className="flex flex-wrap gap-1">
//                             {budgetSpaceIds.map((spaceId: string, index: number) => {
//                               const spaceType = budget.spaceTypes?.[index] || 'UNKNOWN';
//                               return (
//                                 <span
//                                   key={spaceId}
//                                   className={`text-xs px-2 py-1 rounded font-medium inline-flex items-center gap-1 ${spaceType === 'CASH'
//                                     ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
//                                     : spaceType === 'BANK'
//                                       ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
//                                       : spaceType === 'CREDIT_CARD'
//                                         ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
//                                         : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
//                                     }`}>
//                                   {spaceType === 'CASH' ? (
//                                     <FaMoneyBillWave size={10} />
//                                   ) : spaceType === 'BANK' ? (
//                                     <FaUniversity size={10} />
//                                   ) : spaceType === 'CREDIT_CARD' ? (
//                                     <FaCreditCard size={10} />
//                                   ) : null}
//                                   {getSpaceName(spaceId)}
//                                 </span>
//                               );
//                             })}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                     <button
//                       onClick={() => onViewDetails(budget)}
//                       className="p-1 hover:bg-bg-light-secondary dark:hover:bg-bg-dark-secondary rounded cursor-pointer"
//                       title="View Details"
//                     >
//                       <Eye size={16} className="text-text-light-secondary dark:text-text-dark-secondary" />
//                     </button>
//                   </div>

//                   {/* Progress Bar */}
//                   <div className="mb-4">
//                     <div className="flex justify-between items-center mb-1">
//                       <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
//                         Progress
//                       </span>
//                       <span className={`text-xs font-bold ${getProgressTextColor(percentage)}`}>
//                         {percentage.toFixed(1)}%
//                       </span>
//                     </div>
//                     <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
//                       <div
//                         className={`h-full ${getProgressBarColor(percentage)} transition-all duration-500`}
//                         style={{ width: `${percentage}%` }}
//                       />
//                     </div>
//                   </div>

//                   {/* Budget Amounts */}
//                   <div className="space-y-2 mb-4">
//                     <div className="flex justify-between items-center">
//                       <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
//                         Budget:
//                       </span>
//                       <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
//                         {currency} {budgetAmount.toFixed(2)}
//                       </span>
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
//                         Spent:
//                       </span>
//                       <span className="font-medium text-red-500">
//                         {currency} {spent.toFixed(2)}
//                       </span>
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
//                         Remaining:
//                       </span>
//                       <span className="font-medium text-green-500">
//                         {currency} {remaining.toFixed(2)}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Period */}
//                   <div className="mb-4">
//                     <div className="flex justify-between items-center">
//                       <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
//                         Period:
//                       </span>
//                       <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
//                         {budget.currentEntry?.start_date
//                           ? new Date(budget.currentEntry.start_date).toISOString().split('T')[0]
//                           : 'N/A'
//                         } to {
//                           budget.currentEntry?.end_date
//                             ? new Date(budget.currentEntry.end_date).toISOString().split('T')[0]
//                             : 'N/A'
//                         }
//                       </span>
//                     </div>
//                     <div className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary text-right">
//                       {budget.type === 'ONE_TIME' ? 'One-time budget' :
//                         `Current ${budget.type.toLowerCase()} period`}
//                     </div>
//                   </div>

//                   {/* Action Buttons */}
//                   <div className="flex gap-2">
//                     <Button
//                       text="Edit"
//                       className="max-w-fit flex-1 text-xs py-1 cursor-pointer"
//                       onClick={() => onEdit(budget)}
//                     />
//                     <Button
//                       text="Delete"
//                       className="max-w-fit flex-1 text-xs py-1 hover:!bg-red-600 !bg-red-500 cursor-pointer"
//                       onClick={() => onDelete(budget._id, budget.name)}
//                     />
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default BudgetList;

/*********************************************************************************************************************** */

import { capitalize } from "../../../../utils/utils";
import Button from "../../../Button";
import { BudgetType } from "../Budget";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { ChevronDown, ChevronUp, Eye } from "lucide-react";
import { FaCreditCard, FaMoneyBillWave, FaUniversity } from "react-icons/fa"


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
  currentDate?: Date;
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
  showSpaceInfo,
  currentDate = new Date(),
}: BudgetListProps) {

  const [budgetsWithCurrentEntries, setBudgetsWithCurrentEntries] = useState<any[]>([]);

  const prevBudgetsRef = useRef<any[]>([]);

  const memoizedCurrentDate = useMemo(() => currentDate, [
    currentDate.getTime()
  ]);

  // Memoize the filter function
  const filterBudgetsWithCurrentEntries = useCallback(() => {
    if (!budgets || budgets.length === 0) {
      setBudgetsWithCurrentEntries([]);
      return;
    }

    // Use a Set to track seen budget IDs to avoid duplicates
    const seenBudgetIds = new Set<string>();
    const uniqueBudgets: any[] = [];

    // First, filter out duplicates based on _id
    budgets.forEach(budget => {
      if (budget._id && !seenBudgetIds.has(budget._id)) {
        seenBudgetIds.add(budget._id);
        uniqueBudgets.push(budget);
      }
    });

    // Filter budgets that have current entries for the current date
    const budgetsWithEntries = uniqueBudgets.filter(budget => {
      if (budget.entries && budget.entries.length > 0) {
        const hasCurrentEntry = budget.entries.some((entry: any) => {
          if (!entry.start_date || !entry.end_date) return false;

          const entryStartDate = new Date(entry.start_date);
          const entryEndDate = new Date(entry.end_date);
          const today = memoizedCurrentDate;

          return today >= entryStartDate && today <= entryEndDate;
        });

        return hasCurrentEntry;
      }

      // For budgets without entries array, check if they have currentEntry
      if (budget.currentEntry) {
        const entryStartDate = new Date(budget.currentEntry.start_date);
        const entryEndDate = new Date(budget.currentEntry.end_date);
        const today = memoizedCurrentDate;

        return today >= entryStartDate && today <= entryEndDate;
      }

      // For ONE_TIME budgets with explicit dates
      if (budget.type === 'ONE_TIME') {
        const today = memoizedCurrentDate;
        const budgetStartDate = budget.startDate ? new Date(budget.startDate) : null;
        const budgetEndDate = budget.endDate ? new Date(budget.endDate) : null;

        if (!budgetStartDate || !budgetEndDate) return false;

        return today >= budgetStartDate && today <= budgetEndDate;
      }

      return false;
    });


    const budgetsWithCurrentEntry = budgetsWithEntries.map(budget => {
      // Use existing currentEntry or find one
      if (budget.currentEntry) {
        return budget;
      }

      // If no currentEntry but has entries, find the current one
      if (budget.entries && budget.entries.length > 0) {
        const currentEntry = budget.entries.find((entry: any) => {
          if (!entry.start_date || !entry.end_date) return false;

          const entryStartDate = new Date(entry.start_date);
          const entryEndDate = new Date(entry.end_date);
          const today = memoizedCurrentDate;

          return today >= entryStartDate && today <= entryEndDate;
        });

        return {
          ...budget,
          currentEntry
        };
      }

      // For ONE_TIME budgets
      if (budget.type === 'ONE_TIME') {
        return {
          ...budget,
          currentEntry: {
            start_date: budget.startDate,
            end_date: budget.endDate,
            amount: budget.amount,
            spent: budget.spent || 0
          }
        };
      }

      return budget;
    }).filter(budget => budget.currentEntry); // Only keep budgets with currentEntry

    const budgetsString = JSON.stringify(budgetsWithCurrentEntry);
    const prevBudgetsString = JSON.stringify(prevBudgetsRef.current);

    if (budgetsString !== prevBudgetsString) {
      setBudgetsWithCurrentEntries(budgetsWithCurrentEntry);
      prevBudgetsRef.current = budgetsWithCurrentEntry;
    }
  }, [budgets, memoizedCurrentDate]);

  useEffect(() => {
    filterBudgetsWithCurrentEntries();
  }, [filterBudgetsWithCurrentEntries]);

  // Memoize transformed categories to prevent unnecessary re-renders
  const transformedCategories = useMemo(() => {
    const categoryMap = new Map();

    categories.forEach((cat: any) => {
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
  }, [categories]);

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

  if (budgetsWithCurrentEntries.length === 0) return null;

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
              {budgetsWithCurrentEntries.length} active budget{budgetsWithCurrentEntries.length !== 1 ? 's' : ''}
              {showSpaceInfo && ` across ${new Set(budgetsWithCurrentEntries.flatMap(b => b.spaceIds || [])).size} spaces`}
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

      {/* Budget Cards */}
      {!isCollapsed && (
        <div className="p-6 bg-bg-light-secondary dark:bg-bg-dark-secondary">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgetsWithCurrentEntries.map((budget) => {
              const mainCategory = transformedCategories.find((cat: any) => cat._id === budget.mainCategoryId);

              const budgetAmount = budget.currentEntry
                ? getBudgetAmount(budget.currentEntry.amount || budget.currentEntry.amount)
                : getBudgetAmount(budget.amount);

              const spent = budget.currentEntry?.spent || 0;
              const percentage = budget.percentage || (budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0);
              const remaining = budget.remaining || (budgetAmount - spent);

              const budgetSpaceIds = budget.spaceIds || [];
              const isMultiSpace = budget.isMultiSpace || budgetSpaceIds.length > 1;

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
                      {isMultiSpace && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full mb-2 inline-block">
                          Multi-space ({budgetSpaceIds.length})
                        </span>
                      )}
                      {mainCategory && (
                        <div className="flex items-center gap-2 mt-1">
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
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {budgetSpaceIds.map((spaceId: string, index: number) => {
                              const spaceType = budget.spaceTypes?.[index] || 'UNKNOWN';
                              return (
                                <span
                                  key={spaceId}
                                  className={`text-xs px-2 py-1 rounded font-medium inline-flex items-center gap-1 ${spaceType === 'CASH'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                    : spaceType === 'BANK'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                      : spaceType === 'CREDIT_CARD'
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                    }`}>
                                  {spaceType === 'CASH' ? (
                                    <FaMoneyBillWave size={10} />
                                  ) : spaceType === 'BANK' ? (
                                    <FaUniversity size={10} />
                                  ) : spaceType === 'CREDIT_CARD' ? (
                                    <FaCreditCard size={10} />
                                  ) : null}
                                  {getSpaceName(spaceId)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onViewDetails(budget)}
                      className="p-1 hover:bg-bg-light-secondary dark:hover:bg-bg-dark-secondary rounded cursor-pointer"
                      title="View Details"
                    >
                      <Eye size={18} className="text-text-light-secondary dark:text-text-dark-secondary group-hover:text-primary dark:group-hover:text-primary transition-colors duration-200" />
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
                        {budget.currentEntry?.start_date
                          ? new Date(budget.currentEntry.start_date).toISOString().split('T')[0]
                          : 'N/A'
                        } to {
                          budget.currentEntry?.end_date
                            ? new Date(budget.currentEntry.end_date).toISOString().split('T')[0]
                            : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary text-right">
                      {budget.type === 'ONE_TIME' ? 'One-time budget' :
                        `Current ${budget.type.toLowerCase()} period`}
                    </div>
                  </div>

                  {/* Action Buttons */}

                  {budget.canEdit && (
                    <div className="flex gap-2 mt-4">
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
                  )}

                  {/* If user cannot edit, show view-only indicator */}
                  {!budget.canEdit && (
                    <div className="mt-4 text-center text-xs text-text-light-secondary dark:text-text-dark-secondary border-t pt-2">
                      View-only (created by another member)
                    </div>
                  )}
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






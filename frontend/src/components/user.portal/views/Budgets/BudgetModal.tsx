// import React, { useState, useEffect } from "react";
// import Button from "../../../Button";
// import { BudgetType, BudgetInfo } from "../Budget";
// import { capitalize } from "../../../../utils/utils";
// import UpdateBudgetModal from "./UpdateBudgetModal";
// import { toast } from "react-toastify";

// interface BudgetModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
//   inputs: BudgetInfo;
//   onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
//   onSubCategoryToggle: (subCategoryId: string) => void;
//   selectAllSubCategories: () => void;
//   clearAllSubCategories: () => void;
//   filteredCategories: any[];
//   filteredSubCategories: any[];
//   selectedSubCategories: Set<string>;
//   editId: string | null;
//   loading: boolean;
//   getTodayDate: () => string;
//   allowedSpaces: any[];
//   showSpaceField: boolean;
//   isAllSpacesMode: boolean;
//   selectedSpacesForAllSpaces: string[];
//   onUpdateAmount?: (budgetId: string, amount: number, scope: 'current' | 'future' | 'all') => Promise<void>;
// }

// const BudgetModal: React.FC<BudgetModalProps> = ({
//   isOpen,
//   onClose,
//   onSubmit,
//   inputs,
//   onInputChange,
//   onSubCategoryToggle,
//   selectAllSubCategories,
//   clearAllSubCategories,
//   filteredCategories,
//   filteredSubCategories,
//   selectedSubCategories,
//   editId,
//   loading,
//   allowedSpaces,
//   selectedSpacesForAllSpaces,
//   onUpdateAmount
// }) => {
//   const [isUpdateBudgetModalOpen, setIsUpdateBudgetModalOpen] = useState(false);
//   const [tempAmount, setTempAmount] = useState<string>("");

//   useEffect(() => {
//     if (isOpen && editId) {
//       setTempAmount(inputs.amount.toString());
//     }
//   }, [isOpen, editId, inputs.amount]);

//   if (!isOpen) return null;

//   const getStartOfWeek = (date: Date): Date => {
//     const day = date.getUTCDay();
//     const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
//     const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff));
//     start.setUTCHours(0, 0, 0, 0);
//     return start;
//   };

//   const getEndOfWeek = (date: Date): Date => {
//     const start = getStartOfWeek(new Date(date));
//     const end = new Date(start);
//     end.setUTCDate(start.getUTCDate() + 6);
//     end.setUTCHours(23, 59, 59, 999);
//     return end;
//   };

//   const getStartOfMonth = (date: Date): Date => {
//     const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
//     start.setUTCHours(0, 0, 0, 0);
//     return start;
//   };

//   const getEndOfMonth = (date: Date): Date => {
//     const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
//     end.setUTCHours(23, 59, 59, 999);
//     return end;
//   };

//   const formatDate = (date: Date): string => {
//     return date.toISOString().split('T')[0];
//   };

//   const getPeriodDescription = () => {
//     const today = new Date();
//     switch (inputs.type) {
//       case BudgetType.WEEKLY:
//         const weekStart = getStartOfWeek(today);
//         const weekEnd = getEndOfWeek(today);
//         return `Week ${formatDate(weekStart)} to ${formatDate(weekEnd)}`;
//       case BudgetType.MONTHLY:
//         const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
//         return monthName;
//       case BudgetType.ONE_TIME:
//         const start = inputs.startDate ? new Date(inputs.startDate).toLocaleDateString() : 'N/A';
//         const end = inputs.endDate ? new Date(inputs.endDate).toLocaleDateString() : 'N/A';
//         return `${start} to ${end}`;
//       default:
//         return 'Current Period';
//     }
//   };

//   const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setTempAmount(value);

//     // For new budgets, update directly
//     if (!editId) {
//       onInputChange(e);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     // Validate form
//     if (!inputs.name.trim()) {
//       toast.error("Budget name is required!");
//       return;
//     }

//     if (!tempAmount || parseFloat(tempAmount) <= 0) {
//       toast.error("Budget amount must be greater than 0!");
//       return;
//     }

//     // If editing and amount changed, show scope selection modal
//     if (editId && parseFloat(tempAmount) !== inputs.amount && onUpdateAmount) {
//       setIsUpdateBudgetModalOpen(true);
//       return; // Don't submit yet, wait for scope selection
//     }

//     // For new budgets or amount hasn't changed, submit normally
//     onSubmit(e);
//   };

//   const handleScopeSelect = async (scope: 'current' | 'future' | 'all') => {
//     if (editId && onUpdateAmount && tempAmount) {
//       try {
//         const newAmount = parseFloat(tempAmount);
//         if (!isNaN(newAmount) && newAmount > 0) {
//           await onUpdateAmount(editId, newAmount, scope);
//           setIsUpdateBudgetModalOpen(false);
//           onClose();
//         }
//       } catch (error) {
//         console.error("Error updating budget amount:", error);
//         toast.error("Failed to update budget amount");
//       }
//     }
//   };

//   // Calculate display dates based on budget type
//   const getDisplayDates = () => {
//     const today = new Date();
//     let startDate = "";
//     let endDate = "";
//     let periodDescription = "";

//     switch (inputs.type) {
//       case BudgetType.ONE_TIME:
//         startDate = inputs.startDate ? inputs.startDate.split('T')[0] : formatDate(new Date());
//         endDate = inputs.endDate ? inputs.endDate.split('T')[0] : formatDate(new Date());
//         periodDescription = "Select custom start and end dates";
//         break;

//       case BudgetType.WEEKLY:
//         const weekStart = getStartOfWeek(today);
//         const weekEnd = getEndOfWeek(today);
//         startDate = formatDate(weekStart);
//         endDate = formatDate(weekEnd);
//         periodDescription = "Automatically set to current week (Monday to Sunday) and repeats every week";
//         break;

//       case BudgetType.MONTHLY:
//         const monthStart = getStartOfMonth(today);
//         const monthEnd = getEndOfMonth(today);
//         startDate = formatDate(monthStart);
//         endDate = formatDate(monthEnd);
//         periodDescription = "Automatically set to current month (1st to last day) and repeats every month";
//         break;
//     }

//     return { startDate, endDate, periodDescription };
//   };

//   const { startDate: displayStartDate, endDate: displayEndDate, periodDescription } = getDisplayDates();

//   const isFieldDisabled = (fieldName: keyof BudgetInfo): boolean => {
//     if (editId) {
//       return !['amount', 'startDate', 'endDate'].includes(fieldName);
//     }
//     return false;
//   };

//   const getSelectedSpaceNames = () => {
//     return selectedSpacesForAllSpaces.map(spaceId => {
//       const space = allowedSpaces.find(s => s.id === spaceId);
//       return space ? `${capitalize(space.name)} - ${capitalize(space.type.replace("_", " "))}` : "Unknown Space";
//     });
//   };

//   return (
//     <>
//       <div className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-black/50 overflow-auto p-4 pt-10">
//         <div className="relative w-full max-w-2xl rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-6">
//           <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
//             {editId ? "Edit Budget" : "New Budget"}
//           </div>

//           {/* Space display for multi-space budgets */}
//           {selectedSpacesForAllSpaces.length > 0 && (
//             <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 shadow-sm">
//               <div className="flex items-center gap-2 mb-3">
//                 <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
//                   <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
//                   </svg>
//                 </div>
//                 <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
//                   {editId ? "Updating budget for:" : "Creating budget for:"}
//                 </p>
//               </div>

//               <div className="space-y-2.5 pl-2">
//                 {getSelectedSpaceNames().map((spaceName, index) => (
//                   <div key={index} className="flex items-center gap-3 group">
//                     <div className="relative">
//                       <div className="w-2.5 h-2.5 rounded-full bg-blue-500 group-hover:bg-blue-600 transition-colors"></div>
//                       <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
//                     </div>
//                     <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
//                       {spaceName}
//                     </span>
//                   </div>
//                 ))}
//               </div>

//               {selectedSpacesForAllSpaces.length > 1 && (
//                 <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-800/30">
//                   <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
//                     <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
//                       <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
//                     </svg>
//                     <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
//                       Multi-space budget ({selectedSpacesForAllSpaces.length} spaces)
//                     </span>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           <form onSubmit={handleSubmit}>
//             <div className="space-y-4">
//               {/* Budget Name */}
//               <div>
//                 <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
//                   Budget Name <span className="text-red-500">*</span>:
//                 </label>
//                 <input
//                   name="name"
//                   type="text"
//                   placeholder="Enter budget name"
//                   value={inputs.name}
//                   onChange={onInputChange}
//                   disabled={isFieldDisabled('name')}
//                   className={`w-full p-3 border rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm ${isFieldDisabled('name')
//                     ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-70'
//                     : 'border-border-light-primary dark:border-border-dark-primary'
//                     }`}
//                   required
//                 />
//               </div>

//               {/* Budget Type */}
//               <div>
//                 <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
//                   Budget Type <span className="text-red-500">*</span>:
//                 </label>
//                 <select
//                   name="type"
//                   value={inputs.type}
//                   onChange={onInputChange}
//                   disabled={isFieldDisabled('type')}
//                   className={`w-full p-3 border rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm ${isFieldDisabled('type')
//                     ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-70'
//                     : 'border-border-light-primary dark:border-border-dark-primary'
//                     }`}
//                   required
//                 >
//                   {Object.values(BudgetType).map((type) => (
//                     <option key={type} value={type}>
//                       {capitalize(type.toLowerCase().replace('_', ' '))}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <>
//                 {/* Main Category Selection */}
//                 <div>
//                   <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
//                     Main Category <span className="text-red-500">*</span>:
//                   </label>
//                   <select
//                     name="mainCategoryId"
//                     value={inputs.mainCategoryId}
//                     onChange={onInputChange}
//                     disabled={isFieldDisabled('mainCategoryId')}
//                     className={`w-full p-3 border rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm ${isFieldDisabled('mainCategoryId')
//                       ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-70'
//                       : 'border-border-light-primary dark:border-border-dark-primary'
//                       }`}
//                     required
//                   >
//                     <option value="">Select a main category</option>
//                     {filteredCategories.map((category) => (
//                       <option key={category._id} value={category._id}>
//                         {category.parentCategory}
//                       </option>
//                     ))}
//                   </select>
//                   {filteredCategories.length === 0 && (
//                     <p className="text-xs text-red-500 mt-1">
//                       No categories available. Please set up expense categories for the selected spaces first.
//                     </p>
//                   )}
//                 </div>

//                 {/* Sub-categories Selection - Only show when main category is selected */}
//                 {inputs.mainCategoryId && (
//                   <div>
//                     <div className="flex justify-between items-center mb-2">
//                       <label className="block text-text-light-primary dark:text-text-dark-primary">
//                         Sub-categories:
//                       </label>
//                       <div className="flex gap-2">
//                         <Button
//                           text="Select All"
//                           className="max-w-fit text-xs cursor-pointer"
//                           priority="secondary"
//                           onClick={selectAllSubCategories}
//                           disabled={isFieldDisabled('subCategoryIds')}
//                         />
//                         <Button
//                           text="Clear All"
//                           className="max-w-fit text-xs cursor-pointer"
//                           priority="secondary"
//                           onClick={clearAllSubCategories}
//                           disabled={isFieldDisabled('subCategoryIds')}
//                         />
//                       </div>
//                     </div>

//                     <div className={`max-h-60 overflow-y-auto border rounded-md p-3 ${isFieldDisabled('subCategoryIds')
//                       ? 'border-gray-300 dark:border-gray-700 opacity-70'
//                       : 'border-border-light-primary dark:border-border-dark-primary'
//                       }`}>
//                       {filteredSubCategories.length === 0 ? (
//                         <div className="p-4 text-center">
//                           <p className="text-sm text-text-light-primary dark:text-text-dark-primary mb-2">
//                             No sub-categories available for this main category.
//                           </p>
//                           <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
//                             Budget will apply to all future sub-categories under this category.
//                           </p>
//                         </div>
//                       ) : (
//                         <>
//                           <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">
//                             {selectedSubCategories.size === 0 ? (
//                               <span className="text-blue-600 dark:text-blue-400 italic">
//                                 Budget will apply to All sub-categories under {filteredCategories.find(cat => cat._id === inputs.mainCategoryId)?.parentCategory}
//                               </span>
//                             ) : selectedSubCategories.size === filteredSubCategories.length ? (
//                               <span className="text-green-600 dark:text-green-400 italic">
//                                 Budget will apply to All sub-categories under {filteredCategories.find(cat => cat._id === inputs.mainCategoryId)?.parentCategory}
//                               </span>
//                             ) : (
//                               `Selected ${selectedSubCategories.size} of ${filteredSubCategories.length} sub-categories`
//                             )}
//                           </p>

//                           <div className="space-y-2">
//                             {filteredSubCategories.map((subCategory) => (
//                               <label
//                                 key={subCategory._id}
//                                 className={`flex items-center space-x-3 ${isFieldDisabled('subCategoryIds') ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
//                                   }`}
//                               >
//                                 <input
//                                   type="checkbox"
//                                   checked={selectedSubCategories.has(subCategory._id)}
//                                   onChange={() => !isFieldDisabled('subCategoryIds') && onSubCategoryToggle(subCategory._id)}
//                                   disabled={isFieldDisabled('subCategoryIds')}
//                                   className={`rounded border-border-light-primary dark:border-border-dark-primary text-primary focus:ring-primary ${isFieldDisabled('subCategoryIds') ? 'cursor-not-allowed' : ''
//                                     }`}
//                                 />
//                                 <span className="text-text-light-primary dark:text-text-dark-primary capitalize">
//                                   {capitalize(subCategory.name)}
//                                 </span>
//                                 <div
//                                   className="w-4 h-4 rounded"
//                                   style={{ backgroundColor: subCategory.color }}
//                                 />
//                               </label>
//                             ))}
//                           </div>
//                         </>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </>

//               {/* Budget Amount */}
//               <div>
//                 <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
//                   Budget Amount <span className="text-red-500">*</span>:
//                 </label>
//                 <input
//                   name="amount"
//                   type="number"
//                   placeholder="Enter budget amount"
//                   value={tempAmount}
//                   onChange={handleAmountChange}
//                   min="0.01"
//                   step="0.01"
//                   className="w-full p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
//                   required
//                 />
//                 {editId && tempAmount !== inputs.amount.toString() && (
//                   <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
//                     Amount changed. You'll be asked how to apply this change.
//                   </p>
//                 )}
//               </div>

//               {/* Date Section */}
//               <div className="space-y-4 p-4 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary/50 dark:bg-bg-dark-primary/50">
//                 <h3 className="font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
//                   Budget Period
//                 </h3>

//                 {inputs.type === BudgetType.ONE_TIME ? (
//                   // For One-Time budgets
//                   <>
//                     <div>
//                       <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
//                         Start Date <span className="text-red-500">*</span>:
//                       </label>
//                       <input
//                         name="startDate"
//                         type="date"
//                         value={inputs.startDate}
//                         onChange={onInputChange}
//                         className={`w-full p-3 border rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm ${isFieldDisabled('startDate')
//                           ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-70'
//                           : 'border-border-light-primary dark:border-border-dark-primary'
//                           }`}
//                         required
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
//                         End Date <span className="text-red-500">*</span>:
//                       </label>
//                       <input
//                         name="endDate"
//                         type="date"
//                         value={inputs.endDate}
//                         onChange={onInputChange}
//                         min={inputs.startDate}
//                         className={`w-full p-3 border rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm ${isFieldDisabled('endDate')
//                           ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-70'
//                           : 'border-border-light-primary dark:border-border-dark-primary'
//                           }`}
//                         required
//                       />
//                     </div>

//                     <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
//                       Select custom start and end dates for this one-time budget
//                     </p>
//                   </>
//                 ) : (
//                   // For Weekly/Monthly budgets, show auto-calculated dates (read-only)
//                   <>
//                     <div className="space-y-2">
//                       <div>
//                         <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
//                           Period:
//                         </label>
//                         <div className="grid grid-cols-2 gap-4">
//                           <div>
//                             <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">Start Date</p>
//                             <div className="p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-gray-100 dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary text-sm">
//                               {displayStartDate}
//                             </div>
//                           </div>
//                           <div>
//                             <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">End Date</p>
//                             <div className="p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-gray-100 dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary text-sm">
//                               {displayEndDate}
//                             </div>
//                           </div>
//                         </div>
//                       </div>

//                       <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-2">
//                         {periodDescription}
//                       </p>

//                       <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
//                         <p className="text-xs text-blue-600 dark:text-blue-400">
//                           <span className="font-medium">Note:</span> This {inputs.type.toLowerCase()} budget will automatically repeat every {inputs.type === BudgetType.WEEKLY ? 'week' : 'month'} starting from the current period.
//                         </p>
//                       </div>
//                     </div>
//                   </>
//                 )}
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex shrink-0 flex-wrap items-center pt-6 justify-end space-x-3">
//               <Button
//                 text="Cancel"
//                 className="max-w-fit cursor-pointer"
//                 priority="secondary"
//                 onClick={onClose}
//                 type="button"
//               />
//               <Button
//                 text={editId ? "Update Budget" : "Create Budget"}
//                 className="max-w-fit cursor-pointer"
//                 type="submit"
//                 disabled={loading}
//               />
//             </div>
//           </form>
//         </div>
//       </div>
//       <UpdateBudgetModal
//         isOpen={isUpdateBudgetModalOpen}
//         onClose={() => setIsUpdateBudgetModalOpen(false)}
//         onSelectScope={handleScopeSelect}
//         budgetType={inputs.type.toLowerCase()}
//         currentPeriod={getPeriodDescription()}
//       />
//     </>
//   );
// };

// export default BudgetModal;

/********************************************************************************************************************* */

import React, { useState, useEffect } from "react";
import Button from "../../../Button";
import { BudgetType, BudgetInfo } from "../Budget";
import { capitalize } from "../../../../utils/utils";
import UpdateBudgetModal from "./UpdateBudgetModal";
import { toast } from "react-toastify";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  inputs: BudgetInfo;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubCategoryToggle: (subCategoryId: string) => void;
  selectAllSubCategories: () => void;
  clearAllSubCategories: () => void;
  filteredCategories: any[];
  filteredSubCategories: any[];
  selectedSubCategories: Set<string>;
  editId: string | null;
  loading: boolean;
  getTodayDate: () => string;
  allowedSpaces: any[];
  showSpaceField: boolean;
  isAllSpacesMode: boolean;
  currentUserId: string | null;
  budgetCreatorId: string | null;
  selectedSpacesForAllSpaces: string[];
  onUpdateAmount?: (budgetId: string, amount: number, scope: 'current' | 'future' | 'all') => Promise<void>;
  onUpdateDates?: (budgetId: string, startDate: string, endDate: string) => Promise<void>;
}

const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  inputs,
  onInputChange,
  onSubCategoryToggle,
  selectAllSubCategories,
  clearAllSubCategories,
  filteredCategories,
  filteredSubCategories,
  selectedSubCategories,
  editId,
  loading,
  allowedSpaces,
  selectedSpacesForAllSpaces,
  onUpdateAmount,
  onUpdateDates,
  currentUserId,
  budgetCreatorId,
}) => {
  const [isUpdateBudgetModalOpen, setIsUpdateBudgetModalOpen] = useState(false);
  const [tempAmount, setTempAmount] = useState<string>("");
  const [originalStartDate, setOriginalStartDate] = useState<string>("");
  const [originalEndDate, setOriginalEndDate] = useState<string>("");
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [updateAction, setUpdateAction] = useState<'amount' | 'dates' | 'both' | null>(null);

  // Initialize tempAmount when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempAmount(inputs.amount.toString());
      setOriginalStartDate(inputs.startDate);
      setOriginalEndDate(inputs.endDate);
      setPendingAmount(null);
      setUpdateAction(null);
    }
  }, [isOpen, inputs.amount, inputs.startDate, inputs.endDate]);

  if (!isOpen) return null;

  const getStartOfWeek = (date: Date): Date => {
    const day = date.getUTCDay();
    const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff));
    start.setUTCHours(0, 0, 0, 0);
    return start;
  };

  const getEndOfWeek = (date: Date): Date => {
    const start = getStartOfWeek(new Date(date));
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);
    return end;
  };

  const getStartOfMonth = (date: Date): Date => {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    start.setUTCHours(0, 0, 0, 0);
    return start;
  };

  const getEndOfMonth = (date: Date): Date => {
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
    end.setUTCHours(23, 59, 59, 999);
    return end;
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getPeriodDescription = () => {
    const today = new Date();
    switch (inputs.type) {
      case BudgetType.WEEKLY:
        const weekStart = getStartOfWeek(today);
        const weekEnd = getEndOfWeek(today);
        return `Week ${formatDate(weekStart)} to ${formatDate(weekEnd)}`;
      case BudgetType.MONTHLY:
        const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return monthName;
      case BudgetType.ONE_TIME:
        const start = inputs.startDate ? new Date(inputs.startDate).toLocaleDateString() : 'N/A';
        const end = inputs.endDate ? new Date(inputs.endDate).toLocaleDateString() : 'N/A';
        return `${start} to ${end}`;
      default:
        return 'Current Period';
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempAmount(value);

    // For new budgets, update directly
    if (!editId) {
      // Create a synthetic event to pass to onInputChange
      const syntheticEvent = {
        target: {
          name: 'amount',
          value: value
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(syntheticEvent);
    }
  };

  // Handle form submission with proper logic for one-time budgets
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    if (!inputs.name.trim()) {
      toast.error("Budget name is required!");
      return;
    }

    if (!tempAmount || parseFloat(tempAmount) <= 0) {
      toast.error("Budget amount must be greater than 0!");
      return;
    }

    // If this is a new budget (not editing), submit normally
    if (!editId) {
      onSubmit(e);
      return;
    }

    const newAmount = parseFloat(tempAmount);
    const amountChanged = newAmount !== inputs.amount;
    const datesChanged = inputs.type === BudgetType.ONE_TIME &&
      (inputs.startDate !== originalStartDate || inputs.endDate !== originalEndDate);

    // Properly handle one-time budget updates
    if (inputs.type === BudgetType.ONE_TIME) {
      // For one-time budgets, amount updates should NOT show the update modal
      // They should just update the current budget entry directly

      let hasUpdates = false;

      if (amountChanged && onUpdateAmount) {
        // For one-time budgets, use 'current' scope directly (no modal)
        try {
          await onUpdateAmount(editId, newAmount, 'current');
          hasUpdates = true;
        } catch (error) {
          console.error("Error updating budget amount:", error);
          return;
        }
      }

      // Handle date changes for one-time budgets
      if (datesChanged && onUpdateDates) {
        try {
          await onUpdateDates(editId, inputs.startDate, inputs.endDate);
          hasUpdates = true;
        } catch (error) {
          console.error("Error updating budget dates:", error);
          return;
        }
      }

      // If all updates were successful, close the modal
      if (!hasUpdates) {
        onClose();
      } else {
        // Wait a bit for the toast to show, then close
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } else {
      // Weekly/Monthly budgets - only amount changes possible
      if (amountChanged && onUpdateAmount) {
        setUpdateAction('amount');
        setPendingAmount(newAmount);
        setIsUpdateBudgetModalOpen(true);
        return;
      }

      // If nothing changed, just close
      if (!amountChanged) {
        onClose();
        return;
      }
    }
  };

  // Handle scope selection for amount updates (only for weekly/monthly budgets)
  const handleScopeSelect = async (scope: 'current' | 'future' | 'all') => {
    if (!editId) return;

    try {
      // Update amount with selected scope
      if (pendingAmount !== null && onUpdateAmount) {
        await onUpdateAmount(editId, pendingAmount, scope);
      }

      setIsUpdateBudgetModalOpen(false);
      onClose();
    } catch (error) {
      console.error("Error updating budget:", error);
      toast.error("Failed to update budget");
    }
  };

  const handleUpdateModalClose = () => {
    setIsUpdateBudgetModalOpen(false);
    setPendingAmount(null);
    setUpdateAction(null);
  };

  // Calculate display dates based on budget type
  const getDisplayDates = () => {
    const today = new Date();
    let startDate = "";
    let endDate = "";
    let periodDescription = "";

    switch (inputs.type) {
      case BudgetType.ONE_TIME:
        startDate = inputs.startDate ? inputs.startDate.split('T')[0] : formatDate(new Date());
        endDate = inputs.endDate ? inputs.endDate.split('T')[0] : formatDate(new Date());
        periodDescription = "Select custom start and end dates";
        break;

      case BudgetType.WEEKLY:
        const weekStart = getStartOfWeek(today);
        const weekEnd = getEndOfWeek(today);
        startDate = formatDate(weekStart);
        endDate = formatDate(weekEnd);
        periodDescription = "Automatically set to current week (Monday to Sunday) and repeats every week";
        break;

      case BudgetType.MONTHLY:
        const monthStart = getStartOfMonth(today);
        const monthEnd = getEndOfMonth(today);
        startDate = formatDate(monthStart);
        endDate = formatDate(monthEnd);
        periodDescription = "Automatically set to current month (1st to last day) and repeats every month";
        break;
    }

    return { startDate, endDate, periodDescription };
  };

  const { startDate: displayStartDate, endDate: displayEndDate, periodDescription } = getDisplayDates();

  const canEdit = !editId || (editId && budgetCreatorId === currentUserId);

  // Field disabling logic - only disable fields appropriately
  const isFieldDisabled = (fieldName: keyof BudgetInfo): boolean => {
    if (editId && !canEdit) return true; // Non-creator cannot edit
    if (editId) {
      // For one-time budgets, allow editing of amount, startDate, and endDate
      // For weekly/monthly, only allow editing of amount
      if (inputs.type === BudgetType.ONE_TIME) {
        return !['amount', 'startDate', 'endDate'].includes(fieldName);
      } else {
        return fieldName !== 'amount';
      }
    }
    return false;
  };

  const getSelectedSpaceNames = () => {
    return selectedSpacesForAllSpaces.map(spaceId => {
      const space = allowedSpaces.find(s => s.id === spaceId);
      return space ? `${capitalize(space.name)} - ${capitalize(space.type.replace("_", " "))}` : "Unknown Space";
    });
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-black/50 overflow-auto p-4 pt-10">
        <div className="relative w-full max-w-2xl rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-6">
          <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
            {editId ? (canEdit ? "Edit Budget" : "View Budget") : "New Budget"}
          </div>

          {/* Show view-only message if applicable */}
          {editId && !canEdit && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This budget was created by another member. You can view but cannot edit it.
              </p>
            </div>
          )}

          {/* Space display for multi-space budgets */}
          {selectedSpacesForAllSpaces.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {editId ? "Updating budget for:" : "Creating budget for:"}
                </p>
              </div>

              <div className="space-y-2.5 pl-2">
                {getSelectedSpaceNames().map((spaceName, index) => (
                  <div key={index} className="flex items-center gap-3 group">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 group-hover:bg-blue-600 transition-colors"></div>
                      <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                      {spaceName}
                    </span>
                  </div>
                ))}
              </div>

              {selectedSpacesForAllSpaces.length > 1 && (
                <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-800/30">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      Multi-space budget ({selectedSpacesForAllSpaces.length} spaces)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Budget Name */}
              <div>
                <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                  Budget Name <span className="text-red-500">*</span>:
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="Enter budget name"
                  value={inputs.name}
                  onChange={onInputChange}
                  disabled={isFieldDisabled('name')}
                  className={`w-full p-3 border rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm ${isFieldDisabled('name')
                    ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-70'
                    : 'border-border-light-primary dark:border-border-dark-primary'
                    }`}
                  required
                />
              </div>

              {/* Budget Type */}
              <div>
                <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                  Budget Type <span className="text-red-500">*</span>:
                </label>
                <select
                  name="type"
                  value={inputs.type}
                  onChange={onInputChange}
                  disabled={isFieldDisabled('type')}
                  className={`w-full p-3 border rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm ${isFieldDisabled('type')
                    ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-70'
                    : 'border-border-light-primary dark:border-border-dark-primary'
                    }`}
                  required
                >
                  {Object.values(BudgetType).map((type) => (
                    <option key={type} value={type}>
                      {capitalize(type.toLowerCase().replace('_', ' '))}
                    </option>
                  ))}
                </select>
              </div>

              <>
                {/* Main Category Selection */}
                <div>
                  <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                    Main Category <span className="text-red-500">*</span>:
                  </label>
                  <select
                    name="mainCategoryId"
                    value={inputs.mainCategoryId}
                    onChange={onInputChange}
                    disabled={isFieldDisabled('mainCategoryId')}
                    className={`w-full p-3 border rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm ${isFieldDisabled('mainCategoryId')
                      ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-70'
                      : 'border-border-light-primary dark:border-border-dark-primary'
                      }`}
                    required
                  >
                    <option value="">Select a main category</option>
                    {filteredCategories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.parentCategory}
                      </option>
                    ))}
                  </select>
                  {filteredCategories.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      No categories available. Please set up expense categories for the selected spaces first.
                    </p>
                  )}
                </div>

                {/* Sub-categories Selection - Only show when main category is selected */}
                {inputs.mainCategoryId && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-text-light-primary dark:text-text-dark-primary">
                        Sub-categories:
                      </label>
                      <div className="flex gap-2">
                        <Button
                          text="Select All"
                          className="max-w-fit text-xs cursor-pointer"
                          priority="secondary"
                          onClick={selectAllSubCategories}
                          disabled={isFieldDisabled('subCategoryIds')}
                        />
                        <Button
                          text="Clear All"
                          className="max-w-fit text-xs cursor-pointer"
                          priority="secondary"
                          onClick={clearAllSubCategories}
                          disabled={isFieldDisabled('subCategoryIds')}
                        />
                      </div>
                    </div>

                    <div className={`max-h-60 overflow-y-auto border rounded-md p-3 ${isFieldDisabled('subCategoryIds')
                      ? 'border-gray-300 dark:border-gray-700 opacity-70'
                      : 'border-border-light-primary dark:border-border-dark-primary'
                      }`}>
                      {filteredSubCategories.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-sm text-text-light-primary dark:text-text-dark-primary mb-2">
                            No sub-categories available for this main category.
                          </p>
                          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                            Budget will apply to all future sub-categories under this category.
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">
                            {selectedSubCategories.size === 0 ? (
                              <span className="text-blue-600 dark:text-blue-400 italic">
                                Budget will apply to All sub-categories under {filteredCategories.find(cat => cat._id === inputs.mainCategoryId)?.parentCategory}
                              </span>
                            ) : selectedSubCategories.size === filteredSubCategories.length ? (
                              <span className="text-green-600 dark:text-green-400 italic">
                                Budget will apply to All sub-categories under {filteredCategories.find(cat => cat._id === inputs.mainCategoryId)?.parentCategory}
                              </span>
                            ) : (
                              `Selected ${selectedSubCategories.size} of ${filteredSubCategories.length} sub-categories`
                            )}
                          </p>

                          <div className="space-y-2">
                            {filteredSubCategories.map((subCategory) => (
                              <label
                                key={subCategory._id}
                                className={`flex items-center space-x-3 ${isFieldDisabled('subCategoryIds') ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedSubCategories.has(subCategory._id)}
                                  onChange={() => !isFieldDisabled('subCategoryIds') && onSubCategoryToggle(subCategory._id)}
                                  disabled={isFieldDisabled('subCategoryIds')}
                                  className={`rounded border-border-light-primary dark:border-border-dark-primary text-primary focus:ring-primary ${isFieldDisabled('subCategoryIds') ? 'cursor-not-allowed' : ''
                                    }`}
                                />
                                <span className="text-text-light-primary dark:text-text-dark-primary capitalize">
                                  {capitalize(subCategory.name)}
                                </span>
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: subCategory.color }}
                                />
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>

              {/* Budget Amount */}
              <div>
                <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                  Budget Amount <span className="text-red-500">*</span>:
                </label>
                <input
                  name="amount"
                  type="number"
                  placeholder="Enter budget amount"
                  value={tempAmount}
                  onChange={handleAmountChange}
                  min="0.01"
                  step="0.01"
                  className="w-full p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                  required
                />
                {editId && tempAmount !== inputs.amount.toString() && inputs.type !== BudgetType.ONE_TIME && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Amount changed. You'll be asked how to apply this change.
                  </p>
                )}
                {editId && tempAmount !== inputs.amount.toString() && inputs.type === BudgetType.ONE_TIME && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Amount will be updated directly (one-time budgets don't require scope selection).
                  </p>
                )}
              </div>

              {/* Date Section */}
              <div className="space-y-4 p-4 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary/50 dark:bg-bg-dark-primary/50">
                <h3 className="font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                  Budget Period
                </h3>

                {inputs.type === BudgetType.ONE_TIME ? (
                  // For One-Time budgets
                  <>
                    <div>
                      <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                        Start Date <span className="text-red-500">*</span>:
                      </label>
                      <input
                        name="startDate"
                        type="date"
                        value={inputs.startDate}
                        onChange={onInputChange}
                        disabled={editId ? isFieldDisabled('startDate') : false}
                        className={`w-full p-3 border rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm ${isFieldDisabled('startDate')
                          ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-70'
                          : 'border-border-light-primary dark:border-border-dark-primary'
                          }`}
                        required
                      />
                      {editId && inputs.startDate !== originalStartDate && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Start date changed from {new Date(originalStartDate).toLocaleDateString()} to {new Date(inputs.startDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                        End Date <span className="text-red-500">*</span>:
                      </label>
                      <input
                        name="endDate"
                        type="date"
                        value={inputs.endDate}
                        onChange={onInputChange}
                        min={inputs.startDate}
                        disabled={editId ? isFieldDisabled('endDate') : false}
                        className={`w-full p-3 border rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm ${isFieldDisabled('endDate')
                          ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-70'
                          : 'border-border-light-primary dark:border-border-dark-primary'
                          }`}
                        required
                      />
                      {editId && inputs.endDate !== originalEndDate && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          End date changed from {new Date(originalEndDate).toLocaleDateString()} to {new Date(inputs.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Show message for date-only changes */}
                    {editId && (inputs.startDate !== originalStartDate || inputs.endDate !== originalEndDate) &&
                      tempAmount === inputs.amount.toString() && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                          Dates will be updated directly when you click "Update Budget" (no scope selection needed).
                        </p>
                      )}

                    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                      Select custom start and end dates for this one-time budget
                    </p>
                  </>
                ) : (
                  // For Weekly/Monthly budgets, show auto-calculated dates (read-only)
                  <>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                          Period:
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">Start Date</p>
                            <div className="p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-gray-100 dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary text-sm">
                              {displayStartDate}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">End Date</p>
                            <div className="p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-gray-100 dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary text-sm">
                              {displayEndDate}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-2">
                        {periodDescription}
                      </p>

                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          <span className="font-medium">Note:</span> This {inputs.type.toLowerCase()} budget will automatically repeat every {inputs.type === BudgetType.WEEKLY ? 'week' : 'month'} starting from the current period.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex shrink-0 flex-wrap items-center pt-6 justify-end space-x-3">
              <Button
                text="Cancel"
                className="max-w-fit cursor-pointer"
                priority="secondary"
                onClick={onClose}
                type="button"
              />
              {canEdit && (
                <Button
                  text={editId ? "Update Budget" : "Create Budget"}
                  className="max-w-fit cursor-pointer"
                  type="submit"
                  disabled={loading}
                />
              )}
              {editId && !canEdit && (
                <Button
                  text="Close"
                  className="max-w-fit cursor-pointer"
                  onClick={onClose}
                />
              )}
            </div>
          </form>
        </div>
      </div>
      {/* Only show update modal for weekly/monthly budgets */}
      {canEdit && inputs.type !== BudgetType.ONE_TIME && (
        <UpdateBudgetModal
          isOpen={isUpdateBudgetModalOpen}
          onClose={handleUpdateModalClose}
          onSelectScope={handleScopeSelect}
          budgetType={inputs.type.toLowerCase()}
          currentPeriod={getPeriodDescription()}
        />
      )}
    </>
  );
};

export default BudgetModal;
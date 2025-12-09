import { useParams } from "react-router-dom";
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
import { PieChart, Calendar, TrendingUp, Grid, BarChart } from "lucide-react";

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
  spaceId: string;
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
  spaceId: string;
  spaceType: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
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

// Helper function to get decimal amount from budget
const getBudgetAmount = (amount: number | { $numberDecimal: string }): number => {
  if (typeof amount === 'number') {
    return amount;
  } else if (amount && typeof amount === 'object' && '$numberDecimal' in amount) {
    return parseFloat(amount.$numberDecimal);
  }
  return 0;
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

function Budget() {
  const { spacetype, spaceid } = useParams();
  const { spaces, currency } = useSelector((state: RootState) => state.auth);
  const { getCategoriesBySpace } = CategoryService();
  const {
    createBudget,
    getBudgetsBySpace,
    getBudgetsBySpaceType,
    updateBudget,
    deleteBudget,
    getBudgetSpending
  } = BudgetService();

  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [budgetsWithSpending, setBudgetsWithSpending] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [newOrEditMode, setNewOrEditMode] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [spaceSelectionPhase, setSpaceSelectionPhase] = useState<boolean>(false);
  const [selectedSpaceForAllSpaces, setSelectedSpaceForAllSpaces] = useState<string>("");

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
    spaceId: spaceid === "all" ? "" : spaceid || "",
    startDate: "",
    endDate: "",
  });

  const [selectedSubCategories, setSelectedSubCategories] = useState<Set<string>>(new Set());

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  // Calculate end date based on budget type and start date
  const calculateEndDate = (startDate: string, budgetType: BudgetType): string => {
    if (!startDate) return "";

    const start = new Date(startDate);
    const end = new Date(start);

    switch (budgetType) {
      case BudgetType.ONE_TIME:
        end.setDate(start.getDate() + 1);
        break;
      case BudgetType.WEEKLY:
        end.setDate(start.getDate() + 7);
        break;
      case BudgetType.MONTHLY:
        end.setMonth(start.getMonth() + 1);
        end.setDate(0); // Last day of previous month
        break;
      default:
        return "";
    }

    return end.toISOString().split('T')[0];
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

      // Fetch spending for each budget
      const budgetsWithSpendingPromises = allBudgets.map(async (budget: BudgetItem) => {
        try {
          const spendingData = await getBudgetSpending(budget._id);
          const budgetAmount = getBudgetAmount(budget.amount);
          const spent = spendingData?.totalSpent || 0;
          const percentage = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;

          if (!spendingData) {
            console.warn(`No spending data for budget ${budget._id}`);
            const budgetAmount = getBudgetAmount(budget.amount);
            return {
              ...budget,
              spent: 0,
              percentage: 0,
              remaining: budgetAmount,
              isOverBudget: false,
              overBudgetAmount: 0
            };
          }

          console.log(`Budget ${budget._id}:`, {
            name: budget.name,
            amount: budgetAmount,
            spent: spent,
            percentage: percentage,
            spaceType: budget.spaceType,
            mainCategoryId: budget.mainCategoryId
          });

          return {
            ...budget,
            spent,
            percentage,
            remaining: Math.max(0, budgetAmount - spent),
            isOverBudget: spent > budgetAmount,
            overBudgetAmount: Math.max(0, spent - budgetAmount),
            spendingData: spendingData
          };
        } catch (error) {
          console.error(`Error fetching spending for budget ${budget._id}:`, error);
          const budgetAmount = getBudgetAmount(budget.amount);
          return {
            ...budget,
            spent: 0,
            percentage: 0,
            remaining: budgetAmount,
            isOverBudget: false,
            overBudgetAmount: 0,
            spendingData: null
          };
        }
      });

      const budgetsWithSpendingResults = await Promise.all(budgetsWithSpendingPromises);
      setBudgets(allBudgets);
      setBudgetsWithSpending(budgetsWithSpendingResults);

      // Log summary
      const totalBudgetAmount = budgetsWithSpendingResults.reduce((sum, b) => sum + getBudgetAmount(b.amount), 0);
      const totalSpent = budgetsWithSpendingResults.reduce((sum, b) => sum + (b.spent || 0), 0);
      console.log('All Spaces Budget Summary:', {
        totalBudgets: budgetsWithSpendingResults.length,
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

  // Get space name by ID
  const getSpaceName = (spaceId: string): string => {
    const space = spaces.find(space => space.id === spaceId);
    return space ? capitalize(space.name) : "Unknown Space";
  };

  // Get space type name
  const getSpaceTypeName = (spaceType: string): string => {
    return capitalize(spaceType.toLowerCase().replace('_', ' '));
  };

  const fetchCategories = (spaceId?: string) => {
    setLoading(true);

    // Determine which space type to use for fetching categories
    let spaceTypeForCategories: string;

    if (spaceId) {
      // If spaceId is provided (for All spaces mode), get space type from that space
      const space = spaces.find(s => s.id === spaceId);
      spaceTypeForCategories = space ? toStrdSpaceType(space.type) : toStrdSpaceType(spacetype);
    } else {
      // For normal mode, use the current space type
      spaceTypeForCategories = toStrdSpaceType(spacetype);
    }

    getCategoriesBySpace(spaceTypeForCategories)
      .then((res) => {
        console.log("Fetched categories for space type:", spaceTypeForCategories, res);
        setCategories(res || []);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setCategories([]);
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
      const budgetsWithSpendingPromises = budgetsList.map(async (budget: BudgetItem) => {
        try {
          const spendingData = await getBudgetSpending(budget._id);
          const budgetAmount = getBudgetAmount(budget.amount);
          const spent = spendingData?.totalSpent || 0;
          const percentage = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;

          if (!spendingData) {
            console.warn(`No spending data for budget ${budget._id}`);
            const budgetAmount = getBudgetAmount(budget.amount);
            return {
              ...budget,
              spent: 0,
              percentage: 0,
              remaining: budgetAmount,
              isOverBudget: false,
              overBudgetAmount: 0
            };
          }

          console.log(`Budget ${budget._id}:`, {
            name: budget.name,
            amount: budgetAmount,
            spent: spent,
            percentage: percentage,
            spaceType: budget.spaceType,
            mainCategoryId: budget.mainCategoryId
          });

          return {
            ...budget,
            spent,
            percentage,
            remaining: Math.max(0, budgetAmount - spent),
            isOverBudget: spent > budgetAmount,
            overBudgetAmount: Math.max(0, spent - budgetAmount),
            spendingData: spendingData
          };
        } catch (error) {
          console.error(`Error fetching spending for budget ${budget._id}:`, error);
          const budgetAmount = getBudgetAmount(budget.amount);
          return {
            ...budget,
            spent: 0,
            percentage: 0,
            remaining: budgetAmount,
            isOverBudget: false,
            overBudgetAmount: 0,
            spendingData: null
          };
        }
      });

      const budgetsWithSpendingResults = await Promise.all(budgetsWithSpendingPromises);
      setBudgets(budgetsList);
      setBudgetsWithSpending(budgetsWithSpendingResults);

      // Log summary
      const totalBudgetAmount = budgetsWithSpendingResults.reduce((sum, b) => sum + getBudgetAmount(b.amount), 0);
      const totalSpent = budgetsWithSpendingResults.reduce((sum, b) => sum + (b.spent || 0), 0);
      console.log('Budget Summary:', {
        totalBudgets: budgetsWithSpendingResults.length,
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
      const spendingData = await getBudgetSpending(budgetId);
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
      const newEndDate = inputs.startDate ? calculateEndDate(inputs.startDate, newType) : "";

      setInputs(prev => ({
        ...prev,
        type: newType,
        endDate: newEndDate
      }));
    } else if (name === "startDate") {
      // When start date changes, recalculate end date based on current budget type
      const newEndDate = value ? calculateEndDate(value, inputs.type) : "";

      setInputs(prev => ({
        ...prev,
        startDate: value,
        endDate: newEndDate
      }));
    } else if (name === "spaceId") {
      setInputs(prev => ({
        ...prev,
        spaceId: value
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
    let spaceTypeForFiltering: string;

    if (spaceid === "all" && selectedSpaceForAllSpaces) {
      // In All spaces mode with a selected space, use that space's type
      const space = spaces.find(s => s.id === selectedSpaceForAllSpaces);
      spaceTypeForFiltering = space ? toStrdSpaceType(space.type) : "";
    } else {
      // Normal mode, use current space type
      spaceTypeForFiltering = toStrdSpaceType(spacetype);
    }

    if (!spaceTypeForFiltering) {
      return [];
    }
    const allowedTransactionType = getAllowedTransactionType(spaceTypeForFiltering);

    const transformedCategories = transformCategories(categories);

    return transformedCategories.filter(category => {
      const hasValidSpace = category.spaces && category.spaces.includes(spaceTypeForFiltering);
      const hasValidSubCategories = category.subCategories && category.subCategories.some((subCat: any) =>
        subCat.transactionTypes && subCat.transactionTypes.includes(allowedTransactionType)
      );

      return hasValidSpace && hasValidSubCategories;
    });
  };

  const getFilteredSubCategories = () => {
    if (!inputs.mainCategoryId) return [];

    const transformedCategories = transformCategories(categories);
    const mainCategory = transformedCategories.find(cat => cat._id === inputs.mainCategoryId);
    if (!mainCategory || !mainCategory.subCategories) return [];

    let spaceTypeForFiltering: string;

    if (spaceid === "all" && selectedSpaceForAllSpaces) {
      // In All spaces mode with a selected space, use that space's type
      const space = spaces.find(s => s.id === selectedSpaceForAllSpaces);
      spaceTypeForFiltering = space ? toStrdSpaceType(space.type) : "";
    } else {
      // Normal mode, use current space type
      spaceTypeForFiltering = toStrdSpaceType(spacetype);
    }

    if (!spaceTypeForFiltering) return [];
    const allowedTransactionType = getAllowedTransactionType(spaceTypeForFiltering);

    return mainCategory.subCategories.filter((subCat: any) =>
      subCat.transactionTypes && subCat.transactionTypes.includes(allowedTransactionType)
    );
  };

  const onNewOrEditMode = () => {
    if (spaceid === "all") {
      setSpaceSelectionPhase(true);
      setNewOrEditMode(true);
      setEditId(null);

      // Reset inputs but don't fetch categories yet
      const today = getTodayDate();
      setInputs({
        name: "",
        amount: 0,
        type: BudgetType.MONTHLY,
        mainCategoryId: "",
        subCategoryIds: [],
        spaceId: "",
        startDate: today,
        endDate: calculateEndDate(today, BudgetType.MONTHLY),
      });
      setSelectedSubCategories(new Set());
      setSelectedSpaceForAllSpaces(""); // Reset selected space
      setCategories([]); // Clear categories until space is selected
    } else {
      // Normal mode - proceed as before
      setSpaceSelectionPhase(false);
      setNewOrEditMode(true);
      setEditId(null);
      const today = getTodayDate();

      setInputs({
        name: "",
        amount: 0,
        type: BudgetType.MONTHLY,
        mainCategoryId: "",
        subCategoryIds: [],
        spaceId: spaceid === "all" ? "" : spaceid || "",
        startDate: today,
        endDate: calculateEndDate(today, BudgetType.MONTHLY),
      });
      setSelectedSubCategories(new Set());
    }
  };

  const handleSpaceSelection = (spaceId: string) => {
    if (!spaceId) {
      toast.error("Please select a space first!");
      return;
    }

    const space = spaces.find(s => s.id === spaceId);
    if (!space) {
      toast.error("Selected space not found!");
      return;
    }

    // Set the selected space and update inputs
    setSelectedSpaceForAllSpaces(spaceId);
    setInputs(prev => ({
      ...prev,
      spaceId: spaceId
    }));

    // Fetch categories for the selected space type
    fetchCategories(spaceId);

    // Move to the main budget form
    setSpaceSelectionPhase(false);
  };

  const onEditMode = (budget: BudgetItem) => {
    // Handle edit mode differently for "All spaces" mode
    if (spaceid === "all") {
      // For All spaces mode in edit, we already have the space info
      setSpaceSelectionPhase(false);
      setNewOrEditMode(true);
      setEditId(budget._id);

      const budgetAmount = getBudgetAmount(budget.amount);

      setInputs({
        name: budget.name,
        amount: budgetAmount,
        type: budget.type,
        mainCategoryId: budget.mainCategoryId,
        subCategoryIds: budget.subCategoryIds || [],
        spaceId: budget.spaceId,
        startDate: budget.startDate?.split('T')[0] || getTodayDate(),
        endDate: budget.endDate?.split('T')[0] || calculateEndDate(budget.startDate?.split('T')[0] || getTodayDate(), budget.type),
      });

      // Set selected subcategories
      let initialSelectedSubCategories = new Set<string>();
      if (budget.subCategoryIds && budget.subCategoryIds.length > 0) {
        initialSelectedSubCategories = new Set(budget.subCategoryIds);
      }

      setSelectedSubCategories(initialSelectedSubCategories);

      // Set the selected space for filtering
      setSelectedSpaceForAllSpaces(budget.spaceId);

      // Fetch categories for the edited budget's space
      fetchCategories(budget.spaceId);
    } else {
      // Normal edit mode
      setSpaceSelectionPhase(false);
      setNewOrEditMode(true);
      setEditId(budget._id);

      const budgetAmount = getBudgetAmount(budget.amount);

      setInputs({
        name: budget.name,
        amount: budgetAmount,
        type: budget.type,
        mainCategoryId: budget.mainCategoryId,
        subCategoryIds: budget.subCategoryIds || [],
        spaceId: budget.spaceId,
        startDate: budget.startDate?.split('T')[0] || getTodayDate(),
        endDate: budget.endDate?.split('T')[0] || calculateEndDate(budget.startDate?.split('T')[0] || getTodayDate(), budget.type),
      });

      // Set selected subcategories
      let initialSelectedSubCategories = new Set<string>();
      if (budget.subCategoryIds && budget.subCategoryIds.length > 0) {
        initialSelectedSubCategories = new Set(budget.subCategoryIds);
      }

      setSelectedSubCategories(initialSelectedSubCategories);
    }
  };

  const onCancel = () => {
    setSpaceSelectionPhase(false);
    setNewOrEditMode(false);
    setEditId(null);
    setSelectedSpaceForAllSpaces("");
    setInputs({
      name: "",
      amount: 0,
      type: BudgetType.MONTHLY,
      mainCategoryId: "",
      subCategoryIds: [],
      spaceId: spaceid === "all" ? "" : spaceid || "",
      startDate: "",
      endDate: "",
    });
    setSelectedSubCategories(new Set());

    if (spacetype && spacetype !== "all" && spaceid !== "all") {
      fetchCategories();
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

    if (!inputs.startDate) {
      toast.error("Please select start date!");
      return;
    }

    const start = new Date(inputs.startDate);
    const today = new Date(getTodayDate());
    if (start < today) {
      toast.error("Start date cannot be in the past!");
      return;
    }

    if (!inputs.spaceId) {
      toast.error("Please select a space!");
      return;
    }

    // Validate space type for budget
    const selectedSpace = spaces.find(space => space.id === inputs.spaceId);
    if (!selectedSpace || !['CASH', 'BANK', 'CREDIT_CARD'].includes(selectedSpace.type)) {
      toast.error("Budgets can only be created for Cash, Bank, or Credit Card spaces!");
      return;
    }

    setLoading(true);

    try {
      // Get all subcategory IDs for the selected main category if none are selected
      let subCategoryIdsToSend = [...inputs.subCategoryIds];

      if (inputs.mainCategoryId && subCategoryIdsToSend.length === 0) {
        const allSubCategories = getFilteredSubCategories();
        subCategoryIdsToSend = allSubCategories.map((subCat: any) => subCat._id);
        setSelectedSubCategories(new Set(subCategoryIdsToSend));
      }

      const budgetData = {
        ...inputs,
        subCategoryIds: subCategoryIdsToSend,
        spaceType: selectedSpace.type,
      };

      console.log("Submitting budget:", budgetData);

      if (editId) {
        await updateBudget(editId, budgetData);
      } else {
        await createBudget(budgetData);
      }

      fetchBudgetsWithSpending();
      onCancel();
    } catch (error) {
      toast.error("Failed to save budget!");
      console.error("Error saving budget:", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle section collapse
  const toggleSection = (type: BudgetType) => {
    setCollapsedSections(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Open budget detail modal
  const openBudgetDetail = (budget: BudgetItem) => {
    // Find the budget with spending data from budgetsWithSpending
    const budgetWithSpending = budgetsWithSpending.find(b => b._id === budget._id);

    if (budgetWithSpending) {
      setDetailModal({
        isOpen: true,
        budget: budget,
        spendingData: budgetWithSpending.spendingData || null
      });
    } else {
      // Fallback: fetch the data if not found
      fetchBudgetDetail(budget._id);
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
    } else if (spacetype && spacetype !== "all") {
      // For normal mode, fetch both categories and budgets
      fetchCategories();
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
        <div className="text-center py-12">
          <p className="text-text-light-secondary dark:text-text-dark-secondary">Loading budgets...</p>
        </div>
      )}

      {/* Added Space Selection Modal for "All spaces" mode */}
      {newOrEditMode && spaceSelectionPhase && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-black/50 overflow-auto p-4 pt-10">
          <div className="relative w-full max-w-md rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-xl p-6">
            <div className="flex shrink-0 items-center pb-6 text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              Select Space for Budget
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-text-light-primary dark:text-text-dark-primary font-medium mb-3">
                  Select Space <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedSpaceForAllSpaces}
                    onChange={(e) => setSelectedSpaceForAllSpaces(e.target.value)}
                    className="w-full p-3.5 border border-border-light-primary dark:border-border-dark-primary rounded-lg bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select a space</option>
                    {allowedSpaces.map((space) => (
                      <option key={space.id} value={space.id}>
                        {capitalize(space.name)} - {capitalize(space.type.replace('_', ' '))}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-3 px-1">
                  Budgets can only be created for Cash, Bank, or Credit Card spaces
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
                  onClick={() => handleSpaceSelection(selectedSpaceForAllSpaces)}
                  disabled={!selectedSpaceForAllSpaces}
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
          selectedSpaceForAllSpaces={selectedSpaceForAllSpaces}
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

// Budget Detail Modal Component
interface BudgetDetailModalProps {
  budget: BudgetItem;
  spendingData: any;
  categories: BackendCategory[];
  currency: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const BudgetDetailModal: React.FC<BudgetDetailModalProps> = ({
  budget,
  spendingData,
  categories,
  currency,
  onClose,
  onEdit,
  onDelete
}) => {
  const [viewType, setViewType] = useState<'weekly' | 'daily'>('weekly');

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
  const budgetAmount = getBudgetAmount(budget.amount);

  // Calculate values from spendingData
  const spent = spendingData?.totalSpent || budget.spent || 0;
  const percentage = spendingData?.percentage || (budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0);
  const remaining = spendingData?.remainingAmount || Math.max(0, budgetAmount - spent);
  const dailySpending = spendingData?.dailySpending || [];
  const categoryBreakdown = spendingData?.categoryBreakdown || [];

  // Get category color for the progress bar
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-orange-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPeriodLabel = () => {
    const start = new Date(budget.startDate);
    const end = new Date(budget.endDate);

    switch (budget.type) {
      case BudgetType.ONE_TIME:
        return "Day";
      case BudgetType.WEEKLY:
        return "Week";
      case BudgetType.MONTHLY:
        return "Month";
      default:
        return "Period";
    }
  };

  // Function to handle both weekly and daily views for monthly budgets
  const getSpendingDataForDisplay = () => {
    if (!dailySpending.length) return { displayData: [], periodLabel: getPeriodLabel() };

    const now = new Date();
    const budgetStart = new Date(budget.startDate);
    const budgetEnd = new Date(budget.endDate);

    let displayData: any[] = [];
    let periodLabel = getPeriodLabel();

    switch (budget.type) {
      case BudgetType.ONE_TIME:
        // For one-time budgets, show spending by hour or just the day
        if (budgetStart.toDateString() === budgetEnd.toDateString()) {
          // Single day budget - show the day
          periodLabel = "Day";
          displayData = dailySpending;
        } else {
          // Multi-day one-time budget - show daily
          periodLabel = "Day";
          displayData = dailySpending;
        }
        break;

      case BudgetType.WEEKLY:
        // For weekly budgets, show daily spending
        periodLabel = "Day";

        // If we have more than 7 days of data, show only the last 7 days
        if (dailySpending.length > 7) {
          displayData = dailySpending.slice(-7);
        } else {
          displayData = dailySpending;
        }
        break;

      case BudgetType.MONTHLY:
        // For monthly budgets, show either weekly aggregates or daily data based on viewType
        if (viewType === 'weekly') {
          periodLabel = "Week";

          // Group daily spending by week
          const weeklyData: { [weekKey: string]: { amount: number; startDate: string; endDate: string } } = {};

          dailySpending.forEach((day: { date: string; amount: number }) => {
            const date = new Date(day.date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay() + 1);
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!weeklyData[weekKey]) {
              weeklyData[weekKey] = {
                amount: 0,
                startDate: weekKey,
                endDate: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              };
            }

            weeklyData[weekKey].amount += day.amount;
          });

          displayData = Object.values(weeklyData).sort((a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );

          // If we have more than 4 weeks, show only the last 4 weeks
          if (displayData.length > 4) {
            displayData = displayData.slice(-4);
          }
        } else {
          // Daily view for monthly budgets
          periodLabel = "Day";

          // Show all days or limit to last 30 days for better visualization
          if (dailySpending.length > 30) {
            displayData = dailySpending.slice(-30);
          } else {
            displayData = dailySpending;
          }
        }
        break;
    }

    return { displayData, periodLabel };
  };

  // Get formatted spending data
  const { displayData, periodLabel } = getSpendingDataForDisplay();

  // Function to handle both weekly and daily date formats
  const formatDateLabel = (data: any, budgetType: BudgetType, viewType?: 'weekly' | 'daily') => {
    let dateLabel = "";
    let subLabel = "";

    if (budget.type === BudgetType.MONTHLY && viewType === 'weekly') {
      // For weekly aggregates in monthly budgets
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      dateLabel = `${startDate.getDate()}-${endDate.getDate()}`;
      subLabel = startDate.toLocaleDateString('en-US', { month: 'short' });
    } else {
      // For daily data
      const date = new Date(data.date || data.startDate);
      dateLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
      subLabel = date.getDate().toString();
    }

    return { dateLabel, subLabel };
  };

  // Function to handle different chart titles based on view type
  const getChartTitle = () => {
    switch (budget.type) {
      case BudgetType.ONE_TIME:
        return "Daily Spending";
      case BudgetType.WEEKLY:
        return "Daily Spending Trend";
      case BudgetType.MONTHLY:
        return viewType === 'weekly' ? "Weekly Spending Trend" : "Daily Spending Trend";
      default:
        return "Spending Trend";
    }
  };

  // Function to get appropriate view label
  const getViewLabel = () => {
    switch (budget.type) {
      case BudgetType.MONTHLY:
        return viewType === 'weekly' ? "Weekly view" : "Daily view";
      case BudgetType.WEEKLY:
        return "Last 7 days";
      case BudgetType.ONE_TIME:
        return "Daily view";
      default:
        return "Spending Trend";
    }
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
                {budget.startDate?.split('T')[0]} - {budget.endDate?.split('T')[0]}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Days Remaining: {(() => {
                const end = new Date(budget.endDate);
                const today = new Date();
                const diffTime = end.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays > 0 ? diffDays : 0;
              })()}
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{
                  width: `${(() => {
                    const start = new Date(budget.startDate);
                    const end = new Date(budget.endDate);
                    const today = new Date();
                    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                    const daysPassed = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                    return Math.min((daysPassed / totalDays) * 100, 100);
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {getViewLabel()}
              </span>
              {/* Added view toggle buttons for monthly budgets */}
              {budget.type === BudgetType.MONTHLY && (
                <div className="flex border border-border-light-primary dark:border-border-dark-primary rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewType('weekly')}
                    className={`px-3 py-1 text-xs flex items-center gap-1 cursor-pointer ${viewType === 'weekly'
                      ? 'bg-primary text-white'
                      : 'bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-secondary dark:text-text-dark-secondary'
                      }`}
                  >
                    <Grid size={12} />
                    Weekly
                  </button>
                  <button
                    onClick={() => setViewType('daily')}
                    className={`px-3 py-1 text-xs flex items-center gap-1 cursor-pointer ${viewType === 'daily'
                      ? 'bg-primary text-white'
                      : 'bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-secondary dark:text-text-dark-secondary'
                      }`}
                  >
                    <BarChart size={12} />
                    Daily
                  </button>
                </div>
              )}
            </div>
          </div>

          {displayData.length > 0 ? (
            <div className="bg-bg-light-primary dark:bg-bg-dark-primary rounded-xl p-6 shadow-sm">

              <div className={`flex items-end ${budget.type === BudgetType.MONTHLY && viewType === 'weekly' ? 'h-40' : 'h-48'} gap-2 mb-6`}>
                {displayData.map((data: any, index: number) => {
                  const maxSpending = Math.max(...displayData.map((d: any) => d.amount || 0));
                  const height = maxSpending > 0
                    ? ((data.amount || 0) / maxSpending) * (budget.type === BudgetType.MONTHLY && viewType === 'weekly' ? 60 : 80)
                    : 0;


                  const { dateLabel, subLabel } = formatDateLabel(data, budget.type, viewType);

                  return (
                    <div key={index} className="flex flex-col items-center flex-1 h-full">
                      <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2 text-center">
                        {dateLabel}
                      </div>
                      <div className="flex flex-col items-center justify-end h-full w-full">
                        <div
                          className={`rounded-t transition-all duration-300 ${data.amount > 0
                            ? getProgressBarColor((data.amount / (budgetAmount || 1)) * 100)
                            : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          style={{
                            width: budget.type === BudgetType.MONTHLY && viewType === 'weekly' ? '3rem' : '2.5rem',
                            height: `${height}%`
                          }}
                          title={`${currency} ${(data.amount || 0).toFixed(2)}`}
                        />
                        <div className="text-xs mt-2 text-text-light-primary dark:text-text-dark-primary font-medium">
                          {currency} {(data.amount || 0).toFixed(0)}
                        </div>
                      </div>
                      <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1 text-center">
                        {subLabel}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border-light-primary dark:border-border-dark-primary">
                <div className="text-center">
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    {budget.type === BudgetType.MONTHLY && viewType === 'weekly'
                      ? 'Average Weekly'
                      : budget.type === BudgetType.WEEKLY
                        ? 'Average Daily'
                        : 'Average ' + periodLabel}
                  </p>
                  <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                    {currency} {(displayData.reduce((sum: number, data: any) => sum + (data.amount || 0), 0) / displayData.length).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    {budget.type === BudgetType.MONTHLY && viewType === 'weekly'
                      ? 'Highest Week'
                      : budget.type === BudgetType.WEEKLY
                        ? 'Highest Day'
                        : 'Highest ' + periodLabel}
                  </p>
                  <p className="text-lg font-bold text-red-500">
                    {currency} {Math.max(...displayData.map((d: any) => d.amount || 0)).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Total {budget.type === BudgetType.MONTHLY && viewType === 'weekly'
                      ? 'Weekly'
                      : budget.type === BudgetType.WEEKLY
                        ? 'Daily'
                        : periodLabel}
                  </p>
                  <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                    {currency} {displayData.reduce((sum: number, data: any) => sum + (data.amount || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-bg-light-primary dark:bg-bg-dark-primary rounded-xl p-12 text-center border-2 border-dashed border-border-light-primary dark:border-border-dark-primary">
              <TrendingUp size={48} className="mx-auto text-text-light-secondary dark:text-text-dark-secondary mb-4" />
              <h4 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                No Spending Data Yet
              </h4>
              <p className="text-text-light-secondary dark:text-text-dark-secondary max-w-md mx-auto">
                Transactions in the selected categories will appear here once they occur within the budget period.
              </p>
            </div>
          )}
        </div>

        {/* Category Breakdown*/}
        {categoryBreakdown && categoryBreakdown.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
              Spending by Category
            </h3>
            <div className="bg-bg-light-primary dark:bg-bg-dark-primary rounded-xl p-6 shadow-sm">
              <div className="space-y-4">
                {categoryBreakdown.map((category: any, index: number) => {
                  const categoryPercentage = spent > 0 ? (category.totalAmount / spent) * 100 : 0;
                  const subCategory = mainCategory?.subCategories?.find((sc: any) => sc._id === category.subCategoryId);

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {subCategory ? (
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: subCategory.color || '#6B7280' }}
                            />
                          ) : null}
                          <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                            {subCategory.name || 'Unknown Category'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                            {currency} {category.totalAmount.toFixed(2)}
                          </span>
                          <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary ml-2">
                            ({categoryPercentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${categoryPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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

export default Budget;
export type { BudgetInfo };

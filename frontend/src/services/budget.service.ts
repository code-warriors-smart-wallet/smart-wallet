import axios from "axios";
import { api } from "../config/api.config";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store/store";
import { BudgetType } from "../components/user.portal/views/Budget";

export interface BudgetInfo {
  name: string;
  amount: number;
  type: BudgetType;
  mainCategoryId: string;
  subCategoryIds: string[];
  spaceId: string;
  spaceType: string;
  startDate?: string;
  endDate?: string;
}


export function BudgetService() {
  const token = useSelector((state: RootState) => state.auth.token);

  async function getBudgets(): Promise<any[]> {
    try {
      const response = await api.get(`finops/budget/`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        return response.data.data.object;
      }
      return [];
    } catch (error) {
      processError(error);
      return [];
    }
  }

  async function getBudgetsBySpace(spaceId: string): Promise<any[]> {
    try {
      const response = await api.get(`finops/budget/space/${spaceId}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        return response.data.data.object;
      }
      return [];
    } catch (error) {
      processError(error);
      return [];
    }
  }

  async function getBudgetsBySpaceType(spaceType: string): Promise<any[]> {
    try {
      const response = await api.get(`finops/budget/space-type/${spaceType}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        return response.data.data.object;
      }
      return [];
    } catch (error) {
      processError(error);
      return [];
    }
  }

  async function getBudgetSpending(budgetId: string): Promise<any> {
    try {
      const response = await api.get(`finops/budget/${budgetId}/spending`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        return response.data.data.object;
      }
      return null;
    } catch (error) {
      processError(error);
      return null;
    }
  }

  async function createBudget(body: BudgetInfo): Promise<void> {
    try {
      const response = await api.post(`finops/budget/`, body, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        console.log(response.data);
        toast.success(
          response.data.data.message || "Budget created successfully!"
        );
      }
    } catch (error) {
      processError(error);
    }
  }

  async function updateBudget(
    budgetId: string,
    body: Partial<BudgetInfo>
  ): Promise<void> {
    try {
      const response = await api.put(`finops/budget/${budgetId}`, body, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        console.log(response.data);
        toast.success(
          response.data.data.message || "Budget updated successfully!"
        );
      }
    } catch (error) {
      processError(error);
    }
  }

  async function deleteBudget(budgetId: string): Promise<void> {
    try {
      const response = await api.delete(`finops/budget/${budgetId}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        console.log(response.data);
        toast.success(
          response.data.data.message || "Budget deleted successfully!"
        );
      }
    } catch (error) {
      processError(error);
    }
  }

  return {
    getBudgets,
    getBudgetsBySpace,
    getBudgetsBySpaceType,
    getBudgetSpending,
    createBudget,
    updateBudget,
    deleteBudget
  };
}

function processError(error: unknown): void {
  if (axios.isAxiosError(error) && error.response) {
    const errorMessage =
      error.response.data?.error?.message ||
      "An error occurred while processing your request.";
    toast.error(errorMessage);
  } else {
    toast.error("An unexpected error occurred. Please try again later.");
  }
  console.error("Error details:", error);
}

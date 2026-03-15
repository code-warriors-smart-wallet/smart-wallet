// import axios from "axios";
// import { api } from "../config/api.config";
// import { toast } from "react-toastify";
// import { useSelector } from "react-redux";
// import { RootState } from "../redux/store/store";
// import { BudgetType } from "../components/user.portal/views/Budget";

// export interface BudgetInfo {
//   name: string;
//   amount: number;
//   type: BudgetType;
//   mainCategoryId: string;
//   subCategoryIds: string[];
//   spaceIds: string[];
//   spaceTypes: string[];
//   startDate?: string;
//   endDate?: string;
//   isMultiSpace?: boolean;
//   updateScope?: 'current' | 'future' | 'all';
// }

// export interface TransactionUpdateData {
//   transactionDate: string;
//   amount: number;
//   isEdit?: boolean;
//   oldAmount?: number;
//   spaceId?: string;
// }

// export function BudgetService() {
//   const token = useSelector((state: RootState) => state.auth.token);

//   async function getBudgets(): Promise<any[]> {
//     try {
//       const response = await api.get(`finops/budget/`, {
//         headers: {
//           authorization: `Bearer ${token}`,
//         },
//       });
//       if (response.data.success) {
//         return response.data.data.object;
//       }
//       return [];
//     } catch (error) {
//       processError(error);
//       return [];
//     }
//   }

//   async function getBudgetsBySpace(spaceId: string): Promise<any[]> {
//     try {
//       const response = await api.get(`finops/budget/space/${spaceId}`, {
//         headers: {
//           authorization: `Bearer ${token}`,
//         },
//       });
//       if (response.data.success) {
//         return response.data.data.object;
//       }
//       return [];
//     } catch (error) {
//       processError(error);
//       return [];
//     }
//   }

//   async function getBudgetsBySpaceType(spaceType: string): Promise<any[]> {
//     try {
//       const response = await api.get(`finops/budget/space-type/${spaceType}`, {
//         headers: {
//           authorization: `Bearer ${token}`,
//         },
//       });
//       if (response.data.success) {
//         return response.data.data.object;
//       }
//       return [];
//     } catch (error) {
//       processError(error);
//       return [];
//     }
//   }

//   async function getBudgetsWithEntriesBySpace(spaceId: string): Promise<any[]> {
//     try {
//       const budgets = await getBudgetsBySpace(spaceId);
      
//       // Fetch spending data for each budget to get entries
//       const budgetsWithEntries = await Promise.all(
//         budgets.map(async (budget) => {
//           try {
//             const spendingData = await getBudgetSpending(budget._id);
//             return {
//               ...budget,
//               entries: spendingData?.trendData || [],
//               currentEntry: spendingData?.currentEntry || null
//             };
//           } catch (error) {
//             console.error(`Error fetching entries for budget ${budget._id}:`, error);
//             return {
//               ...budget,
//               entries: [],
//               currentEntry: null
//             };
//           }
//         })
//       );
      
//       return budgetsWithEntries;
//     } catch (error) {
//       console.error("Error fetching budgets with entries:", error);
//       return [];
//     }
//   }

//   async function getBudgetsWithEntriesBySpaceType(spaceType: string): Promise<any[]> {
//     try {
//       const budgets = await getBudgetsBySpaceType(spaceType);
      
//       const budgetsWithEntries = await Promise.all(
//         budgets.map(async (budget) => {
//           try {
//             const spendingData = await getBudgetSpending(budget._id);
//             return {
//               ...budget,
//               entries: spendingData?.trendData || [],
//               currentEntry: spendingData?.currentEntry || null
//             };
//           } catch (error) {
//             console.error(`Error fetching entries for budget ${budget._id}:`, error);
//             return {
//               ...budget,
//               entries: [],
//               currentEntry: null
//             };
//           }
//         })
//       );
      
//       return budgetsWithEntries;
//     } catch (error) {
//       console.error("Error fetching budgets with entries by space type:", error);
//       return [];
//     }
//   }

//   async function findBudgetsByCategory(spaceId: string, mainCategoryId: string, subCategoryId?: string): Promise<any[]> {
//     try {
//       const budgets = await getBudgetsBySpace(spaceId);
//       return budgets.filter(budget => {
//         // Check if main category matches
//         if (budget.mainCategoryId !== mainCategoryId) {
//           return false;
//         }
        
//         // Check if subcategory matches if specified in budget
//         if (budget.subCategoryIds && budget.subCategoryIds.length > 0) {
//           if (!subCategoryId) {
//             return false;
//           }
//           return budget.subCategoryIds.includes(subCategoryId);
//         }
        
//         // If budget has no specific subcategories, it matches all subcategories
//         return true;
//       });
//     } catch (error) {
//       console.error("Error finding budgets by category:", error);
//       return [];
//     }
//   }

//   async function getBudgetSpending(budgetId: string, date?: string, spaceId?: string): Promise<any> {
//     try {
//       let url = `finops/budget/${budgetId}/spending`;
//       const params = new URLSearchParams();
      
//       if (date) params.append('date', date);
//       if (spaceId) params.append('spaceId', spaceId);
      
//       const queryString = params.toString();
//       if (queryString) {
//         url += `?${queryString}`;
//       }
      
//       const response = await api.get(url, {
//         headers: {
//           authorization: `Bearer ${token}`,
//         },
//       });
//       if (response.data.success) {
//         return response.data.data.object;
//       }
//       return null;
//     } catch (error) {
//       processError(error);
//       return null;
//     }
//   }

//   async function createBudget(body: BudgetInfo): Promise<void> {
//     try {
//       const response = await api.post(`finops/budget/`, body, {
//         headers: {
//           authorization: `Bearer ${token}`,
//         },
//       });
//       if (response.data.success) {
//         console.log(response.data);
//         toast.success(
//           response.data.data.message || "Budget created successfully!"
//         );
//       }
//     } catch (error) {
//       processError(error);
//     }
//   }

//   async function updateBudgetAmount(
//     budgetId: string,
//     amount: number,
//     updateScope: 'current' | 'future' | 'all'
//   ): Promise<void> {
//     try {
//       const response = await api.put(`finops/budget/${budgetId}`, {
//         amount,
//         updateScope
//       }, {
//         headers: {
//           authorization: `Bearer ${token}`,
//         },
//       });
//       if (response.data.success) {
//         console.log(response.data);
//         toast.success(
//           response.data.data.message
//         );
//       }
//     } catch (error) {
//       processError(error);
//     }
//   }

//   async function deleteBudget(budgetId: string): Promise<void> {
//     try {
//       const response = await api.delete(`finops/budget/${budgetId}`, {
//         headers: {
//           authorization: `Bearer ${token}`,
//         },
//       });
//       if (response.data.success) {
//         console.log(response.data);
//         toast.success(
//           response.data.data.message || "Budget deleted successfully!"
//         );
//       }
//     } catch (error) {
//       processError(error);
//     }
//   }

//   async function updateBudgetSpent(
//     budgetId: string,
//     transactionData: TransactionUpdateData
//   ): Promise<void> {
//     try {
//       const response = await api.post(`finops/budget/${budgetId}/update-spent`, transactionData, {
//         headers: {
//           authorization: `Bearer ${token}`,
//         },
//       });
//       if (response.data.success) {
//         console.log("Budget spent updated:", response.data);
//       }
//     } catch (error) {
//       console.error("Error updating budget spent:", error);
//     }
//   }

//   return {
//     getBudgets,
//     getBudgetsBySpace,
//     getBudgetsBySpaceType,
//     getBudgetsWithEntriesBySpace,
//     getBudgetsWithEntriesBySpaceType,
//     findBudgetsByCategory,
//     getBudgetSpending,
//     createBudget,
//     updateBudgetAmount,
//     deleteBudget,
//     updateBudgetSpent
//   };
// }

// function processError(error: unknown): void {
//   if (axios.isAxiosError(error) && error.response) {
//     const errorMessage =
//       error.response.data?.error?.message ||
//       "An error occurred while processing your request.";
//     toast.error(errorMessage);
//   } else {
//     toast.error("An unexpected error occurred. Please try again later.");
//   }
//   console.error("Error details:", error);
// }

/********************************************************************************************************************/

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
  spaceIds: string[];
  spaceTypes: string[];
  startDate?: string;
  endDate?: string;
  isMultiSpace?: boolean;
  updateScope?: 'current' | 'future' | 'all';
}

export interface TransactionUpdateData {
  transactionDate: string;
  amount: number;
  isEdit?: boolean;
  oldAmount?: number;
  spaceId?: string;
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

  // Function to get budgets by space with creator info
  async function getBudgetsBySpace(spaceId: string, userId?: string): Promise<any[]> {
    try {
      const response = await api.get(`finops/budget/space/${spaceId}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const budgets = response.data.data.object;
        // Flag to indicate if current user can edit each budget
        if (userId) {
          return budgets.map((budget: any) => ({
            ...budget,
            canEdit: budget.userId === userId
          }));
        }
        return budgets;
      }
      return [];
    } catch (error) {
      processError(error);
      return [];
    }
  }

  // Function to get budgets by space type with creator info
  async function getBudgetsBySpaceType(spaceType: string, userId?: string): Promise<any[]> {
    try {
      const response = await api.get(`finops/budget/space-type/${spaceType}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const budgets = response.data.data.object;
        // Flag to indicate if current user can edit each budget
        if (userId) {
          return budgets.map((budget: any) => ({
            ...budget,
            canEdit: budget.userId === userId
          }));
        }
        return budgets;
      }
      return [];
    } catch (error) {
      processError(error);
      return [];
    }
  }

  // Get budgets created by a specific user in a space
  async function getBudgetsByCreator(spaceId: string, creatorId: string): Promise<any[]> {
    try {
      const response = await api.get(`finops/budget/space/${spaceId}/creator/${creatorId}`, {
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

  async function getBudgetsWithEntriesBySpace(spaceId: string, userId?: string): Promise<any[]> {
    try {
      const budgets = await getBudgetsBySpace(spaceId, userId);
      
      // Fetch spending data for each budget to get entries
      const budgetsWithEntries = await Promise.all(
        budgets.map(async (budget) => {
          try {
            const spendingData = await getBudgetSpending(budget._id);
            return {
              ...budget,
              entries: spendingData?.trendData || [],
              currentEntry: spendingData?.currentEntry || null,
              canEdit: budget.canEdit
            };
          } catch (error) {
            console.error(`Error fetching entries for budget ${budget._id}:`, error);
            return {
              ...budget,
              entries: [],
              currentEntry: null,
              canEdit: budget.canEdit
            };
          }
        })
      );
      
      return budgetsWithEntries;
    } catch (error) {
      console.error("Error fetching budgets with entries:", error);
      return [];
    }
  }

  async function getBudgetsWithEntriesBySpaceType(spaceType: string, userId?: string): Promise<any[]> {
    try {
      const budgets = await getBudgetsBySpaceType(spaceType, userId);
      
      const budgetsWithEntries = await Promise.all(
        budgets.map(async (budget) => {
          try {
            const spendingData = await getBudgetSpending(budget._id);
            return {
              ...budget,
              entries: spendingData?.trendData || [],
              currentEntry: spendingData?.currentEntry || null,
              canEdit: budget.canEdit
            };
          } catch (error) {
            console.error(`Error fetching entries for budget ${budget._id}:`, error);
            return {
              ...budget,
              entries: [],
              currentEntry: null,
              canEdit: budget.canEdit
            };
          }
        })
      );
      
      return budgetsWithEntries;
    } catch (error) {
      console.error("Error fetching budgets with entries by space type:", error);
      return [];
    }
  }

  async function findBudgetsByCategory(spaceId: string, mainCategoryId: string, subCategoryId?: string): Promise<any[]> {
    try {
      const budgets = await getBudgetsBySpace(spaceId);
      return budgets.filter(budget => {
        // Check if main category matches
        if (budget.mainCategoryId !== mainCategoryId) {
          return false;
        }
        
        // Check if subcategory matches if specified in budget
        if (budget.subCategoryIds && budget.subCategoryIds.length > 0) {
          if (!subCategoryId) {
            return false;
          }
          return budget.subCategoryIds.includes(subCategoryId);
        }
        
        // If budget has no specific subcategories, it matches all subcategories
        return true;
      });
    } catch (error) {
      console.error("Error finding budgets by category:", error);
      return [];
    }
  }

  async function getBudgetSpending(budgetId: string, date?: string, spaceId?: string): Promise<any> {
    try {
      let url = `finops/budget/${budgetId}/spending`;
      const params = new URLSearchParams();
      
      if (date) params.append('date', date);
      if (spaceId) params.append('spaceId', spaceId);
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await api.get(url, {
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

  async function updateBudgetAmount(
    budgetId: string,
    amount: number,
    updateScope: 'current' | 'future' | 'all'
  ): Promise<void> {
    try {
      const response = await api.put(`finops/budget/${budgetId}`, {
        amount,
        updateScope
      }, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        console.log(response.data);
        toast.success(
          response.data.data.message
        );
      }
    } catch (error) {
      processError(error);
    }
  }

  async function updateBudgetDates(budgetId: string,startDate: string,endDate: string): Promise<void> {
  try {
    console.log("Calling updateBudgetDates API with:", { budgetId, startDate, endDate });

    const response = await api.put(`finops/budget/${budgetId}/dates`, {
      startDate,
      endDate
    }, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    if (response.data.success) {
      console.log(response.data);
      toast.success(
        response.data.data.message || "Budget dates updated successfully!"
      );
    }
    else {
      throw new Error(response.data.error?.message || "Failed to update dates");
    }
  } catch (error) {
    console.error("Error in updateBudgetDates:", error);
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

  async function updateBudgetSpent(
    budgetId: string,
    transactionData: TransactionUpdateData
  ): Promise<void> {
    try {
      const response = await api.post(`finops/budget/${budgetId}/update-spent`, transactionData, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        console.log("Budget spent updated:", response.data);
      }
    } catch (error) {
      console.error("Error updating budget spent:", error);
    }
  }

  return {
    getBudgets,
    getBudgetsBySpace,
    getBudgetsBySpaceType,
    getBudgetsByCreator,
    getBudgetsWithEntriesBySpace,
    getBudgetsWithEntriesBySpaceType,
    findBudgetsByCategory,
    getBudgetSpending,
    createBudget,
    updateBudgetAmount,
    updateBudgetDates,
    deleteBudget,
    updateBudgetSpent
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





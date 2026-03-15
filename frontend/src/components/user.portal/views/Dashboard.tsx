// import { useSelector } from "react-redux";
// import { RootState } from "../../../redux/store/store";
// import CurrentBalance from "./Dashboard/CurrentBalance"
// import { useNavigate, useParams } from "react-router-dom";
// import SpendingSummary from "./Dashboard/SpendingSummary";
// import CreditCardSummary from "./Dashboard/CreditCardSummary";
// import { DashboardService } from "../../../services/dashboard.service";
// import { useEffect, useState } from "react";
// import Spaces, { SpaceType } from "./Spaces";
// import RecentTransactions from "./Dashboard/RecentTransactions";
// import LoanLentSummary from "./Dashboard/LoanLentSummary";
// import LoanBorrowedSummary from "./Dashboard/LoanBorrowedSummary";
// import { toStrdSpaceType } from "../../../utils/utils";
// import { SpendingSummaryFilterOptions } from "./Dashboard/SpendingSummary"
// import CashFlowTrend from "./Dashboard/CashFlowTrend";
// import DropDown from "../../../components/Dropdown";
// import { SpaceService } from "../../../services/space.service";
// import AllSpaceSummary from "./Dashboard/AllSpaceSummary";
// import SavingGoalSummary from "./Dashboard/SavingGoalSummary";
// import Button from "../../../components/Button";
// import { FaInfoCircle } from "react-icons/fa";

// enum SpaceAction {
//    EDIT_DETAILS = "EDIT_DETAILS",
//    VIEW_DETAILS = "VIEW_DETAILS",
//    DELETE_SPACE = "DELETE_SPACE",
//    LEFT_SPACE = "LEFT_SPACE"
// }

// function DashBoard() {
//    const { username, currency, spaces } = useSelector((state: RootState) => state.auth)
//    const { spaceid, spacetype, view } = useParams();
//    const { getCashBankSummary, getOtherSpaceSummary, getAllSpaceSummary } = DashboardService();
//    const [totalIncome, settotalIncome] = useState(0.0)
//    const [totalExpense, settotalExpense] = useState(0.0)
//    const [summary, setsummary] = useState(null)
//    const [loading, setLoading] = useState(false);
//    const standardSpaceType = toStrdSpaceType(spacetype || "") as SpaceType;
//    const currentSpace = spaces.find(sp => sp.id === spaceid);

//    const today = new Date();
//    const year = today.getFullYear();
//    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
//    const day = String(today.getDate()).padStart(2, '0');

//    const [startDate, setstartDate] = useState(`${year}-${month}-01`)
//    const [endDate, setendDate] = useState(`${year}-${month}-${day}`)
//    const [filterType, setFilterType] = useState(SpendingSummaryFilterOptions.THIS_MONTH)

//    const [selectedAction, setSelectedAction] = useState<string | null>(null)
//    const [editSpaceId, setEditSpaceId] = useState<string | null>(null)
//    const navigate = useNavigate();
//    const { deleteSpace, leftSpace } = SpaceService();
//    const spaceActions = spaces.find(sp => sp.id == spaceid)?.isOwner ?
//       [SpaceAction.EDIT_DETAILS, SpaceAction.DELETE_SPACE] :
//       [SpaceAction.VIEW_DETAILS, SpaceAction.LEFT_SPACE]

//    const getCashBankData = async (start: string, end: string) => {
//       console.log(startDate, endDate)
//       setLoading(true)
//       await getCashBankSummary(standardSpaceType, spaceid || "", start, end)
//          .then(res => {
//             if (res.totalIncome.length > 0) {
//                settotalIncome(res.totalIncome[0].totalAmount.$numberDecimal)
//             }
//             if (res.totalExpense.length > 0) {
//                settotalExpense(res.totalExpense[0].totalAmount.$numberDecimal)
//             }
//             const summary = {
//                ...res.spendingSummary, spaceInfo: res.spaceInfo
//             }
//             console.log("summary: ", summary)
//             setsummary(summary)
//          })
//          .catch(err => {
//             settotalIncome(0)
//             settotalExpense(0)
//             setsummary(null)
//          })
//          .finally(() => {
//             setLoading(false)
//          })
//    }

//    const getOtherSpaceData = async () => {
//       setLoading(true)
//       await getOtherSpaceSummary(spacetype || "", spaceid || "")
//          .then(res => {
//             setsummary(res)
//          })
//          .catch(err => {
//             setsummary(null)
//          })
//          .finally(() => {
//             setLoading(false)
//          })
//    }

//    const getAllSpaceData = async () => {
//       setLoading(true)
//       await getAllSpaceSummary()
//          .then(res => {
//             setsummary(res)
//          })
//          .catch(err => {
//             setsummary(null)
//          })
//          .finally(() => {
//             setLoading(false)
//          })
//    }

//    useEffect(() => {
//       if (spacetype === "all") {
//          getAllSpaceData()
//       }
//       else if (standardSpaceType === SpaceType.CASH || standardSpaceType === SpaceType.BANK) {
//          getCashBankData(startDate, endDate)
//       } else {
//          getOtherSpaceData()
//       }
//    }, [spaceid])

//    useEffect(() => {
//       if (filterType === SpendingSummaryFilterOptions.CUSTOM) return;

//       let start = startDate;
//       let end = endDate;

//       if (filterType === SpendingSummaryFilterOptions.TODAY) {
//          start = today.toISOString().split("T")[0]
//          end = today.toISOString().split("T")[0]
//       }
//       else if (filterType === SpendingSummaryFilterOptions.YESTERDAY) {
//          let yesterday = new Date()
//          yesterday.setDate(today.getDate() - 1)
//          start = yesterday.toISOString().split("T")[0]
//          end = yesterday.toISOString().split("T")[0]
//       }
//       else if (filterType === SpendingSummaryFilterOptions.THIS_WEEK) {
//          let currentDay = today.getDay();
//          let firstDay = new Date()
//          firstDay.setDate(today.getDate() - currentDay + 1)
//          start = firstDay.toISOString().split("T")[0]
//          end = today.toISOString().split("T")[0]
//       }
//       else if (filterType === SpendingSummaryFilterOptions.THIS_YEAR) {
//          start = `${today.getFullYear()}-01-01`
//          end = today.toISOString().split("T")[0]
//       }
//       else if (filterType === SpendingSummaryFilterOptions.THIS_MONTH) {
//          start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
//          end = today.toISOString().split("T")[0]
//       }
//       setstartDate(start);
//       setendDate(end);
//       getCashBankData(start, end);

//    }, [filterType])

//    useEffect(() => {
//       if (!selectedAction) return;
//       const action = selectedAction.split(" ").join("_") as SpaceAction;
//       if (action === SpaceAction.EDIT_DETAILS || action === SpaceAction.VIEW_DETAILS) {
//          setEditSpaceId(spaceid || null)
//          setSelectedAction(null)
//       } else if (action === SpaceAction.DELETE_SPACE) {
//          if (confirm("Are you sure?\nDo you want to delete this space? All the associated transactions and schedules will be deleted by this actions. This actions cannot be undone.")) {
//             deleteSpace(spaceid || "")
//                .then(res => {
//                   navigate(`/user-portal/all/all/${view}`);
//                })
//          }
//          setSelectedAction(null)
//       } else if (action === SpaceAction.LEFT_SPACE) {
//          if (confirm("Are you sure?\nDo you want to left this space?\nAll your past transactions will remain in this space. You will lose access permanently.")) {
//             leftSpace(spaceid || "")
//                .then((res: any) => {
//                   navigate(`/user-portal/all/all/${view}`);
//                })
//          }
//          setSelectedAction(null)
//       }
//    }, [selectedAction])

//    return (
//       loading || !summary ? <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary">Loading...</h1> : (
//          <>
//             {/* sub header */}
//             <div className="flex justify-between items-center">
//                <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary flex items-center">
//                   Dashboard
//                   <span
//                            className="max-w-fit ml-3 pt-2 pb-1 pl-1 pr-1 uppercase bg-transparent border border-2 border-primary text-xs rounded cursor-pointer"
//                         >{spacetype}</span>
//                   {
//                      currentSpace?.isCollaborative ? (
//                         <span
//                            className="max-w-fit ml-3 pt-2 pb-1 pl-1 pr-1 bg-transparent border border-2 border-primary text-xs rounded cursor-pointer"
//                         >COLLABORATIVE</span>
//                      ) : spacetype !== "all" ? <span
//                         className="max-w-fit ml-3 pt-2 pb-1 pl-1 pr-1 bg-transparent border border-2 border-primary text-xs rounded cursor-pointer"
//                      >PERSONAL</span> : null
//                   }
//                   {
//                      currentSpace?.isCollaborative ? (
//                         currentSpace.isOwner ?
//                            <span
//                               className="max-w-fit ml-3 pt-2 pb-1 pl-1 pr-1 bg-transparent border border-2 border-primary text-xs rounded cursor-pointer"
//                            >OWNER</span>
//                            :
//                            <span
//                               className="max-w-fit ml-3 pt-2 pb-1 pl-1 pr-1 bg-transparent border border-2 border-primary text-xs rounded cursor-pointer"
//                            >MEMBER</span>
//                      ) : null
//                   }
//                   {
//                      spaces.filter(sp => sp.isCollaborative).length > 0 && spacetype === "all" && (
//                         <FaInfoCircle
//                            className="ml-3 text-primary"
//                            title="The All Spaces view shows only your personal financial records. Transactions created by other members in collaborative spaces are not included."
//                         />
//                      )
//                   }

//                </h1>
//                <div className="flex justify-end gap-3 items-center">
//                   <DropDown
//                      title="ACTIONS"
//                      dropdownItems={spaceActions.map(action => action.split("_").join(" ")).slice(0, Object.values(SpaceAction).length - 1)}
//                      onClick={(text) => setSelectedAction(text)}
//                   />
//                </div>
//             </div>

//             {
//                (spacetype === "all") && (
//                   <AllSpaceSummary currency={currency || ""} summary={summary} />
//                )
//             }

//             {
//                (standardSpaceType === SpaceType.CASH || standardSpaceType === SpaceType.BANK) && (
//                   <>
//                      <CurrentBalance
//                         balance={totalIncome - totalExpense}
//                         currency={currency || ""}
//                      />
//                      <SpendingSummary
//                         spendingSummary={summary}
//                         currency={currency || ""}
//                         startDate={startDate}
//                         endDate={endDate}
//                         setstartDate={setstartDate}
//                         setendDate={setendDate}
//                         onDateRangeChange={getCashBankData}
//                         filterType={filterType}
//                         setFilterType={setFilterType}
//                         username={username || ""}
//                      />
//                      <CashFlowTrend spendingSummary={summary} />
//                   </>
//                )
//             }

//             {
//                (standardSpaceType === SpaceType.LOAN_LENT) && (
//                   <>
//                      <LoanLentSummary currency={currency || ""} loanSummary={summary} />
//                      <RecentTransactions loanSummary={summary} />
//                   </>
//                )
//             }

//             {
//                (standardSpaceType === SpaceType.LOAN_BORROWED) && (
//                   <>
//                      <LoanBorrowedSummary currency={currency || ""} loanSummary={summary} />
//                      <RecentTransactions loanSummary={summary} />
//                   </>
//                )
//             }

//             {
//                (standardSpaceType === SpaceType.CREDIT_CARD) && (
//                   <>
//                      <CreditCardSummary currency={currency || ""} creditCardSummary={summary} />
//                      <RecentTransactions loanSummary={summary} />
//                   </>
//                )
//             }

//             {
//                (standardSpaceType === SpaceType.SAVING_GOAL) && (
//                   <>
//                      <SavingGoalSummary currency={currency || ""} goalSummary={summary} username={username || ""} />
//                      <RecentTransactions loanSummary={summary} />
//                   </>
//                )
//             }

//             {
//                editSpaceId && <Spaces onCancel={() => setEditSpaceId(null)} editSpaceId={editSpaceId} summary={summary} />
//             }


//          </>
//       )
//    )
// }

// function getTodayDate() {
//    const input = new Date();

//    const year = input.getFullYear();
//    const month = String(input.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
//    const day = String(input.getDate()).padStart(2, '0');

//    const localDate = `${year}-${month}-${day}`;
//    return localDate;
// }

// export default DashBoard;


import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store/store";
import CurrentBalance from "./Dashboard/CurrentBalance"
import { useNavigate, useParams } from "react-router-dom";
import SpendingSummary from "./Dashboard/SpendingSummary";
import CreditCardSummary from "./Dashboard/CreditCardSummary";
import { DashboardService } from "../../../services/dashboard.service";
import { useEffect, useState } from "react";
import Spaces, { SpaceType } from "./Spaces";
import RecentTransactions from "./Dashboard/RecentTransactions";
import LoanLentSummary from "./Dashboard/LoanLentSummary";
import LoanBorrowedSummary from "./Dashboard/LoanBorrowedSummary";
import { toStrdSpaceType } from "../../../utils/utils";
import { SpendingSummaryFilterOptions } from "./Dashboard/SpendingSummary"
import CashFlowTrend from "./Dashboard/CashFlowTrend";
import DropDown from "../../../components/Dropdown";
import { SpaceService } from "../../../services/space.service";
import AllSpaceSummary from "./Dashboard/AllSpaceSummary";
import SavingGoalSummary from "./Dashboard/SavingGoalSummary";
import Button from "../../../components/Button";
import { FaInfoCircle } from "react-icons/fa";
import LoanRepaymentPlanForm from '../../../../src/components/user.portal/views/LoanRepaymentPlan/LoanRepaymentPlanForm';
import LoanInstallments from '../../../../src/components/user.portal/views/LoanRepaymentPlan/LoanInstallments';
import { LoanRepaymentPlanService } from '../../../services/loanRepaymentPlan.sevice';

interface LoanSummary {
  loan?: Array<{
    loanPrincipal?: {
      $numberDecimal: number;
    };
    loanStartDate?: string;
    loanEndDate?: string;
  }>;
}

interface SpendingSummaryData {
  // Define spending summary properties
  [key: string]: any;
}

interface CreditCardSummaryData {
  // Define credit card summary properties
  [key: string]: any;
}

interface SavingGoalSummaryData {
  // Define saving goal summary properties
  [key: string]: any;
}

interface AllSpaceSummaryData {
  // Define all space summary properties
  [key: string]: any;
}

// Union type for all possible summary types
type SummaryType = 
  | (LoanSummary & SpendingSummaryData & { spaceInfo?: any })
  | CreditCardSummaryData 
  | SavingGoalSummaryData 
  | AllSpaceSummaryData 
  | null;

enum SpaceAction {
   EDIT_DETAILS = "EDIT_DETAILS",
   VIEW_DETAILS = "VIEW_DETAILS",
   DELETE_SPACE = "DELETE_SPACE",
   LEFT_SPACE = "LEFT_SPACE"
}

function DashBoard() {
   const { username, currency, spaces } = useSelector((state: RootState) => state.auth)
   const { spaceid, spacetype, view } = useParams();
   const { getCashBankSummary, getOtherSpaceSummary, getAllSpaceSummary } = DashboardService();
   const [totalIncome, settotalIncome] = useState(0.0)
   const [totalExpense, settotalExpense] = useState(0.0)
   const [summary, setsummary] = useState<SummaryType>(null)
   const [loading, setLoading] = useState(false);
   const standardSpaceType = toStrdSpaceType(spacetype || "") as SpaceType;
   const currentSpace = spaces.find(sp => sp.id === spaceid);
   const [showPlanForm, setShowPlanForm] = useState(false);
   const [planDetails, setPlanDetails] = useState<any>(null);
   const [installments, setInstallments] = useState<any[]>([]);
   const [planExists, setPlanExists] = useState<boolean>(false);
   const { getPlanBySpaceId, getInstallmentsByPlanId, checkIfPlanExists } = LoanRepaymentPlanService();

   const today = new Date();
   const year = today.getFullYear();
   const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
   const day = String(today.getDate()).padStart(2, '0');

   const [startDate, setstartDate] = useState(`${year}-${month}-01`)
   const [endDate, setendDate] = useState(`${year}-${month}-${day}`)
   const [filterType, setFilterType] = useState(SpendingSummaryFilterOptions.THIS_MONTH)

   const [selectedAction, setSelectedAction] = useState<string | null>(null)
   const [editSpaceId, setEditSpaceId] = useState<string | null>(null)
   const navigate = useNavigate();
   const { deleteSpace, leftSpace } = SpaceService();

   // Determine if space can be edited
   const canEditSpace = () => {
      if (standardSpaceType !== SpaceType.LOAN_LENT && standardSpaceType !== SpaceType.LOAN_BORROWED) {
         return true; // Non-loan spaces can always be edited
      }
      // Loan spaces can only be edited if no plan exists
      return !planExists;
   };
   // const spaceActions = spaces.find(sp => sp.id == spaceid)?.isOwner ?
   //    [SpaceAction.EDIT_DETAILS, SpaceAction.DELETE_SPACE] :
   //    [SpaceAction.VIEW_DETAILS, SpaceAction.LEFT_SPACE]

   const spaceActions = () => {
      if (!currentSpace) return [];
      
      const baseActions = currentSpace.isOwner ?
         [SpaceAction.EDIT_DETAILS, SpaceAction.DELETE_SPACE] :
         [SpaceAction.VIEW_DETAILS, SpaceAction.LEFT_SPACE];

      // If it's a loan space with a plan, disable edit
      if ((standardSpaceType === SpaceType.LOAN_LENT || standardSpaceType === SpaceType.LOAN_BORROWED) && planExists) {
         return baseActions.filter(action => action !== SpaceAction.EDIT_DETAILS);
      }
      
      return baseActions;
   };

   const getCashBankData = async (start: string, end: string) => {
      console.log(startDate, endDate)
      setLoading(true)
      await getCashBankSummary(standardSpaceType, spaceid || "", start, end)
         .then(res => {
            if (res.totalIncome.length > 0) {
               settotalIncome(res.totalIncome[0].totalAmount.$numberDecimal)
            }
            if (res.totalExpense.length > 0) {
               settotalExpense(res.totalExpense[0].totalAmount.$numberDecimal)
            }
            const summary = {
               ...res.spendingSummary, spaceInfo: res.spaceInfo
            }
            console.log("summary: ", summary)
            setsummary(summary)
         })
         .catch(err => {
            settotalIncome(0)
            settotalExpense(0)
            setsummary(null)
         })
         .finally(() => {
            setLoading(false)
         })
   }

   const getOtherSpaceData = async () => {
      setLoading(true)
      await getOtherSpaceSummary(spacetype || "", spaceid || "")
         .then(res => {
            setsummary(res)
         })
         .catch(err => {
            setsummary(null)
         })
         .finally(() => {
            setLoading(false)
         })
   }

   const getAllSpaceData = async () => {
      setLoading(true)
      await getAllSpaceSummary()
         .then(res => {
            setsummary(res)
         })
         .catch(err => {
            setsummary(null)
         })
         .finally(() => {
            setLoading(false)
         })
   }

   const fetchLoanPlan = async () => {
    if (!spaceid) return;
    
    const plan = await getPlanBySpaceId(spaceid);
    setPlanDetails(plan);
    
    if (plan) {
        const inst = await getInstallmentsByPlanId(plan._id);
        setInstallments(inst);
    }
};

   useEffect(() => {
      if (spacetype === "all") {
         getAllSpaceData()
      }
      else if (standardSpaceType === SpaceType.CASH || standardSpaceType === SpaceType.BANK) {
         getCashBankData(startDate, endDate)
      } else {
         getOtherSpaceData()
      }
   }, [spaceid])

   useEffect(() => {
      if (filterType === SpendingSummaryFilterOptions.CUSTOM) return;

      let start = startDate;
      let end = endDate;

      if (filterType === SpendingSummaryFilterOptions.TODAY) {
         start = today.toISOString().split("T")[0]
         end = today.toISOString().split("T")[0]
      }
      else if (filterType === SpendingSummaryFilterOptions.YESTERDAY) {
         let yesterday = new Date()
         yesterday.setDate(today.getDate() - 1)
         start = yesterday.toISOString().split("T")[0]
         end = yesterday.toISOString().split("T")[0]
      }
      else if (filterType === SpendingSummaryFilterOptions.THIS_WEEK) {
         let currentDay = today.getDay();
         let firstDay = new Date()
         firstDay.setDate(today.getDate() - currentDay + 1)
         start = firstDay.toISOString().split("T")[0]
         end = today.toISOString().split("T")[0]
      }
      else if (filterType === SpendingSummaryFilterOptions.THIS_YEAR) {
         start = `${today.getFullYear()}-01-01`
         end = today.toISOString().split("T")[0]
      }
      else if (filterType === SpendingSummaryFilterOptions.THIS_MONTH) {
         start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
         end = today.toISOString().split("T")[0]
      }
      setstartDate(start);
      setendDate(end);
      getCashBankData(start, end);

   }, [filterType])

   useEffect(() => {
      if (!selectedAction) return;
      const action = selectedAction.split(" ").join("_") as SpaceAction;
      if (action === SpaceAction.EDIT_DETAILS || action === SpaceAction.VIEW_DETAILS) {
         setEditSpaceId(spaceid || null)
         setSelectedAction(null)
      } else if (action === SpaceAction.DELETE_SPACE) {
         if (confirm("Are you sure?\nDo you want to delete this space? All the associated transactions and schedules will be deleted by this actions. This actions cannot be undone.")) {
            deleteSpace(spaceid || "")
               .then(res => {
                  navigate(`/user-portal/all/all/${view}`);
               })
         }
         setSelectedAction(null)
      } else if (action === SpaceAction.LEFT_SPACE) {
         if (confirm("Are you sure?\nDo you want to left this space?\nAll your past transactions will remain in this space. You will lose access permanently.")) {
            leftSpace(spaceid || "")
               .then((res: any) => {
                  navigate(`/user-portal/all/all/${view}`);
               })
         }
         setSelectedAction(null)
      }
   }, [selectedAction])

   useEffect(() => {
      if (spaceid && (standardSpaceType === SpaceType.LOAN_LENT || standardSpaceType === SpaceType.LOAN_BORROWED)) {
         checkIfPlanExists(spaceid).then(exists => {
            setPlanExists(exists);
         });
         fetchLoanPlan();
      }
   }, [spaceid]);

   return (
      loading || !summary ? <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary">Loading...</h1> : (
         <>
            {/* sub header */}
            <div className="flex justify-between items-center">
               <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary flex items-center">
                  Dashboard
                  <span
                     className="max-w-fit ml-3 pt-2 pb-1 pl-1 pr-1 uppercase bg-transparent border border-2 border-primary text-xs rounded cursor-pointer"
                  >{spacetype}</span>
                  {
                     currentSpace?.isCollaborative ? (
                        <span
                           className="max-w-fit ml-3 pt-2 pb-1 pl-1 pr-1 bg-transparent border border-2 border-primary text-xs rounded cursor-pointer"
                        >COLLABORATIVE</span>
                     ) : spacetype !== "all" ? <span
                        className="max-w-fit ml-3 pt-2 pb-1 pl-1 pr-1 bg-transparent border border-2 border-primary text-xs rounded cursor-pointer"
                     >PERSONAL</span> : null
                  }
                  {
                     currentSpace?.isCollaborative ? (
                        currentSpace.isOwner ?
                           <span
                              className="max-w-fit ml-3 pt-2 pb-1 pl-1 pr-1 bg-transparent border border-2 border-primary text-xs rounded cursor-pointer"
                           >OWNER</span>
                           :
                           <span
                              className="max-w-fit ml-3 pt-2 pb-1 pl-1 pr-1 bg-transparent border border-2 border-primary text-xs rounded cursor-pointer"
                           >MEMBER</span>
                     ) : null
                  }
                  {
                     spaces.filter(sp => sp.isCollaborative).length > 0 && spacetype === "all" && (
                        <FaInfoCircle
                           className="ml-3 text-primary"
                           title="The All Spaces view shows only your personal financial records. Transactions created by other members in collaborative spaces are not included."
                        />
                     )
                  }

               </h1>
               <div className="flex justify-end gap-3 items-center">
                  <DropDown
                     title="ACTIONS"
                     dropdownItems={spaceActions().map(action => action.split("_").join(" ")).slice(0, Object.values(SpaceAction).length - 1)}
                     onClick={(text) => setSelectedAction(text)}
                  />
               </div>
            </div>

            {
               (spacetype === "all") && (
                  <AllSpaceSummary currency={currency || ""} summary={summary} />
               )
            }

            {
               (standardSpaceType === SpaceType.CASH || standardSpaceType === SpaceType.BANK) && (
                  <>
                     <CurrentBalance
                        balance={totalIncome - totalExpense}
                        currency={currency || ""}
                     />
                     <SpendingSummary
                        spendingSummary={summary}
                        currency={currency || ""}
                        startDate={startDate}
                        endDate={endDate}
                        setstartDate={setstartDate}
                        setendDate={setendDate}
                        onDateRangeChange={getCashBankData}
                        filterType={filterType}
                        setFilterType={setFilterType}
                        username={username || ""}
                     />
                     <CashFlowTrend spendingSummary={summary} />
                  </>
               )
            }

            {
               (standardSpaceType === SpaceType.LOAN_LENT) && (
                  <>
                     <LoanLentSummary currency={currency || ""} loanSummary={summary} />
                     <RecentTransactions loanSummary={summary} />

                     {!planDetails && (
                        <Button
                            text="Create Repayment Plan"
                            className="max-w-fit mt-2"
                            onClick={() => setShowPlanForm(true)}
                        />
                     )}

                     {planDetails && installments.length > 0 && (
                        <LoanInstallments
                            spaceId={spaceid || ""}
                            spaceType={standardSpaceType as 'LOAN_LENT' | 'LOAN_BORROWED'}
                            planId={planDetails._id}
                            installments={installments}
                            onRefresh={fetchLoanPlan}
                            planDetails={planDetails}
                        />
                     )}

                     {showPlanForm && (
                        <LoanRepaymentPlanForm
                            spaceId={spaceid || ""}
                            spaceType={standardSpaceType as 'LOAN_LENT' | 'LOAN_BORROWED'}
                            defaultLoanAmount={(summary as LoanSummary)?.loan?.[0]?.loanPrincipal?.$numberDecimal || 0}
                            defaultStartDate={(summary as LoanSummary)?.loan?.[0]?.loanStartDate?.split('T')[0] || ''}
                            defaultEndDate={(summary as LoanSummary)?.loan?.[0]?.loanEndDate?.split('T')[0] || ''}
                            onCancel={() => setShowPlanForm(false)}
                            onSuccess={() => {
                                setShowPlanForm(false);
                                fetchLoanPlan();
                            }}
                            planId={planDetails?._id}
                            existingPlan={planDetails}
                        />
                     )}
                  </>
               )
            }

            {
               (standardSpaceType === SpaceType.LOAN_BORROWED) && (
                  <>
                     <LoanBorrowedSummary currency={currency || ""} loanSummary={summary} />
                     <RecentTransactions loanSummary={summary} />

                     {!planDetails && (
                        <Button
                            text="Create Repayment Plan"
                            className="max-w-fit mt-2"
                            onClick={() => setShowPlanForm(true)}
                        />
                     )}

                     {planDetails && installments.length > 0 && (
                        <LoanInstallments
                            spaceId={spaceid || ""}
                            spaceType={standardSpaceType as 'LOAN_LENT' | 'LOAN_BORROWED'}
                            planId={planDetails._id}
                            installments={installments}
                            onRefresh={fetchLoanPlan}
                            planDetails={planDetails}
                        />
                     )}

                     {showPlanForm && (
                        <LoanRepaymentPlanForm
                            spaceId={spaceid || ""}
                            spaceType={standardSpaceType as 'LOAN_LENT' | 'LOAN_BORROWED'}
                            defaultLoanAmount={(summary as LoanSummary)?.loan?.[0]?.loanPrincipal?.$numberDecimal || 0}
                            defaultStartDate={(summary as LoanSummary)?.loan?.[0]?.loanStartDate?.split('T')[0] || ''}
                            defaultEndDate={(summary as LoanSummary)?.loan?.[0]?.loanEndDate?.split('T')[0] || ''}
                            onCancel={() => setShowPlanForm(false)}
                            onSuccess={() => {
                                setShowPlanForm(false);
                                fetchLoanPlan();
                            }}
                            planId={planDetails?._id}
                            existingPlan={planDetails}
                        />
                     )}
                  </>
               )
            }

            {
               (standardSpaceType === SpaceType.CREDIT_CARD) && (
                  <>
                     <CreditCardSummary currency={currency || ""} creditCardSummary={summary} />
                     <RecentTransactions loanSummary={summary} />
                  </>
               )
            }

            {
               (standardSpaceType === SpaceType.SAVING_GOAL) && (
                  <>
                     <SavingGoalSummary currency={currency || ""} goalSummary={summary} username={username || ""} />
                     <RecentTransactions loanSummary={summary} />
                  </>
               )
            }

            {
               editSpaceId && <Spaces onCancel={() => setEditSpaceId(null)} editSpaceId={editSpaceId} summary={summary} />
            }
         </>
      )
   )
}

function getTodayDate() {
   const input = new Date();

   const year = input.getFullYear();
   const month = String(input.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
   const day = String(input.getDate()).padStart(2, '0');

   const localDate = `${year}-${month}-${day}`;
   return localDate;
}
export default DashBoard;
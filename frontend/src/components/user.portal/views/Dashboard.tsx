import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store/store";
import CurrentBalance from "./Dashboard/CurrentBalance"
import { useNavigate, useParams } from "react-router-dom";
import SpendingSummary from "./Dashboard/SpendingSummary";
import CreditCardSummary from "./Dashboard/CreditCardSummary";
import { DashboardService } from "../../../services/dashboard.service";
import { Dispatch, useEffect, useState } from "react";
import Spaces, { SpaceType } from "./Spaces";
import RecentTransactions from "./Dashboard/RecentTransactions";
import LoanLentSummary from "./Dashboard/LoanLentSummary";
import LoanBorrowedSummary from "./Dashboard/LoanBorrowedSummary";
import { toLocalSpaceType, toStrdSpaceType } from "../../../utils/utils";
import { SpendingSummaryFilterOptions } from "./Dashboard/SpendingSummary"
import CashFlowTrend from "./Dashboard/CashFlowTrend";
import DropDown from "../../../components/Dropdown";
import { SpaceService } from "../../../services/space.service";
import NetWorthSummary from "./Dashboard/NetWorthSummary";
import AssetsSummary from "./Dashboard/AssetsSummary";
import AllSpaceSummary from "./Dashboard/AllSpaceSummary";
import SavingGoalSummary from "./Dashboard/SavingGoalSummary";

enum SpaceAction {
   EDIT_DETAILS = "EDIT_DETAILS",
   DELETE_SPACE = "DELETE_SPACE"
}

function DashBoard() {
   const { currency, spaces } = useSelector((state: RootState) => state.auth)
   const { spaceid, spacetype, view } = useParams();
   const { getCashBankSummary, getOtherSpaceSummary, getAllSpaceSummary } = DashboardService();
   const [totalIncome, settotalIncome] = useState(0.0)
   const [totalExpense, settotalExpense] = useState(0.0)
   const [summary, setsummary] = useState(null)
   const [loading, setLoading] = useState(false);
   const standardSpaceType = toStrdSpaceType(spacetype || "") as SpaceType;

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
   const { deleteSpace } = SpaceService()

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
            setsummary(res.spendingSummary)
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
      if (action === SpaceAction.EDIT_DETAILS) {
         console.log(spaceid)
         setEditSpaceId(spaceid || null)
         setSelectedAction(null)
      }
      if (action === SpaceAction.DELETE_SPACE) {
         if (confirm("Are you sure?\nDo you want to delete this space? All the associated transactions and schedules will be deleted by this actions. This actions cannot be undone.")) {
            deleteSpace(spaceid || "")
               .then(res => {
                  const to = spaces[0]
                  navigate(`/user-portal/${toLocalSpaceType(to.type)}/${to.id}/${view}`)
               })
         }
         setSelectedAction(null)
      }
   }, [selectedAction])

   return (
      loading || !summary ? <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary">Loading...</h1> : (
         <>
            {/* sub header */}
            <div className="flex justify-between items-center">
               <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary">Dashboard</h1>
               <div className="flex justify-end gap-3 items-center">
                  {
                     spacetype != "all" && (
                        <DropDown
                           title="ACTIONS"
                           dropdownItems={Object.values(SpaceAction).map(action => action.split("_").join(" ")).slice(0, Object.values(SpaceAction).length - 1)}
                           lastItem={SpaceAction.DELETE_SPACE.split("_").join(" ")}
                           onClick={(text) => setSelectedAction(text)}
                        />
                     )
                  }
               </div>
            </div>

            {
               (spacetype === "all") && (
                  <AllSpaceSummary currency={currency || ""} summary={summary}/>
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
                  </>
               )
            }

            {
               (standardSpaceType === SpaceType.LOAN_BORROWED) && (
                  <>
                     <LoanBorrowedSummary currency={currency || ""} loanSummary={summary} />
                     <RecentTransactions loanSummary={summary} />
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
                  <SavingGoalSummary currency={currency || ""} goalSummary={summary}/>
                  <RecentTransactions loanSummary={summary} />
                     {/* <CreditCardSummary currency={currency || ""} creditCardSummary={summary} />
                     <RecentTransactions loanSummary={summary} /> */}
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
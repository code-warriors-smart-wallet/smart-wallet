import { useState, useEffect } from "react";
import NavBar from "../../components/user.portal/NavBar";
import SideBar, { UserPortalView } from "../../components/user.portal/SideBar";
import { useNavigate, useParams } from "react-router-dom";
import DashBoard from "../../components/user.portal/views/Dashboard";
import Transactions from "../../components/user.portal/views/Transactions";
import Spaces from "../../components/user.portal/views/Spaces";
import Budget from "../../components/user.portal/views/Budget";
import Category from "../../components/user.portal/views/Category";
import Schedule from "../../components/user.portal/views/Schedule";
import Reports from "../../components/user.portal/views/Reports";
import AllSpacesPlanSummary from '../../components/user.portal/views/LoanRepaymentPlan/AllSpacesPlanSummary'
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store/store";
import { LoanRepaymentPlanService } from "../../../src/services/loanRepaymentPlan.sevice";

function UserPortal() {

   const [isSideBarOpen, setSideBarOpen] = useState<boolean>(false)
   const { spacetype, spaceid, view } = useParams()
   const [spaceFormToggle, setSpaceFormToggle] = useState(false)
   const { spaces, currency } = useSelector((state: RootState) => state.auth)

   const [loanPlans, setLoanPlans] = useState<any[]>([])
   const [loading, setLoading] = useState<boolean>(false)

   const navigate = useNavigate()
   const loanService = LoanRepaymentPlanService()

   useEffect(() => {
      const fetchLoanPlans = async () => {
         if (spaceid === "all" && view === UserPortalView.REPAYMENT_PLANS) {
            setLoading(true)
            try {
               const plans = await loanService.getAllUserLoanPlans()
               setLoanPlans(plans || [])
            } catch (error) {
               console.error("Error fetching loan plans:", error)
               setLoanPlans([])
            } finally {
               setLoading(false)
            }
         }
      }

      fetchLoanPlans()
   }, [spaceid, view])

   if (!view) {
      navigate("/")
   }

   const isBudgetAccessible = () => {
      // If viewing "All spaces", budgets should be accessible
      if (spaceid === "all") {
         return true;
      }

      // Find the current space by ID
      const currentSpace = spaces.find(space => space.id === spaceid);

      // If space not found or space type is not supported, budgets are not accessible
      if (!currentSpace) {
         return false;
      }

      // Allowed space types for budgets: CASH, BANK, CREDIT_CARD
      const allowedBudgetTypes = ["CASH", "BANK", "CREDIT_CARD"];
      return allowedBudgetTypes.includes(currentSpace.type);
   }

   const isRepaymentPlanAccessible = () => {
      // If viewing "All spaces", repayment plans should be accessible
      if (spaceid === "all") {
         return true;
      }
      return false;
   }

   // Handler for viewing plan details
   const handleViewPlanDetails = (spaceId: string, spaceType: string) => {
      // Navigate to the specific space's repayment plan view
     navigate(`/user-portal/${spaceType}/${spaceId}/${UserPortalView.REPAYMENT_PLANS}`)
   }

   const ViewComponent = () => {
      // If trying to access budgets for a non-supported space, redirect to dashboard
      if (view === UserPortalView.BUDGETS && !isBudgetAccessible()) {
         navigate(`/user-portal/${spacetype}/${spaceid}/${UserPortalView.DASHBOARD}`);
         return null;
      }

      // If trying to access repayment plans for a non-supported space, redirect to dashboard
      if (view === UserPortalView.REPAYMENT_PLANS && !isRepaymentPlanAccessible()) {
         navigate(`/user-portal/${spacetype}/${spaceid}/${UserPortalView.DASHBOARD}`);
         return null;
      }

      switch (view) {
         case UserPortalView.DASHBOARD:
            return <DashBoard />
         case UserPortalView.TRANSACTIONS:
            return <Transactions />
         case UserPortalView.SCHEDULES:
            return <Schedule />
         case UserPortalView.BUDGETS:
            return <Budget />
         case UserPortalView.CATEGORIES:
            return <Category />
         case UserPortalView.REPORTS:
            return <Reports />
         case UserPortalView.REPAYMENT_PLANS:
            return (
               <AllSpacesPlanSummary
                  plans={loanPlans}
                  currency={currency || "USD"}
                  onViewDetails={handleViewPlanDetails}
               />
            )
         default:
            return <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary">Default</h1>
      }
   }

   const onCancelSpaceAction = () => {
      setSpaceFormToggle(false)
      // navigate(`/user-portal/${spacetype}/${spaceid}/${view}`)
   }

   return (
      <main className="font-main dark bg-bg-light-primary dark:bg-bg-dark-primary">
         <NavBar
            isSideBarOpen={isSideBarOpen}
            setSideBarOpen={setSideBarOpen}
            view={view as UserPortalView ?? UserPortalView.DASHBOARD}
            spaceId={spaceid || ""}
            setSpaceFormToggle={setSpaceFormToggle}
         />

         <SideBar
            isSideBarOpen={isSideBarOpen}
            view={view as UserPortalView ?? UserPortalView.DASHBOARD}
            spacetype={spacetype || ""}
            spaceid={spaceid || ""}
         />

         <div className="p-4 sm:ml-64 mt-5">
            <div className="p-4 border-1 border-border-light-primary rounded-lg dark:border-border-dark-primary mt-14 min-h-screen h-fit">
               <>{ViewComponent()}</>
            </div>
         </div>

         {
            spaceFormToggle && <Spaces onCancel={onCancelSpaceAction} />
         }

      </main>
   )
}

export default UserPortal;


import SideBarItem from "./SideBarItem";
import { useNavigate } from "react-router-dom";
import SidebarDropdownItem from "./SideBarDropDownItem";
import { BudgetIcon, CategoryIcon, DashBoardIcon, GoalIcon, LogoutIcon, NotificationIcon, ReportIcon, ScheduleIcon, SettingsIcon, SpaceIcon, TransactionIcon, RepaymentPlanIcon } from "../icons";
import { AuthService } from "../../services/auth/auth.service";
import { MdFileDownload } from "react-icons/md";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store/store";

export enum UserPortalView {
   DASHBOARD = "dashboard",
   TRANSACTIONS = "transactions",
   MANAGE_SPACE = "manage space",
   SCHEDULES = "schedules",
   BUDGETS = "budgets",
   GOALS = "goals",
   CATEGORIES = "categories",
   NOTIFICATIONS = "notifications",
   SETTINGS = "settings",
   SETTINGS_PROFILE = "profile",
   SETTINGS_BILLING = "billing",
   REPORTS = "reports",
   REPAYMENT_PLANS = "repayment-plans",
   LOGOUT = "log out"
}

function SideBar({ isSideBarOpen, view, spacetype, spaceid }: { isSideBarOpen: boolean, view: UserPortalView, spacetype: string, spaceid: string }) {
   const sideBarStyleSM = isSideBarOpen ? "" : "-translate-x-full"

   const navigate = useNavigate()
   const { logOut } = AuthService();
   const { spaces } = useSelector((state: RootState) => state.auth)

   const onClickSideBarItem = (newView: string) => {
      navigate(`/user-portal/${spacetype}/${spaceid}/${newView}`);
   }

   const shouldShowBudget = () => {
      // If viewing "All spaces", budget should be shown
      if (spaceid === "all") {
         return true;
      }

      // Find the current space by ID
      const currentSpace = spaces.find(space => space.id === spaceid);

      // If space not found, hide budget
      if (!currentSpace) {
         return false;
      }

      // Allowed space types for budgets: CASH, BANK, CREDIT_CARD
      const allowedBudgetTypes = ["CASH", "BANK", "CREDIT_CARD"];
      return allowedBudgetTypes.includes(currentSpace.type);
   }

   // const shouldShowRepaymentPlan = () => {
   //    // If viewing "All spaces", repayment plan should be shown
   //    if (spaceid === "all") {
   //       return true;
   //    }
   //    // Find the current space by ID
   //    const currentSpace = spaces.find(space => space.id === spaceid);

   //    // If space not found or space type is not supported, repayment plans are not accessible
   //    if (!currentSpace) {
   //       return false;
   //    }

   //    // Allowed space types for repayment plans: LOAN_LENT,LOAN_BORROWED
   //    const allowedBudgetTypes = ["LOAN_LENT", "LOAN_BORROWED"];
   //    return allowedBudgetTypes.includes(currentSpace.type);
   // }

   const shouldShowRepaymentPlan = () => {
      // If viewing "All spaces", repayment plan should be shown
      if (spaceid === "all") {
         return true;
      }
      return false;
   }

   return (
      <aside id="logo-sidebar" className={`fixed top-5 left-0 z-40 w-64 h-screen pt-20 transition-transform ${sideBarStyleSM} bg-bg-light-primary border-r border-border-light-primary dark:bg-bg-dark-primary dark:border-border-dark-primary sm:translate-x-0`} aria-label="Sidebar">
         <div className="h-full px-3 pb-4 overflow-y-auto bg-bg-light-primary dark:bg-bg-dark-primary">
            <ul className="space-y-2 font-medium">
               <SideBarItem name={UserPortalView.DASHBOARD} isActive={view == UserPortalView.DASHBOARD} onClick={onClickSideBarItem} Icon={DashBoardIcon} />
               <SideBarItem name={UserPortalView.TRANSACTIONS} isActive={view == UserPortalView.TRANSACTIONS} onClick={onClickSideBarItem} Icon={TransactionIcon} />
               <SideBarItem name={UserPortalView.SCHEDULES} isActive={view == UserPortalView.SCHEDULES} onClick={onClickSideBarItem} Icon={ScheduleIcon} />
               {shouldShowBudget() && (<SideBarItem name={UserPortalView.BUDGETS} isActive={view == UserPortalView.BUDGETS} onClick={onClickSideBarItem} Icon={BudgetIcon} />)}
               {shouldShowRepaymentPlan() && (<SideBarItem name={UserPortalView.REPAYMENT_PLANS} isActive={view == UserPortalView.REPAYMENT_PLANS} onClick={onClickSideBarItem} Icon={RepaymentPlanIcon} />)}
               {/* <SideBarItem name={UserPortalView.GOALS} isActive={view == UserPortalView.GOALS} onClick={onClickSideBarItem} Icon={GoalIcon} /> */}
               {/* <SideBarItem name={UserPortalView.NOTIFICATIONS} isActive={view == UserPortalView.NOTIFICATIONS} pc={5} onClick={onClickSideBarItem} Icon={NotificationIcon} /> */}
               <SideBarItem name={UserPortalView.CATEGORIES} isActive={view == UserPortalView.CATEGORIES} onClick={onClickSideBarItem} Icon={CategoryIcon} />
               <SideBarItem name={UserPortalView.REPORTS} isActive={view == UserPortalView.REPORTS} onClick={onClickSideBarItem} Icon={ReportIcon} />
               {/* <SideBarItem name={UserPortalView.MANAGE_SPACE} isActive={view == UserPortalView.MANAGE_SPACE} onClick={onClickSideBarItem} Icon={SpaceIcon} /> */}
               {/* <SidebarDropdownItem name={UserPortalView.SETTINGS} onClick={onClickSideBarItem} Icon={SettingsIcon}>
                  <SideBarItem name={UserPortalView.SETTINGS_PROFILE} onClick={onClickSideBarItem} isActive={view == UserPortalView.SETTINGS_PROFILE} />
                  <SideBarItem name={UserPortalView.SETTINGS_BILLING} onClick={onClickSideBarItem} isActive={view == UserPortalView.SETTINGS_BILLING} />
               </SidebarDropdownItem> */}
               <SideBarItem name={UserPortalView.LOGOUT} isActive={view == UserPortalView.LOGOUT} onClick={logOut} Icon={LogoutIcon} />
            </ul>
         </div>
      </aside>
   )
}

export default SideBar;
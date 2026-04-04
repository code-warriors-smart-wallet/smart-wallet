import SideBarItem from "./SideBarItem";
import { useNavigate } from "react-router-dom";
import SidebarDropdownItem from "./SideBarDropDownItem";
import { BudgetIcon, CategoryIcon, DashBoardIcon, GoalIcon, LogoutIcon, NotificationIcon, ReportIcon, ScheduleIcon, SettingsIcon, SpaceIcon, TransactionIcon } from "../icons";
import { AuthService } from "../../services/auth/auth.service";
import { MdFileDownload } from "react-icons/md";
import { SpaceType } from "./views/Spaces";
import { toStrdSpaceType } from "./../../utils/utils";
import { RootState } from "@/redux/store/store";
import { useSelector } from "react-redux";
import { PlanType } from "../../interfaces/modals";
import { useState } from "react";
import Upgrade from "./views/Subscription/Upgrade";

export enum UserPortalView {
   DASHBOARD = "dashboard",
   TRANSACTIONS = "transactions",
   MANAGE_SPACE = "manage space",
   SCHEDULES = "schedules",
   BUDGETS = "budgets",
   LOAN_REPAYMENT_PLAN="loan repayment plan",
   GOALS = "goals",
   CATEGORIES = "categories",
   NOTIFICATIONS = "notifications",
   SETTINGS = "settings",
   SETTINGS_PROFILE = "profile",
   SETTINGS_BILLING = "billing",
   REPORTS = "reports",
   AI_ASSISTANT = "ai assistant",
   LOGOUT = "log out"
}

function SideBar({ isSideBarOpen, view, spacetype, spaceid }: { isSideBarOpen: boolean, view: UserPortalView, spacetype: string, spaceid: string }) {
   const sideBarStyleSM = isSideBarOpen ? "" : "-translate-x-full"

   const navigate = useNavigate()
   const {logOut} = AuthService();
   const { plan } = useSelector((state: RootState) => state.auth)
   const [upgradeMessage, setUpgradeMessage] = useState("");

   const onClickSideBarItem = (newView: string) => {
      if (plan === PlanType.STARTER && [UserPortalView.LOAN_REPAYMENT_PLAN, UserPortalView.REPORTS, UserPortalView.AI_ASSISTANT].includes(newView as UserPortalView)) {
         setUpgradeMessage(`Upgrade to unlock ${newView}!`);
         return;
      }
      navigate(`/user-portal/${spacetype}/${spaceid}/${newView}`);
   }

   return (
      <>
      <aside id="logo-sidebar" className={`fixed top-5 left-0 z-40 w-64 h-screen pt-20 transition-transform ${sideBarStyleSM} bg-bg-light-primary border-r border-border-light-primary dark:bg-bg-dark-primary dark:border-border-dark-primary sm:translate-x-0`} aria-label="Sidebar">
         <div className="h-full px-3 pb-4 overflow-y-auto bg-bg-light-primary dark:bg-bg-dark-primary">
            <ul className="space-y-2 font-medium">
               <SideBarItem name={UserPortalView.DASHBOARD} isActive={view == UserPortalView.DASHBOARD} onClick={onClickSideBarItem} Icon={DashBoardIcon} />
               <SideBarItem name={UserPortalView.TRANSACTIONS} isActive={view == UserPortalView.TRANSACTIONS} onClick={onClickSideBarItem} Icon={TransactionIcon} />
               {/* <SideBarItem name={UserPortalView.SCHEDULES} isActive={view == UserPortalView.SCHEDULES} onClick={onClickSideBarItem} Icon={ScheduleIcon} /> */}
               {
                  ![SpaceType.LOAN_BORROWED, SpaceType.LOAN_LENT].includes(toStrdSpaceType(spacetype) as SpaceType) && (
                     <SideBarItem name={UserPortalView.SCHEDULES} isActive={view == UserPortalView.SCHEDULES} onClick={onClickSideBarItem} Icon={ScheduleIcon} />
                  )
               }
               {
                  ["ALL", SpaceType.CASH, SpaceType.BANK, SpaceType.CREDIT_CARD].includes(toStrdSpaceType(spacetype) as SpaceType) && (
                     <SideBarItem name={UserPortalView.BUDGETS} isActive={view == UserPortalView.BUDGETS} onClick={onClickSideBarItem} Icon={BudgetIcon} />
                  )
               }
               {
                  [SpaceType.LOAN_BORROWED, SpaceType.LOAN_LENT].includes(toStrdSpaceType(spacetype) as SpaceType) && (
                     <SideBarItem name={UserPortalView.LOAN_REPAYMENT_PLAN} isActive={view == UserPortalView.LOAN_REPAYMENT_PLAN} onClick={onClickSideBarItem} Icon={BudgetIcon} />
                  )
               }
               {/* <SideBarItem name={UserPortalView.GOALS} isActive={view == UserPortalView.GOALS} onClick={onClickSideBarItem} Icon={GoalIcon} /> */}
               {/* <SideBarItem name={UserPortalView.NOTIFICATIONS} isActive={view == UserPortalView.NOTIFICATIONS} pc={5} onClick={onClickSideBarItem} Icon={NotificationIcon} /> */}
               <SideBarItem name={UserPortalView.CATEGORIES} isActive={view == UserPortalView.CATEGORIES} onClick={onClickSideBarItem} Icon={CategoryIcon} />
               <SideBarItem name={UserPortalView.REPORTS} isActive={view == UserPortalView.REPORTS} onClick={onClickSideBarItem} Icon={ReportIcon} />
               {/* <SideBarItem name={UserPortalView.MANAGE_SPACE} isActive={view == UserPortalView.MANAGE_SPACE} onClick={onClickSideBarItem} Icon={SpaceIcon} /> */}
               <SidebarDropdownItem name={UserPortalView.SETTINGS} onClick={() => {}} Icon={SettingsIcon}>
                  <SideBarItem name={UserPortalView.SETTINGS_PROFILE} onClick={onClickSideBarItem} isActive={view == UserPortalView.SETTINGS_PROFILE} />
                  <SideBarItem name={UserPortalView.SETTINGS_BILLING} onClick={onClickSideBarItem} isActive={view == UserPortalView.SETTINGS_BILLING} />
               </SidebarDropdownItem>
               <SideBarItem name={UserPortalView.LOGOUT} isActive={view == UserPortalView.LOGOUT} onClick={logOut} Icon={LogoutIcon} />
            </ul>
         </div>
      </aside>
      {
            upgradeMessage != "" && <Upgrade setUpgradeMode={setUpgradeMessage} message={upgradeMessage} />
         }
      </>
   )
}

export default SideBar;
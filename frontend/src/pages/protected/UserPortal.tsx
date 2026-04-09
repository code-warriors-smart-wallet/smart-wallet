import { useState } from "react";
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
import LoanRepaymentPlan from "../../components/user.portal/views/LoanRepaymentPlan";
import Profile from "../../components/user.portal/views/Profile";
import Subscription from "../../components/user.portal/views/Subscription";
import AIAssistant from "../../components/user.portal/views/AIAssistant";

function UserPortal() {

   const [isSideBarOpen, setSideBarOpen] = useState<boolean>(false)
   const { spacetype, spaceid, view } = useParams()
   const [spaceFormToggle, setSpaceFormToggle] = useState(false)
   
   const navigate = useNavigate()

   if (!view) {
      navigate("/")
   }

   const ViewComponent = () => {
      switch (view) {
         case UserPortalView.DASHBOARD:
            return <DashBoard />
         case UserPortalView.TRANSACTIONS:
            return <Transactions />
         case UserPortalView.SCHEDULES:
            return <Schedule />
         case UserPortalView.BUDGETS:
            return <Budget />
         case UserPortalView.LOAN_REPAYMENT_PLAN:
            return <LoanRepaymentPlan />
         case UserPortalView.CATEGORIES:
            return <Category />
         case UserPortalView.REPORTS:
            return <Reports />
         case UserPortalView.SETTINGS_PROFILE:
            return <Profile />
         case UserPortalView.SETTINGS_BILLING:
            return <Subscription />
         case UserPortalView.AI_ASSISTANT:
            return <AIAssistant />
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
            <div className="p-4 mt-14 min-h-screen h-fit border-1 border-border-light-primary rounded-lg dark:border-border-dark-primary">
               <>{ViewComponent()}</>
            </div>
         </div>

         {
            spaceFormToggle && <Spaces onCancel={onCancelSpaceAction}/>
         }

      </main>
   )
}

export default UserPortal;


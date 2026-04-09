import { Dispatch, useEffect, useState } from "react";
import { MenuIcon } from "../icons";
import Logo from "../Logo";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store/store";
import { UserPortalView } from "./SideBar";
import { capitalize, toLocalSpaceType } from "../../utils/utils";
import { useNavigate, useParams } from "react-router-dom";
import DropDown from "../Dropdown";
import { transactionTypesInfo } from "./views/Transactions";
import { FaGem, FaGlobe, FaPlus, FaStar, FaUser, FaUserAlt, FaUserAltSlash } from "react-icons/fa";
import SearchInput from "./SearchInput";
import { SpaceType } from "./views/Spaces";
import { PlanType } from "../../interfaces/modals";
import Upgrade from "./views/Subscription/Upgrade";

function NavBar({ setSideBarOpen, isSideBarOpen, view, spaceId, setSpaceFormToggle }: { setSideBarOpen: (isopen: boolean) => void, isSideBarOpen: boolean, view: UserPortalView, spaceId: string, setSpaceFormToggle: Dispatch<React.SetStateAction<boolean>> }) {

   const [isUserMenuOpen, setUserMenuOpen] = useState<boolean>(false)
   const { email, username, spaces, plan, profileImgUrl } = useSelector((state: RootState) => state.auth)
   const [dropdownItems, setDropDownItems] = useState<string[]>([])
   const [dropdownIcons, setDropDownIcons] = useState<React.ReactNode[]>([])
   const [activeDropdownIcon, setActiveDropdownIcon] = useState<React.ReactNode>([])
   const [activeDropdownText, setActiveDropdownText] = useState<string>("")
   const [upgradeMessage, setUpgradeMessage] = useState("");
   const { spacetype, spaceid } = useParams()
   const navigate = useNavigate();

   console.log(spaces)

   const onInputChange = (text: string) => {
      if (text === "New Space") {
         if (plan === PlanType.STARTER && spaces.length >= 5) {
            setUpgradeMessage("Upgrade to unlock more spaces!");
            return;
         }
         setSpaceFormToggle(true)
         return
      }
      const selectedSpace = spaces.find(sp => sp.name === text)
      if (!selectedSpace) {
         navigate(`/user-portal/all/all/${view}`);
         return;
      }
      navigate(`/user-portal/${toLocalSpaceType(selectedSpace.type)}/${selectedSpace.id}/${view}`);
   }

   useEffect(() => {

      const dropdownItemsL = ["All spaces"]
      const dropdownIconsL: React.ReactNode[] = [<FaGlobe />]
      let title = ""
      let titleIcon: React.ReactNode = <></>
      const lastItem = "New Space"
      const lastIcon = <FaPlus />

      // --- Filter spaces for Budget view ---
      let filteredSpaces = (spaces || []);
      if (view === UserPortalView.BUDGETS) {
         const allowedTypes = [SpaceType.BANK, SpaceType.CASH, SpaceType.CREDIT_CARD];
         filteredSpaces = (spaces || []).filter((space) =>
            allowedTypes.includes(space.type as SpaceType)
         );
      }

      if (view === UserPortalView.SCHEDULES) {
         const allowedTypes = [SpaceType.BANK, SpaceType.CASH, SpaceType.CREDIT_CARD, SpaceType.SAVING_GOAL];
         filteredSpaces = (spaces || []).filter((space) =>
            allowedTypes.includes(space.type as SpaceType)
         );
      }

      filteredSpaces.forEach((space) => {
         dropdownItemsL.push(space.name);
         dropdownIconsL.push(
            transactionTypesInfo.find((info) => info.spaceType === space.type)?.icon
         );

         if (space.id === spaceId) {
            title = space.name;
            titleIcon =
               transactionTypesInfo.find((info) => info.spaceType === space.type)
                  ?.icon || <></>;
         }
      });

      // spaces.forEach(space => {
      //    if (space.id === spaceId) {
      //       title = space.name,
      //       titleIcon = transactionTypesInfo.find(info => info.spaceType === space.type)?.icon
      //    }
      //    dropdownItemsL.push(space.name)
      //    dropdownIconsL.push(transactionTypesInfo.find(info => info.spaceType === space.type)?.icon)
      // })

      // If no space matches, fallback to "All spaces"
      if (!title || spaceId === "all") {
         title = "All spaces";
         titleIcon = <FaGlobe />;
      }

      // if (!title) {
      //    title = "All spaces"
      //    titleIcon = <FaGlobe/>
      // }

      console.log(dropdownItemsL, title)

      setDropDownIcons(dropdownIconsL);
      setDropDownItems(dropdownItemsL)
      setActiveDropdownIcon(titleIcon)
      setActiveDropdownText(title)

   }, [spaceId, spaces, view])

   return (
      <>
         <nav className="fixed top-0 z-50 w-full bg-surface border-b border-border-main h-20 transition-colors duration-300">
            <div className="px-3 py-3 lg:px-5 lg:pl-3 h-full">
               <div className="flex items-center justify-between h-full">
                  <div className="flex items-center justify-start rtl:justify-end w-65">
                     <button
                        type="button"
                        className="inline-flex items-center p-2 text-sm rounded-lg sm:hidden hover:bg-hover-light-primary focus:outline-none focus:ring-2 focus:ring-gray-200 active:ring-hover-light-primary dark:text-gray-400 dark:hover:bg-hover-dark-primary dark:focus:ring-gray-600 dark:active:ring-hover-dark-primary"
                        onClick={() => setSideBarOpen(!isSideBarOpen)}
                     >
                        <MenuIcon />
                     </button>
                     <Logo />
                  </div>
                  <SearchInput
                     view={view}
                  />
                  {
                     plan === PlanType.STARTER && (
                        <button 
                           className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded cursor-pointer"
                           onClick={() => navigate(`/user-portal/${spacetype}/${spaceid}/${UserPortalView.SETTINGS_BILLING}`)}
                        >
                           Upgrade Plan
                        </button>
                     )
                  }

                  <div className="max-w-sm ml-3">
                     <DropDown
                        title={activeDropdownText}
                        titleIcon={activeDropdownIcon}
                        dropdownItems={dropdownItems}
                        dropdownIcons={dropdownIcons}
                        lastItem={"New Space"}
                        lastIcon={<FaPlus />}
                        onClick={(text) => onInputChange(text)}
                     />
                  </div>
                  <div className="flex items-center relative">
                     <div className="flex items-center ms-3">
                        <div onClick={() => { setUserMenuOpen(!isUserMenuOpen) }}>
                           <button type="button" className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600 border-1 border-border-light-primary dark:border-border-light-primary outline-2 outline-yellow-600" aria-expanded="false" data-dropdown-toggle="dropdown-user">
                              <span className="sr-only">Open user menu</span>
                              
                              {
                                 profileImgUrl && profileImgUrl !== "" ? (
                                    <img className="w-8 h-8 rounded-full" src={profileImgUrl} alt="user photo" />
                                 ) : (
                                    <FaUser size={40} className="rounded-full border border-border-light-primary dark:border-border-dark-primary text-gray-500"/> 
                                 )
                              }
                           </button>
                        </div>

                        {
                           plan === PlanType.PLUS && (
                              <div className="absolute top-1/2 left-7 z-50">
                                 <FaGem size={25} className="text-yellow-500  ms-2" title="Plus Plan" />
                              </div>
                           )
                        }
                        
                        {
                           isUserMenuOpen && (
                              <div className="absolute top-12 right-0 z-50 my-4 text-base list-none bg-surface divide-y divide-border-main rounded-sm shadow-2xl border border-border-main" id="dropdown-user">
                                 <div className="px-4 py-3" role="none">
                                    <p className="text-sm text-text-main font-bold" role="none">
                                       {username}
                                    </p>
                                    <p className="text-sm font-medium text-gray-500 truncate" role="none">
                                       {email}
                                    </p>
                                 </div>
                                 <ul className="py-1" role="none">
                                    <li>
                                       <button 
                                          onClick={() => { navigate(`/user-portal/${spacetype}/${spaceid}/${UserPortalView.SETTINGS_PROFILE}`); setUserMenuOpen(false); }}
                                          className="block w-full text-left px-4 py-2 text-sm text-text-light-primary hover:bg-gray-100 dark:text-text-dark-primary dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem"
                                       >
                                          Profile Settings
                                       </button>
                                    </li>
                                    <li>
                                       <button 
                                          onClick={() => { navigate(`/user-portal/${spacetype}/${spaceid}/${UserPortalView.SETTINGS_BILLING}`); setUserMenuOpen(false); }}
                                          className="block w-full text-left px-4 py-2 text-sm text-text-light-primary hover:bg-gray-100 dark:text-text-dark-primary dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem"
                                       >
                                          Billing & Subscription
                                       </button>
                                    </li>
                                    <li>
                                       <button 
                                          onClick={() => { /* Add logout logic here */ setUserMenuOpen(false); }}
                                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem"
                                       >
                                          Log out
                                       </button>
                                    </li>
                                 </ul>
                              </div>
                           )
                        }
                     </div>
                  </div>
               </div>
            </div>
         </nav>
         {
            upgradeMessage != "" && <Upgrade setUpgradeMode={setUpgradeMessage} message={upgradeMessage} />
         }
      </>
   )
}

export default NavBar;
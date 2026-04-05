import { useState } from "react"
import SideBarItem from "./SideBarItem";

function SidebarDropdownItem({ name, Icon, children }: { name: string, Icon?: React.ElementType, children: React.ReactNode }) {

   const [isDropDownOpen, setDropDownOpen] = useState(false);

   return (
      <li className={isDropDownOpen ? "bg-bg-light-secondary dark:bg-bg-dark-secondary": ""}>
         <button 
            type="button" 
            className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg grouphover:bg-hover-light-primary dark:hover:bg-hover-dark-primary dark:text-white cursor-pointer" 
            onClick={() => setDropDownOpen(!isDropDownOpen)}
         >
            {Icon && <Icon/>}
            <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap capitalize">{name}</span>
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
               <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
            </svg>
         </button>
         {
            isDropDownOpen && (
               <ul className="py-2 space-y-2">
                  <>{children}</>
               </ul>
            )
         }
      </li>
   )
}

export default SidebarDropdownItem
import { FaLock } from "react-icons/fa";

function SideBarItem({ name, pc, onClick, isActive, Icon, isLocked, count }: { 
   name: string, 
   pc?: number, 
   onClick?: (newView: string) => void, 
   isActive: boolean, 
   Icon?: React.ElementType,
   isLocked?: boolean,
   count?: number
}) {
   return (
      <li 
         className="mb-3 relative group" 
         onClick={() => onClick && onClick(name)}
      >
         <a href="#" className={`flex items-center p-2 text-text-light-primary rounded-lg dark:text-text-dark-primary group transition ${isActive ? "bg-primary" : ""} ${isActive ? "" : Icon ? "hover:bg-hover-light-primary dark:hover:bg-hover-dark-primary" : "hover:bg-bg-light-primary dark:hover:bg-bg-dark-primary"} ${isLocked ? "opacity-80" : ""}`}>
            {Icon && <Icon />}
            <span className={`flex-1 ms-3 capitalize ${Icon ? "" : "pl-7"}`}>{name}</span>
            {
               isLocked && (
                  <FaLock className="text-secondary ml-2 w-3 h-3" />
               )
            }
            {
               count !== undefined && count > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                     {count > 99 ? '99+' : count}
                  </span>
               )
            }
            {
               pc && <span className="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-text-light-primary bg-primary rounded-full dark:bg-primary dark:text-text-dark-primary">3</span>
            }
         </a>
      </li>
   )
}

export default SideBarItem;
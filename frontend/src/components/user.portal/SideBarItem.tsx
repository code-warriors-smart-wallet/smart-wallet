function SideBarItem({ name, pc, onClick, isActive, Icon }: { name: string, pc?: number, onClick?: (newView: string) => void, isActive: boolean, Icon?: React.ElementType }) {
   return (
      <li 
         className="mb-3" 
         onClick={() => onClick(name)}
      >
         <a href="#" className={`flex items-center p-2 text-text-light-primary dark:text-text-dark-primary group transition ${isActive ? "app-sidebar-active" : "rounded-lg"} ${isActive ? "" : Icon ? "hover:bg-hover-light-primary dark:hover:bg-hover-dark-primary" : "hover:bg-bg-light-primary dark:hover:bg-bg-dark-primary"}`}>
            {Icon && <Icon />}
            <span className={`flex-1 ms-3 capitalize ${Icon ? "" : "pl-7"}`}>{name}</span>
            {
               (pc !== undefined && pc > 0) && <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 ms-3 text-xs font-bold text-white bg-red-500 rounded-full">{pc > 99 ? '99+' : pc}</span>
            }
         </a>
      </li>
   )
}

export default SideBarItem;
import { useEffect, useRef, useState } from "react"

interface DropDownProps {
    title: string
    titleIcon?: React.ReactNode
    headerTexts?: string[]
    dropdownItems: string[]
    dropdownIcons?: React.ReactNode[]
    lastItem?: string
    lastIcon?: React.ReactNode
    onClick: (text: string) => void
}

function DropDown({ title, titleIcon, headerTexts, dropdownItems, dropdownIcons, lastItem, lastIcon, onClick }: DropDownProps) {
    const [dropdowntoggle, setDropdowntoggle] = useState(false)
    const dropdownBtnRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownBtnRef.current && !dropdownBtnRef.current.contains(event.target as Node)) {
                console.log(1)
                setDropdowntoggle(false) 
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const onSelect = (text: string) => {
        setDropdowntoggle(false);
        onClick(text)
    }

    return (
        <div className="relative *:text-text-light-primary dark:text-text-dark-primary w-full">
            <button id="dropdownInformationButton" data-dropdown-toggle="dropdownInformation"
                onClick={() => setDropdowntoggle(true)}
                className="mr-3 py-2 px-3 border-2 border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm text-center inline-flex gap-3 items-center capitalize" type="button">
                    {titleIcon && titleIcon}
                    {title}
                    <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                </svg>
            </button>

            {
                dropdowntoggle && (
                    <div id="dropdownInformation" ref={dropdownBtnRef} className="absolute top-full mt-2 left-0 z-50 divide-y divide-border-light-primary dark:divide-border-dark-primary border border-border-light-primary dark:border-border-dark-primary rounded-xl shadow-2xl w-64 bg-bg-light-primary dark:bg-bg-dark-primary overflow-hidden">
                        {
                            headerTexts && headerTexts?.length > 0 && (
                                <div className="px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/50">
                                    {
                                        headerTexts.map(text => {
                                            return (
                                                <div key={text} className="capitalize font-bold">{text}</div>
                                            )
                                        })
                                    }
                                </div>
                            )
                        }
                        <ul className="py-2 text-sm text-gray-700 dark:text-gray-200 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20" aria-labelledby="dropdownInformationButton">
                            {
                                dropdownItems.map((item, index) => {
                                    return (
                                        <li key={item} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white capitalize cursor-pointer" onClick={() => onSelect(item)}>
                                            {dropdownIcons && dropdownIcons.length === dropdownItems.length && dropdownIcons[index]}
                                            {item}
                                        </li>
                                    )
                                })
                            }
                        </ul>

                        {
                            lastItem && (
                                <div className="py-2" onClick={() => onSelect(lastItem)}>
                                    <span className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white capitalize cursor-pointer">
                                        {lastIcon && lastIcon}
                                        {lastItem}
                                    </span>
                                </div>
                            )
                        }
                    </div>
                )
            }

        </div>

    )
}

export default DropDown;
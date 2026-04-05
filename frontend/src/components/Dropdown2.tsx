import { useEffect, useRef, useState } from "react"

interface DropDownProps {
    title: string
    headerTexts?: string[]
    dropdownItems: string[]
    lastItem?: string
    onClick: (text: string) => void
}

function DropDown({ title, headerTexts, dropdownItems, lastItem, onClick }: DropDownProps) {
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
                className="mr-3 py-2 px-3 border-2 border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm text-center inline-flex items-center capitalize" type="button">{title}<svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                </svg>
            </button>

            {
                dropdowntoggle && (
                    <div id="dropdownInformation" ref={dropdownBtnRef} className="absolute top-full mt-2 right-0 z-10 divide-y divide-border-light-primary dark:divide-border-dark-primary border-1 border-border-light-primary dark:border-border-dark-primary  rounded-lg shadow-sm w-44 bg-bg-light-primary dark:bg-bg-dark-primary">
                        {
                            headerTexts && headerTexts?.length > 0 && (
                                <div className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    {
                                        headerTexts.map(text => {
                                            return (
                                                <div className="capitalize">{text}</div>
                                            )
                                        })
                                    }
                                </div>
                            )
                        }
                        <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownInformationButton">
                            {
                                dropdownItems.map(item => {
                                    return (
                                        <li key={item} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white capitalize cursor-pointer" onClick={() => onSelect(item)}>
                                            {item}
                                        </li>
                                    )
                                })
                            }
                        </ul>

                        {
                            lastItem && (
                                <div className="py-2" onClick={() => onSelect(lastItem)}>
                                    <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white capitalize cursor-pointer">{lastItem}</span>
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
import { useState, useMemo, useEffect, useRef } from "react";
import { FaCheck } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store/store";
import { TransactionType, transactionTypesInfo } from "./views/Transactions";
import { CategoryService } from "../../services/category.service";
import { CategoryInfo } from "../../interfaces/modals";
import { useParams } from "react-router-dom";
import { capitalize, toStrdSpaceType } from "../../utils/utils";
import { SpaceType } from "./views/Spaces";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { UserPortalView } from "./SideBar";
import { TransactionService } from "../../services/transaction.service";
import { setLoading, setPage } from "../../redux/features/transaction";


type FilterKey =
    | "Space"
    | "Type"
    | "Mcategory"
    | "Scategory"
    | "FromDate"
    | "ToDate"
    | "Keyword"
    | "SortBy";

const FILTER_CONFIG: Record<
    FilterKey,
    { title: string; }
> = {
    Space: { title: "Space" },
    Type: { title: "Type" },
    Mcategory: { title: "Main category" },
    Scategory: { title: "Sub category" },
    FromDate: { title: "From date" },
    ToDate: { title: "To date" },
    Keyword: { title: "Keyword" },
    SortBy: {title: "Sort by"}
};

type FilterValue = {
    label: string;
    value: string; // this is the ID
};

type SuggestionItem = {
    label: string;
    value: string;
};

function SearchInput({ view }: { view: string }) {

    const { spacetype, spaceid } = useParams()
    const inputRef = useRef<HTMLInputElement>(null);

    const { spaces } = useSelector((state: RootState) => state.auth);

    // Input text
    const [input, setInput] = useState("");

    // Active filters stored dynamically
    const [activeFilters, setActiveFilters] = useState<
        Partial<Record<FilterKey, FilterValue>>
    >({});

    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [suggestionInput, setSuggestionInput] = useState("");

    const categoryService = CategoryService();
    const { getCategories } = categoryService;
    const [categories, setCategories] = useState<CategoryInfo[]>([])

    const [availableFilters, setAvailableFilter] = useState({});

    const [showDatePicker, setShowDatePicker] = useState<{
        key: "FromDate" | "ToDate" | null;
    }>({ key: null });

    const [showFilters, setShowFilters] = useState(false);
    const containerRef = useRef<HTMLUListElement>(null);

    const { searchTransactions, pageLimit } = TransactionService();
    const { page } = useSelector((state: RootState) => state.transaction)
    const dispatch = useDispatch();

    // --------------------------
    // Helpers
    // --------------------------

    const parseInput = (value: string) => {
        const tokens = value.trim().split(" ").filter(Boolean);
        const parsed: Partial<Record<FilterKey, FilterValue>> = {};

        let keywordValid: string = "";
        tokens.forEach((token) => {
            if (!token.includes(":")) {
                keywordValid = token
                return
            };

            const [key, val] = token.split(":");

            if (key in FILTER_CONFIG && val) {
                const suggestions = getSuggestions(key)

                if (!suggestions || typeof suggestions === 'string') {
                    parsed[key as FilterKey] = {
                        label: val,
                        value: val
                    }
                } else {
                    parsed[key as FilterKey] = {
                        label: val,
                        value: suggestions.find(s => s.label === val.split("+").join(" "))?.value || ""
                    };
                }
            }
        });

        if (keywordValid.length > 0) {
            parsed['Keyword'] = {
                label: keywordValid,
                value: keywordValid,
            };
        }

        return parsed;
    };

    const getLastToken = (value: string) => {
        const tokens = value.trim().split(" ");
        return tokens[tokens.length - 1];
    };

    const loadSuggestions = (key: FilterKey) => {
        const suggestions = getSuggestions(key);
        if (!suggestions || typeof suggestions === 'string') {
            return;
        }
        setSuggestions(suggestions)
    };

    const getSuggestions = (key: string) => {
        if (key === "Space") {
            return spaces.map((sp) => ({
                label: sp.name,
                value: sp.id, // IMPORTANT
            }));
        } else if (key === "Type") {

            if (spacetype !== "all") {
                const transactionTypes = transactionTypesInfo.find(info => info.spaceType === spacetype?.toUpperCase().split("-").join("_"))?.transactionTypes.map(ttt => ttt.type) || []
                return transactionTypes.map(t => ({
                    label: capitalize(t.toLowerCase().split("_").join(" ")),
                    value: t
                }));
            } else {
                const selectedSpaceId = activeFilters.Space?.value;
                const selectedSpaceType = spaces.find(sp => sp.id == selectedSpaceId)?.type;

                if (selectedSpaceType) {
                    const transactionTypes = transactionTypesInfo.find(info => info.spaceType === selectedSpaceType?.toUpperCase().split("-").join("_"))?.transactionTypes.map(ttt => ttt.type) || []
                    return transactionTypes.map(t => ({
                        label: capitalize(t.toLowerCase().split("_").join(" ")),
                        value: t
                    }));
                } else {
                    return Object.values(TransactionType).map(t => ({
                        label: capitalize(t.toLowerCase().split("_").join(" ")),
                        value: t
                    }));
                }

            }
        } else if (key === "Mcategory") {

            let categories2 = []
            if (spacetype !== "all") {
                const transactionTypes = transactionTypesInfo.find(info => info.spaceType === spacetype?.toUpperCase().split("-").join("_"))?.transactionTypes.map(ttt => ttt.type) || []
                categories2 = categories.filter(cat => cat.transactionTypes.some(tt => transactionTypes.includes(tt as TransactionType)));
            } else {
                const selectedSpaceId = activeFilters.Space?.value;
                const selectedSpaceType = spaces.find(sp => sp.id == selectedSpaceId)?.type;

                if (selectedSpaceType) {
                    const transactionTypes = transactionTypesInfo.find(info => info.spaceType === selectedSpaceType?.toUpperCase().split("-").join("_"))?.transactionTypes.map(ttt => ttt.type) || []
                    categories2 = categories.filter(cat => cat.transactionTypes.some(tt => transactionTypes.includes(tt as TransactionType)));
                } else {
                    categories2 = categories
                }

            }
            const uniqueCategories = Array.from(
                new Map(
                    categories2?.map(c => [
                        c.parentCategoryId,
                        {
                            label: c.parentCategory,
                            value: c.parentCategoryId
                        }
                    ])
                ).values()
            );

            return uniqueCategories;
        } else if (key === "Scategory") {
            let categories2 = []
            if (spacetype !== "all") {
                const transactionTypes = transactionTypesInfo.find(info => info.spaceType === spacetype?.toUpperCase().split("-").join("_"))?.transactionTypes.map(ttt => ttt.type) || []
                categories2 = categories.filter(cat => cat.transactionTypes.some(tt => transactionTypes.includes(tt as TransactionType)));
            } else {
                const selectedSpaceId = activeFilters.Space?.value;
                const selectedSpaceType = spaces.find(sp => sp.id == selectedSpaceId)?.type;

                if (selectedSpaceType) {
                    const transactionTypes = transactionTypesInfo.find(info => info.spaceType === selectedSpaceType?.toUpperCase().split("-").join("_"))?.transactionTypes.map(ttt => ttt.type) || []
                    categories2 = categories.filter(cat => cat.transactionTypes.some(tt => transactionTypes.includes(tt as TransactionType)));
                } else {
                    categories2 = categories
                }

            }

            const uniqueCategories = Array.from(
                new Map(
                    categories2?.map(c => [
                        c.subCategoryId,
                        {
                            label: c.subCategoryName,
                            value: c.subCategoryId
                        }
                    ])
                ).values()
            );

            return uniqueCategories;
        } else if (key === "FromDate" || key === "ToDate") {
            setShowDatePicker({ key });
            return key
        } else if (key === "SortBy") {
            return [
                {label: "Lowest Amount", value: "AA"},
                {label: "Highest Amount", value: "AD"},
                {label: "Oldest Transactions", value: "DA"},
                {label: "Newest Transactions", value: "DD"},
            ]
        } else {
            setShowDatePicker({ key: null });
            return null;
        }
    }

    // --------------------------
    // Input Change
    // --------------------------

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);

        const parsed = parseInput(value);
        setActiveFilters(parsed);

        const lastToken = getLastToken(value);

        if (lastToken?.includes(":")) {
            const [key, val] = lastToken.split(":");

            if (key in FILTER_CONFIG) {
                loadSuggestions(key as FilterKey);
                setSuggestionInput(val || "");
                return;
            }
        }

        setSuggestions([]);
        setShowDatePicker({ key: null })
        setSuggestionInput("");
    };

    // --------------------------
    // Click Filter Chip
    // --------------------------

    const onClickFilterItem = (key: FilterKey) => {
        if (key === "FromDate" || key === "ToDate") {
            setShowDatePicker({ key });
        }
        if (activeFilters[key]) {
            // Remove filter
            const newFilters = { ...activeFilters };
            delete newFilters[key];
            setActiveFilters(newFilters);

            const tokens = input
                .split(" ")
                .filter((t) => !t.startsWith(`${key}:`));

            setInput(tokens.join(" "));
            return;
        }

        // Add new filter
        setInput((prev) => (prev ? `${prev} ${key}:` : `${key}:`));
        loadSuggestions(key);

        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);

    };

    // --------------------------
    // Click Suggestion
    // --------------------------

    const onClickSuggestionItem = (item: SuggestionItem) => {
        const tokens = input.trim().split(" ");
        const lastToken = tokens[tokens.length - 1];

        if (!lastToken.includes(":")) return;

        const [key] = lastToken.split(":");

        const newTokens = [
            ...tokens.slice(0, -1),
            `${key}:${item.label.split(" ").join("+")}`,
        ];

        const newInput = newTokens.join(" ") + " ";

        setInput(newInput);

        setActiveFilters((prev) => ({
            ...prev,
            [key as FilterKey]: {
                label: item.label,
                value: item.value, // ← ID stored here
            },
        }));

        setSuggestions([]);
        setSuggestionInput("");

        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);

    };

    const handleDateSelect = (date: Date) => {
        if (!showDatePicker.key) return;

        const formatted = date.toISOString().split("T")[0]; // YYYY-MM-DD

        setActiveFilters((prev) => ({
            ...prev,
            [showDatePicker.key!]: {
                label: formatted,
                value: formatted,
            },
        }));

        // Update input string
        const tokens = input
            .split(" ")
            .filter((t) => !t.startsWith(`${showDatePicker.key}:`));

        const newInput = [
            ...tokens,
            `${showDatePicker.key}:${formatted}`,
        ].join(" ");

        setInput(newInput + " ");
        setShowDatePicker({ key: null });

        // refocus input
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    // --------------------------
    // Derived
    // --------------------------

    const filteredSuggestions = useMemo(() => {
        return suggestions.filter((s) =>
            s.label.toLowerCase().includes(suggestionInput.toLowerCase())
        );
    }, [suggestions, suggestionInput]);

    const getAvailableFilters = () => {
        console.log(view, UserPortalView.TRANSACTIONS)
        if (view !== UserPortalView.TRANSACTIONS) {
            setAvailableFilter({});
            return;
        }

        const currentSpaceType = toStrdSpaceType(spacetype) as SpaceType;

        const filters = Object.fromEntries(
            Object.entries(FILTER_CONFIG).filter(([key]) => {
                if (spaceid !== "all" && key === "space") return false;

                if (
                    [SpaceType.LOAN_BORROWED, SpaceType.CREDIT_CARD].includes(
                        currentSpaceType
                    ) &&
                    key === "mcategory"
                )
                    return false;

                return true;
            })
        ) as Partial<typeof FILTER_CONFIG>;

        setAvailableFilter(filters)
    };

    function handleSearch() {
        setSuggestions([])
        setShowDatePicker({ key: null })
        setShowFilters(false)
        console.log(activeFilters)
        if (view === UserPortalView.TRANSACTIONS) {
            dispatch(setLoading({loading: true}))
            searchTransactions({
                space: activeFilters.Space?.value,
                type: activeFilters.Type?.value,
                mcategory: activeFilters.Mcategory?.value,
                scategory: activeFilters.Scategory?.value,
                fromDate: activeFilters.FromDate?.value,
                toDate: activeFilters.ToDate?.value,
                spaceid: spaceid,
                skip: (page - 1) * pageLimit,
                limit: pageLimit,
                keyword: activeFilters.Keyword?.value,
                sortBy: activeFilters.SortBy?.value
            })
                .finally(() => {
                    dispatch(setLoading({loading: false}))
                });
        }
    }

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await getCategories();
                setCategories(res);
            } catch {
                setCategories([]);
            }
        };

        loadCategories();
        setInput("")
        setActiveFilters({})
    }, [spaceid]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        getAvailableFilters()
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [view]);

    // --------------------------
    // Render
    // --------------------------

    if (Object.entries(availableFilters).length === 0) return <div className="flex-1 relative"></div>

    return (
        <div className="flex-1 relative">
            <div className="absolute -top-5 left-0 w-full">
                <input
                    type="search"
                    ref={inputRef}
                    onClick={() => setShowFilters(true)}
                    className="bg-bg-light-primary dark:bg-bg-dark-primary w-full p-2 rounded-t border-2 border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary outline-none focus:border-primary focus:bg-transparent text-sm"
                    placeholder={`Search ${view}`}
                    value={input}
                    onChange={onInputChange}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault(); // optional, prevents form submit if inside a form
                            handleSearch();     // call your search function
                        }
                    }}
                />

                {/* Filter Chips */}
                {showFilters && (filteredSuggestions.length === 0 && !showDatePicker.key) && (
                    <ul ref={containerRef} className="bg-light-primary dark:bg-bg-dark-primary w-full p-2 rounded-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary outline-none focus:border-primary focus:bg-transparent text-sm flex flex-wrap gap-2 shadow-md shadow-gray-100/20">
                        {availableFilters && (
                            Object.keys(availableFilters) as FilterKey[]
                        ).map((key) => {
                            const active = key in activeFilters;

                            return (
                                <li
                                    key={key}
                                    onClick={() => onClickFilterItem(key)}
                                    className={`flex items-center gap-2 p-2 w-fit rounded border border-border-light-primary dark:border-border-dark-primary text-sm cursor-pointer ${active ? "bg-primary" : "hover:bg-hover-light-primary hover:dark:bg-hover-dark-primary"}`}
                                >
                                    {active && <FaCheck />}
                                    {FILTER_CONFIG[key].title}
                                </li>
                            );
                        })}
                    </ul>
                )}

                {/* Suggestions */}
                {filteredSuggestions.length > 0 && (
                    <ul className="max-h-48 overflow-scroll bg-bg-light-primary dark:bg-bg-dark-primary w-full rounded-b border-2 border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary outline-none focus:border-primary focus:bg-transparent text-sm shadow-md shadow-gray-100/20">
                        {filteredSuggestions.map((sug) => (
                            <li
                                key={sug.value}
                                onClick={() => onClickSuggestionItem(sug)}
                                className="flex items-center gap-2 p-2 w-full border border-border-light-primary dark:border-border-dark-primary text-sm cursor-pointer hover:bg-hover-light-primary hover:dark:bg-hover-dark-primary"
                            >
                                {sug.label}
                            </li>
                        ))}
                    </ul>
                )}

                {showDatePicker.key && (
                    <div className="absolute z-50 mt-2">
                        <DatePicker
                            selected={null}
                            onChange={(date: any) => handleDateSelect(date as Date)}
                            inline
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchInput;
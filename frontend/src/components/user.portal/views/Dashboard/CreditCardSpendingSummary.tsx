import { FaChartPie } from "react-icons/fa";
import Input from "../../../Input";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import Button from "../../../Button";
import { VictoryLine, VictoryPie, VictoryTheme, VictoryChart, VictoryAxis } from "victory";
import { generateRandomColor } from "../../../../utils/utils";

interface SpendingSummaryProps {
    summary: any,
    currency: string,
    startDate: string,
    endDate: string,
    setstartDate: Dispatch<SetStateAction<string>>,
    setendDate: Dispatch<SetStateAction<string>>,
    onDateRangeChange: (start: string, end: string) => void,
    filterType: SpendingSummaryFilterOptions,
    setFilterType: Dispatch<SetStateAction<SpendingSummaryFilterOptions>>,
    username?: string
}

export enum SpendingSummaryFilterOptions {
    THIS_MONTH = "THIS_MONTH", TODAY = "TODAY", YESTERDAY = "YESTERDAY", THIS_WEEK = "THIS_WEEK", THIS_YEAR = "THIS_YEAR", CUSTOM = "CUSTOM"
}

function CreditCardSpendingSummary({
    summary,
    currency,
    startDate,
    endDate,
    setstartDate,
    setendDate,
    onDateRangeChange,
    filterType,
    setFilterType,
    username }: SpendingSummaryProps) {

    const [selectedPCategory, setselectedPCategory] = useState("");
    const chartRef = useRef<HTMLDivElement>(null)

    const spendingByPCategory = summary?.spendingSummary?.spendingByPCategory;
    const spendingbySCategory = summary?.spendingSummary?.spendingByCategory?.filter((cat: any) => {
        return cat.parentCategory?.includes(selectedPCategory)
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (chartRef.current && !chartRef.current.contains(event.target as Node)) {
                setselectedPCategory("") // reset selection
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    console.log(filterType == SpendingSummaryFilterOptions.CUSTOM)

    return (
        <section className="rounded my-3 py-2 px-3 border border-border-light-primary dark:border-border-dark-primary *:text-text-light-primary *:dark:text-text-dark-primary">
            {/* title */}
            <div className="rounded flex justify-between items-center">
                <span className="flex gap-3 items-center text-xl font-bold"><FaChartPie />Spending summary</span>
                <div className="flex items-center">
                    <select
                        className="w-full mr-3 py-2 px-3 border-2 border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                        name="type"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as SpendingSummaryFilterOptions)}
                    >
                        {
                            Object.keys(SpendingSummaryFilterOptions).map(val => {
                                return <option value={val} className="capitalize">{String(val).split("_").join(" ")}</option>
                            })
                        }
                    </select>
                    <label className="text-text-light-primary dark:text-text-dark-primary mr-2">From:</label>
                    <Input
                        name="date"
                        type="date"
                        placeholder="Enter amount"
                        value={startDate}
                        onChange={(e) => setstartDate(e.target.value)}
                        className={`pt-2 pb-2 py-1 mt-0 mb-0 mr-3 ${filterType != SpendingSummaryFilterOptions.CUSTOM ? "opacity-70 pointer-events-none" : "opacity-100 pointer-events-auto"}`}
                    />
                    <label className="text-text-light-primary dark:text-text-dark-primary mr-2">To:</label>
                    <Input
                        name="date"
                        type="date"
                        placeholder="Enter amount"
                        value={endDate}
                        id="toDate"
                        onChange={(e) => setendDate(e.target.value)}
                        className={`pt-2 pb-2 py-1 mt-0 mb-0 mr-3 ${filterType != SpendingSummaryFilterOptions.CUSTOM ? "opacity-70 pointer-events-none" : "opacity-100 pointer-events-auto"}`}
                    />
                    <Button
                        text="Apply"
                        className={`max-w-fit pt-2 pb-2 ${filterType != SpendingSummaryFilterOptions.CUSTOM ? "opacity-70 pointer-events-none" : "opacity-100 pointer-events-auto"}`}
                        onClick={() => onDateRangeChange(startDate, endDate)}
                    />
                </div>
            </div>

            {/* expense charts */}
            <div className="flex gap-3 *:flex-1 flex-wrap">
                <div className="p-2 border border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1>Spending by main category</h1>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <svg
                            viewBox="0 0 200 300"
                            style={{ width: '100%', maxWidth: 200 }}
                            ref={chartRef}
                        >
                            <VictoryPie
                                standalone={false}
                                width={200}
                                height={300}
                                innerRadius={60}
                                colorScale={spendingByPCategory?.map((c: any) => c.color)}
                                labels={() => null}
                                data={spendingByPCategory}
                                theme={VictoryTheme.clean}
                                radius={({ datum }) =>
                                    datum.parentCategory === selectedPCategory ? 100 : 90
                                }
                                events={[
                                    {
                                        target: "data",
                                        eventHandlers: {
                                            onClick: (_, props) => {
                                                const categoryName = props.datum.parentCategory
                                                setselectedPCategory(categoryName)
                                                return null
                                            }
                                        }
                                    }
                                ]}
                            />
                        </svg>
                        <div>
                            {
                                spendingByPCategory?.filter((cat: any) => cat.parentCategory?.includes(selectedPCategory))?.map((cat: any) => {
                                    return (
                                        <div className="flex gap-2 items-center">
                                            <span style={{ backgroundColor: cat.color }} className="w-3 h-3">
                                            </span>
                                            <span className="capitalize">{cat.parentCategory} <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">- {currency}. {cat.y}</span></span>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
                <div className="p-2 border border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1>Spending by sub Category</h1>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <svg
                            viewBox="0 0 200 300"
                            style={{ width: '100%', maxWidth: 200 }}
                        >
                            <VictoryPie
                                standalone={false}
                                radius={90}
                                width={200}
                                height={300}
                                innerRadius={60}
                                labels={() => null}
                                colorScale={spendingbySCategory?.map((c: any) => c.color)}
                                data={spendingbySCategory}
                                theme={VictoryTheme.clean}
                            />
                        </svg>
                        <div>
                            {
                                spendingbySCategory?.map((cat: any) => {
                                    return (
                                        <div className="flex gap-2 items-center">
                                            <span style={{ backgroundColor: cat.color }} className="w-3 h-3">
                                            </span>
                                            <span className="capitalize">{cat.subCategory} <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">- {currency}. {cat.y}</span></span>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* income charts */}
            {/* <div className="flex gap-3 *:flex-1 flex-wrap">

                <div className="p-2 border border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1>Income by Category</h1>
                    {
                        moneyIn == 0 && <div className="w-full h-full grid place-items-center text-sm text-text-light-secondary dark:text-text-dark-secondary">No records found.</div>
                    }
                    <div className="flex items-center justify-center gap-3">
                        <svg
                            width={200}
                            height={300}
                        >
                            <VictoryPie
                                standalone={false}
                                radius={90}
                                width={200}
                                height={300}
                                innerRadius={60}
                                labels={() => null}
                                colorScale={incomeByCategory?.map((c: any) => c.color)}
                                data={incomeByCategory}
                                theme={VictoryTheme.clean}
                            />
                        </svg>
                        <div>
                            {
                                incomeByCategory?.map((cat: any) => {
                                    return (
                                        <div className="flex gap-2 items-center">
                                            <span style={{ backgroundColor: cat.color }} className="w-3 h-3">
                                            </span>
                                            <span className="capitalize">{cat.subCategory}  <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">- {currency}. {cat.y}</span></span>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
                <div className="p-2 border border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1>Cash flow trend</h1>
                    {
                        moneyIn == 0 && moneyOut == 0 ? (
                            <div className="w-full h-full grid place-items-center text-sm text-text-light-secondary dark:text-text-dark-secondary">No records found.</div>
                        ) : (
                            <VictoryChart
                                theme={VictoryTheme.material}
                                domainPadding={0}
                                height={200}
                                width={400}
                            >
                                <VictoryAxis
                                    style={{
                                        axis: { stroke: "#333" },
                                        tickLabels: { fill: "#e9e9e9ff", fontSize: 8, angle: -60 },
                                        axisLabel: { padding: 0 },
                                        grid: { stroke: "#444", strokeWidth: 1, strokeDasharray: "4,4" }
                                    }}
                                />
                                <VictoryAxis
                                    dependentAxis
                                    style={{
                                        axis: { stroke: "#333" },
                                        tickLabels: { fill: "#ecececff", fontSize: 8 },
                                        axisLabel: { padding: 0 },
                                        grid: { stroke: "#444", strokeWidth: 1, strokeDasharray: "4,4" }
                                    }}
                                />

                                <VictoryLine
                                    data={spendingSummary?.monthlyIncome}
                                    style={{ data: { stroke: "#46e570ff" } }}
                                />

                                <VictoryLine
                                    data={spendingSummary?.monthlyExpense}
                                    style={{ data: { stroke: "#f5220bff" } }}
                                />
                            </VictoryChart>
                        )
                    }

                </div>

            </div> */}

        </section >
    )
}

export default CreditCardSpendingSummary;
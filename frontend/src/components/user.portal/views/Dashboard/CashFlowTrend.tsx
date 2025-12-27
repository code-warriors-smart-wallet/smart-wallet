import { FaChartLine } from "react-icons/fa";
import { VictoryLine, VictoryTheme, VictoryChart, VictoryAxis } from "victory";

function CashFlowTrend({ spendingSummary }: { spendingSummary: any }) {
    const moneyIn = spendingSummary.moneyIn?.length > 0 ? spendingSummary?.moneyIn[0].totalAmount.$numberDecimal : 0.0;
    const moneyOut = spendingSummary.moneyOut?.length > 0 ? spendingSummary?.moneyOut[0].totalAmount.$numberDecimal : 0.0;

    const monthlySavings = spendingSummary?.monthlyIncome?.map((info: { x: any; y: number; }, index: number) => {
        return {x: info?.x, y: info?.y-spendingSummary?.monthlyExpense[index]?.y}
    })

    return (
        <section className="rounded my-3 p-3 border border-border-light-primary dark:border-border-dark-primary *:text-text-light-primary *:dark:text-text-dark-primary">
            {/* title */}
            <div className="rounded flex justify-between items-center ">
                <span className="flex gap-3 items-center text-xl font-bold"><FaChartLine />Cash flow trend</span>
            </div>

            {/* charts */}
            <div className="flex gap-3 *:flex-1 flex-wrap">
                <div className="p-2 border border-border-light-primary dark:border-border-dark-primary mt-3">
                    {/* <h1>Monthly Expense vs Income vs Savings</h1> */}
                    {
                        monthlySavings.filter((rec: { y: number; }) => rec.y === 0).length === 12 ? (
                            <div className="w-full h-full grid place-items-center text-sm text-text-light-secondary dark:text-text-dark-secondary">No records found.</div>
                        ) : (
                            <>
                            <div className="flex justify-center items-center gap-3">
                                    <div className="flex gap-2 items-center">
                                        <span style={{ backgroundColor: "#46e570ff" }} className="w-3 h-3">
                                        </span>
                                        <span className="capitalize">Income</span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span style={{ backgroundColor: "#f5220bff" }} className="w-3 h-3">
                                        </span>
                                        <span className="capitalize">Expense</span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span style={{ backgroundColor: "#6d0bf5ff" }} className="w-3 h-3">
                                        </span>
                                        <span className="capitalize">Savings</span>
                                    </div>
                                </div>
                                <VictoryChart
                                    theme={VictoryTheme.material}
                                    domainPadding={0}
                                    padding={{ top: 10, bottom: 40, left: 40, right: 20 }}
                                    height={150}
                                    width={400}
                                >
                                    <VictoryAxis
                                        style={{
                                            axis: { stroke: "#333" },
                                            tickLabels: { fill: "#e9e9e9ff", fontSize: 5, angle: -60 },
                                            axisLabel: { padding: 0 },
                                            grid: { stroke: "#444", strokeWidth: 1, strokeDasharray: "4,4" }
                                        }}
                                    />
                                    <VictoryAxis
                                        dependentAxis
                                        style={{
                                            axis: { stroke: "#333" },
                                            tickLabels: { fill: "#ecececff", fontSize: 5 },
                                            axisLabel: { padding: 0 },
                                            grid: { stroke: "#444", strokeWidth: 1, strokeDasharray: "4,4" }
                                        }}
                                    />

                                    <VictoryLine
                                        data={spendingSummary?.monthlyIncome}
                                        style={{ data: { stroke: "#46e570ff", strokeWidth: 0.8 } }}
                                    />

                                    <VictoryLine
                                        data={spendingSummary?.monthlyExpense}
                                        style={{ data: { stroke: "#f5220bff", strokeWidth: 0.8 } }}
                                    />
                                    <VictoryLine
                                        data={monthlySavings}
                                        style={{ data: { stroke: "#6d0bf5ff", strokeWidth: 0.8 } }}
                                    />
                                </VictoryChart>
                                
                            </>
                        )
                    }

                </div>

            </div>

        </section >
    )
}

export default CashFlowTrend;
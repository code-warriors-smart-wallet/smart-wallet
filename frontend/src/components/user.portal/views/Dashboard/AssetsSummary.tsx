import { useEffect, useState } from "react";
import { MdSavings } from "react-icons/md";
import { VictoryPie, VictoryTheme } from "victory";
import { SpaceType } from "../Spaces";

function AssetsSummary({ currency, summary }: { currency: string, summary: any }) {

    const [space, setSpace] = useState("");
    const [total, setTotal] = useState<number>(summary.totalCashAssetAmount + summary.totalBankAssetAmount + summary.totalLoanLentAssetAmount);
    const [assetsInfo, setAssetsInfo] = useState([])

    useEffect(() => {
        let spaces: SpaceType[] = [];
        if (space === "") {
            spaces = [SpaceType.CASH, SpaceType.BANK, SpaceType.LOAN_LENT, SpaceType.SAVING_GOAL]
            setTotal(summary.totalCashAssetAmount + summary.totalBankAssetAmount + summary.totalLoanLentAssetAmount)
        } else if (space === SpaceType.CASH) {
            spaces = [SpaceType.CASH]
            setTotal(summary.totalCashAssetAmount)
        } else if (space === SpaceType.BANK) {
            spaces = [SpaceType.BANK]
            setTotal(summary.totalBankAssetAmount)
        } else if (space === SpaceType.LOAN_LENT) {
            spaces = [SpaceType.LOAN_LENT]
            setTotal(summary.totalLoanLentAssetAmount)
        } else if (space === SpaceType.SAVING_GOAL) {
            spaces = [SpaceType.SAVING_GOAL]
            setTotal(summary.totalSavingGoalAssetAmount)
        }
        let assetsInfo = summary.assetsInfo?.filter((info: any) => spaces.includes(info.spaceType))
        assetsInfo = assetsInfo?.map((rec: any, index: any) => ({ ...rec, color: `hsl(${(index / assetsInfo.length) * 360}, 70%, 50%)` }));
        setAssetsInfo(assetsInfo)
    }, [space, summary])

    return (
        <section className="rounded my-3 py-2 px-3 border border-border-light-primary dark:border-border-dark-primary *:text-text-light-primary *:dark:text-text-dark-primary">
            {/* title */}
            <div className="rounded flex justify-between items-center">
                <span className="flex gap-3 items-center text-xl font-bold"><MdSavings />Assets summary</span>
            </div>

            {/* Assets classificaion across spaces chart */}
            <div className="flex gap-3 flex-wrap *:flex-1">
                <div className="flex flex-col gap-3 min-w-1/3 max-w-1/3 mt-3">
                    <div className={`px-3 py-2 border hover:bg-hover-light-primary hover:dark:bg-hover-dark-primary cursor-pointer ${space === "" ? "border-primary bg-hover-light-primary dark:bg-hover-dark-primary" : "border-border-light-primary dark:border-border-dark-primary"}`} onClick={() => setSpace("")}>
                        <h1 className="font-semibold">Total Assets:</h1>
                        <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{summary.totalCashAssetAmount + summary.totalBankAssetAmount + summary.totalLoanLentAssetAmount} {currency}</h2>
                    </div>
                    <div className={`px-3 py-2 border hover:bg-hover-light-primary hover:dark:bg-hover-dark-primary cursor-pointer ${space === SpaceType.CASH ? "border-primary bg-hover-light-primary dark:bg-hover-dark-primary" : "border-border-light-primary dark:border-border-dark-primary"}`} onClick={() => setSpace(SpaceType.CASH)}>
                        <h1 className="font-semibold">Cash Assets:</h1>
                        <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{summary.totalCashAssetAmount} {currency}</h2>
                    </div>
                    <div className={`px-3 py-2 border hover:bg-hover-light-primary hover:dark:bg-hover-dark-primary cursor-pointer ${space === SpaceType.BANK ? "border-primary bg-hover-light-primary dark:bg-hover-dark-primary" : "border-border-light-primary dark:border-border-dark-primary"}`} onClick={() => setSpace(SpaceType.BANK)}>
                        <h1 className="font-semibold">Bank Assets:</h1>
                        <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{summary.totalBankAssetAmount} {currency}</h2>
                    </div>
                    <div className={`px-3 py-2 border hover:bg-hover-light-primary hover:dark:bg-hover-dark-primary cursor-pointer ${space === SpaceType.LOAN_LENT ? "border-primary bg-hover-light-primary dark:bg-hover-dark-primary" : "border-border-light-primary dark:border-border-dark-primary"}`} onClick={() => setSpace(SpaceType.LOAN_LENT)}>
                        <h1 className="font-semibold">Loan Receivables:</h1>
                        <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{summary.totalLoanLentAssetAmount} {currency}</h2>
                    </div>
                    <div className={`px-3 py-2 border hover:bg-hover-light-primary hover:dark:bg-hover-dark-primary cursor-pointer ${space === SpaceType.SAVING_GOAL ? "border-primary bg-hover-light-primary dark:bg-hover-dark-primary" : "border-border-light-primary dark:border-border-dark-primary"}`} onClick={() => setSpace(SpaceType.SAVING_GOAL)}>
                        <h1 className="font-semibold">Saving goals:</h1>
                        <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{summary.totalSavingGoalAssetAmount} {currency}</h2>
                    </div>
                </div>
                <div className="p-2 border border-border-light-primary dark:border-border-dark-primary mt-3">
                    {
                        assetsInfo.length > 0 ? (
                            <div className="flex items-center justify-center gap-3">
                                <svg
                                    width={400}
                                    height={300}
                                // ref={chartRef}
                                >
                                    <VictoryPie
                                        standalone={false}
                                        width={400}
                                        height={300}
                                        innerRadius={60}
                                        colorScale={assetsInfo?.map((c: any, index) => c.color)}
                                        labels={() => null}
                                        style={{
                                            // data: {
                                            //     fillOpacity: 0.9,
                                            //     stroke: "#c43a31",
                                            //     strokeWidth: 3,
                                            // },
                                            labels: {
                                                fontSize: 15,
                                                fill: "#fff",
                                            },
                                        }}
                                        data={assetsInfo}
                                        theme={VictoryTheme.clean}
                                    // radius={({ datum }) =>
                                    //     datum.parentCategory === selectedPCategory ? 100 : 90
                                    // }
                                    // events={[
                                    //     {
                                    //         target: "data",
                                    //         eventHandlers: {
                                    //             onClick: (_, props) => {
                                    //                 const categoryName = props.datum.parentCategory
                                    //                 setselectedPCategory(categoryName)
                                    //                 return null
                                    //             }
                                    //         }
                                    //     }
                                    // ]}
                                    />
                                </svg>
                                <div>
                                    {
                                        assetsInfo?.map((info: any) => {
                                            return (
                                                <div className="flex gap-2 items-center">
                                                    <span style={{ backgroundColor: info.color }} className="w-3 h-3">
                                                    </span>
                                                    <span className="capitalize">{info.x} ({(Number(info.y) / total * 100).toFixed(2)}%)<span className="text-xs text-text-light-secondary dark:text-text-dark-secondary"> - {currency}. {Number(info.y).toFixed(2)}</span></span>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full grid place-items-center text-sm text-text-light-secondary dark:text-text-dark-secondary">No records found.</div>

                        )
                    }
                </div>
            </div>
        </section>
    )

}

export default AssetsSummary;
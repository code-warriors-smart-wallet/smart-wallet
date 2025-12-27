import { MdOutlineRequestQuote } from "react-icons/md";
import { SpaceType } from "../Spaces";
import { useEffect, useState } from "react";
import { VictoryPie, VictoryTheme } from "victory";

function LiabilitiesSummary({ currency, summary }: { currency: string, summary: any }) {
    const [space, setSpace] = useState("");
    const [total, setTotal] = useState<number>(0);
    const [liabilitiesInfo, setAssetsInfo] = useState([])

    useEffect(() => {
        let spaces: SpaceType[] = [];
        if (space === "") {
            spaces = [SpaceType.LOAN_BORROWED, SpaceType.CREDIT_CARD]
            setTotal(summary.totalLoanBorrowedLiabilityAmount + summary.totalCreditcardLiabilityAmount)
        } else if (space === SpaceType.LOAN_BORROWED) {
            spaces = [SpaceType.LOAN_BORROWED]
            setTotal(summary.totalLoanBorrowedLiabilityAmount)
        } else if (space === SpaceType.CREDIT_CARD) {
            spaces = [SpaceType.CREDIT_CARD]
            setTotal(summary.totalCreditcardLiabilityAmount)
        } 
        let assetsInfo = summary.liabilitiesInfo?.filter((info: any) => spaces.includes(info.spaceType))
        assetsInfo = assetsInfo?.map((rec: any, index: any) => ({ ...rec, color: `hsl(${(index / assetsInfo.length) * 360}, 80%, 50%)` }));
        setAssetsInfo(assetsInfo)
    }, [space, summary])

    return (
        <section className="rounded my-3 py-2 px-3 border border-border-light-primary dark:border-border-dark-primary *:text-text-light-primary *:dark:text-text-dark-primary">
            {/* title */}
            <div className="rounded flex justify-between items-center">
                <span className="flex gap-3 items-center text-xl font-bold"><MdOutlineRequestQuote />Liabilities summary</span>
            </div>

            {/* Assets classificaion across spaces chart */}
            <div className="flex gap-3 flex-wrap *:flex-1">
                <div className="flex flex-col *:flex-1 gap-3 min-w-1/3 max-w-1/3 mt-3">
                    <div className={`p-3 border hover:bg-hover-light-primary hover:dark:bg-hover-dark-primary cursor-pointer ${space === "" ? "border-primary bg-hover-light-primary dark:bg-hover-dark-primary" : "border-border-light-primary dark:border-border-dark-primary"}`} onClick={() => setSpace("")}>
                        <h1 className="font-semibold">Total Liabilities:</h1>
                        <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{summary.totalLoanBorrowedLiabilityAmount + summary.totalCreditcardLiabilityAmount} {currency}</h2>
                    </div>
                    <div className={`p-3 border hover:bg-hover-light-primary hover:dark:bg-hover-dark-primary cursor-pointer ${space === SpaceType.CREDIT_CARD ? "border-primary bg-hover-light-primary dark:bg-hover-dark-primary" : "border-border-light-primary dark:border-border-dark-primary"}`} onClick={() => setSpace(SpaceType.CREDIT_CARD)}>
                        <h1 className="font-semibold">Credit card balance:</h1>
                        <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{summary.totalCreditcardLiabilityAmount} {currency}</h2>
                    </div>
                    <div className={`p-3 border hover:bg-hover-light-primary hover:dark:bg-hover-dark-primary cursor-pointer ${space === SpaceType.LOAN_BORROWED ? "border-primary bg-hover-light-primary dark:bg-hover-dark-primary" : "border-border-light-primary dark:border-border-dark-primary"}`} onClick={() => setSpace(SpaceType.LOAN_BORROWED)}>
                        <h1 className="font-semibold">Loan Payables:</h1>
                        <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{summary.totalLoanBorrowedLiabilityAmount} {currency}</h2>
                    </div>
                </div>
                <div className="p-2 border border-border-light-primary dark:border-border-dark-primary mt-3">
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
                                colorScale={liabilitiesInfo?.map((c: any) => c.color)}
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
                                data={liabilitiesInfo}
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
                                liabilitiesInfo?.map((info: any) => {
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
                </div>
            </div>
        </section>
    )

}

export default LiabilitiesSummary;
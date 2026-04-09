import { useParams } from "react-router-dom";
import Button from "../../Button";
import { useEffect, useState } from "react";
import { capitalize, generateRandomColor, getFirstDayOfMonth, getTodayDate, toStrdSpaceType } from "../../../utils/utils";
import Input from "../../Input";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store/store";
import { toast } from "react-toastify";
import { SpaceType } from "./Spaces";
import { ReportInfo, TransactionInfo } from "@/interfaces/modals";
import SpaceSelector from "../SpaceSelector";
import { ReportService } from "../../../services/report.service";
import Loading from "../../../components/Loading";

export enum REPORT {
    ACCOUNT_LEDGER = "ACCOUNT_LEDGER",
    LOAN_LEDGER = "LOAN_LEDGER",
    CREDIT_CARD_LEDGER = "CREDIT_CARD_LEDGER",
    INCOME_VS_EXPENSE_BY_CATEGORY = "INCOME_VS_EXPENSE_BY_CATEGORY",
    BUDGET_UTILIZATION = "BUDGET_UTILIZATION",
    LOAN_REPAYMENT_SUMMARY = "LOAN_REPAYMENT_SUMMARY",
    STATEMENT_OF_FINANCIAL_POSITION = "STATEMENT_OF_FINANCIAL_POSITION",
}

export const reportsInfo = [
    {
        type: REPORT.ACCOUNT_LEDGER,
        spaces: [SpaceType.BANK, SpaceType.CASH, SpaceType.SAVING_GOAL, "ALL"],
    },
    {
        type: REPORT.LOAN_LEDGER,
        spaces: [SpaceType.LOAN_BORROWED, SpaceType.LOAN_LENT,],
    },
    {
        type: REPORT.CREDIT_CARD_LEDGER,
        spaces: [SpaceType.CREDIT_CARD, ],
    },
    {
        type: REPORT.INCOME_VS_EXPENSE_BY_CATEGORY,
        spaces: [SpaceType.BANK, SpaceType.CASH, SpaceType.CREDIT_CARD, "ALL"],
    },
    {
        type: REPORT.BUDGET_UTILIZATION,
        spaces: [SpaceType.BANK, SpaceType.CASH, SpaceType.CREDIT_CARD, "ALL"],
    },
    {
        type: REPORT.LOAN_REPAYMENT_SUMMARY,
        spaces: [SpaceType.LOAN_BORROWED, SpaceType.LOAN_LENT, "ALL"],
    },
    {
        type: REPORT.STATEMENT_OF_FINANCIAL_POSITION,
        spaces: ["ALL"],
    },
]

function Reports() {

    const { spacetype, spaceid } = useParams();
    const activeSpaceType = toStrdSpaceType(spacetype || "");
    const { username, spaces } = useSelector((state: RootState) => state.auth)
    const [inputs, setInputs] = useState<ReportInfo>({
        type: "",
        fromdate: getFirstDayOfMonth(),
        todate: getTodayDate(),
        spaces: [],
        format: "EXCEL",
        isCollaborative: false,
    });
    const [showSelectSpacesModal, setShowSelectSpacesModal] = useState(false);
    const { 
        getTransactionLedger, 
        getLoanLedger, 
        getCreditCardLedger, 
        getIncomeVsExpenseReport,
        getBudgetUtilizationReport,
        getLoanRepaymentSummary,
        getFinancialPositionReport,
        loading 
    } = ReportService();

    const openSelectSpacesModal = () => {
        if (!inputs.type) {
            toast.error("Please select a report type");
            return;
        }
        setShowSelectSpacesModal(true);
    }

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    }

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target as HTMLInputElement;
        if (name === "type") {
            setInputs((prev) => {
                return { 
                    ...prev, 
                    type: value, 
                    spaces: spaceid === "all" ? [] : [spaceid || ""],
                    isCollaborative: spaceid === "all" ? false : spaces.find(space => space.id === spaceid)?.isCollaborative || false
                }
            });
            return;
        }
        setInputs((prev: ReportInfo) => {
            return { ...prev, [name]: value }
        });
    }

    const onSelectSpaces = (selectedSpaces: { _id: string, name: string, type: string }[]) => {
        const selectedSpaceIds = selectedSpaces.map(space => space._id);
        setInputs((prev) => {
            return { ...prev, spaces: selectedSpaceIds, isCollaborative: selectedSpaceIds.length == 1 ? spaces.find(space => space.id === selectedSpaceIds[0])?.isCollaborative || false : false }
        })
    }

    useEffect(() => {
        // when space type or id changes, reset the form
        setInputs({
            type: "",
            fromdate: getFirstDayOfMonth(),
            todate: getTodayDate(),
            spaces: spaceid === "all" ? [] : [spaceid || ""],
            format: "EXCEL",
            isCollaborative: false,
        })
    }, [spaceid, spacetype])

    if (loading) {
        return (
            <Loading />
        )
    }

    return (
        <>
            {/* header */}
            <div className="flex flex-col justify-between ">
                <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary">Export reports</h1>
                <form className="border mt-4 p-3 rounded border-border-light-primary dark:border-border-dark-primary" onSubmit={onSubmit}>
                    {/* type */}
                    <div className="">
                        <label className="text-text-light-primary dark:text-text-dark-primary">Report type:</label>
                        <select
                            className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                            value={inputs.type}
                            name="type"
                            onChange={onInputChange}
                        >
                            <option key={""} value={""}>
                                Select type
                            </option>
                            {
                                reportsInfo.map((report) => {
                                    if (report.spaces.includes(activeSpaceType)) {
                                        return (
                                            <option key={report.type} value={report.type}>
                                                {capitalize(report.type.split("_").join(" "))}
                                            </option>
                                        )
                                    }
                                })
                            }
                        </select>
                    </div>

                    {/* from date */}
                    {
                        [REPORT.ACCOUNT_LEDGER, REPORT.CREDIT_CARD_LEDGER, REPORT.INCOME_VS_EXPENSE_BY_CATEGORY, REPORT.BUDGET_UTILIZATION].includes(inputs.type as any) && (
                            <div className={`my-3`}>
                                <label className="text-text-light-primary dark:text-text-dark-primary">From date:</label>
                                <Input
                                    name="fromdate"
                                    type="date"
                                    placeholder="Enter from date"
                                    value={inputs.fromdate.toString()}
                                    onChange={onInputChange}
                                    className="mt-1 mb-1"
                                />
                            </div>
                        )
                    }

                    {/* to date */}
                    {
                        [REPORT.ACCOUNT_LEDGER, REPORT.LOAN_LEDGER, REPORT.CREDIT_CARD_LEDGER, REPORT.INCOME_VS_EXPENSE_BY_CATEGORY, REPORT.BUDGET_UTILIZATION, REPORT.LOAN_REPAYMENT_SUMMARY, REPORT.STATEMENT_OF_FINANCIAL_POSITION].includes(inputs.type as any) && (
                            <div className={`my-3`}>
                                <label className="text-text-light-primary dark:text-text-dark-primary">To date:</label>
                                <Input
                                    name="todate"
                                    type="date"
                                    placeholder="Enter to date"
                                    value={inputs.todate.toString()}
                                    onChange={onInputChange}
                                    className="mt-1 mb-1"
                                />
                            </div>
                        )
                    }

                    {/* spaces */}
                    {
                        spaceid === "all" && reportsInfo.find((report) => report.type === inputs.type)?.spaces.includes("ALL") && (
                            <div className={`my-3`}>
                                <div className="flex items-center gap-3">
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Select spaces:</label>
                                    <Button
                                        text="Select"
                                        className="max-w-fit px-3 pt-2 pb-2 text-sm"
                                        onClick={openSelectSpacesModal}
                                    />
                                </div>
                                {
                                    inputs.spaces.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2 mb-2">
                                            {
                                                inputs.spaces.map((spaceId) => {
                                                    const space = spaces.find(space => space.id === spaceId);
                                                    if (!space) return null;
                                                    return (
                                                        <div key={spaceId} className="px-3 py-1 rounded-full text-sm bg-bg-light-secondary dark:bg-bg-dark-secondary text-text-light-primary dark:text-text-dark-primary border border-border-light-primary dark:border-border-dark-primary">
                                                            {space.name}
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>
                                    )
                                }

                            </div>
                        )
                    }

                    {/* format */}
                    {
                        inputs.type && (
                            <div className={`my-3`}>
                                <label className="text-text-light-primary dark:text-text-dark-primary">Select format:</label>
                                <select
                                    className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                                    value={inputs.format}
                                    name="format"
                                    onChange={onInputChange}
                                >
                                    <option key={"EXCEL"} value={"EXCEL"}>
                                        EXCEL
                                    </option>
                                    <option key={"PDF"} value={"PDF"}>
                                        PDF
                                    </option>
                                </select>
                            </div>
                        )
                    }

                    <div className="flex justify-end gap-3 items-center">
                        <Button
                            text="Export"
                            type="button"
                            className="mt-4 max-w-fit px-5 py-2 text-sm"
                            disabled = {
                                inputs.type === "" ||
                                inputs.type === REPORT.ACCOUNT_LEDGER && (inputs.spaces.length === 0 || inputs.fromdate === "" || inputs.todate === "") ||
                                inputs.type === REPORT.LOAN_LEDGER && (inputs.spaces.length === 0 || inputs.todate === "") ||
                                inputs.type === REPORT.CREDIT_CARD_LEDGER && (inputs.spaces.length === 0 || inputs.fromdate === "" || inputs.todate === "") ||
                                inputs.type === REPORT.INCOME_VS_EXPENSE_BY_CATEGORY && (inputs.spaces.length === 0 || inputs.fromdate === "" || inputs.todate === "") ||
                                inputs.type === REPORT.BUDGET_UTILIZATION && (inputs.spaces.length === 0 || inputs.fromdate === "" || inputs.todate === "") ||
                                inputs.type === REPORT.LOAN_REPAYMENT_SUMMARY && (inputs.spaces.length === 0 || inputs.todate === "") ||
                                inputs.type === REPORT.STATEMENT_OF_FINANCIAL_POSITION && (inputs.todate === "")
                            }
                            onClick={() => {
                                console.log("inputs", inputs)
                                if (inputs.type === REPORT.ACCOUNT_LEDGER) {
                                    getTransactionLedger(inputs.format, inputs.spaces, inputs.fromdate, inputs.todate, inputs.isCollaborative)
                                } else if (inputs.type === REPORT.LOAN_LEDGER) {
                                    getLoanLedger(inputs.format, inputs.spaces.length > 0 ? inputs.spaces[0] : "", inputs.todate)
                                } else if (inputs.type === REPORT.CREDIT_CARD_LEDGER) {
                                    getCreditCardLedger(inputs.format, inputs.spaces.length > 0 ? inputs.spaces[0] : "", inputs.fromdate, inputs.todate)
                                } else if (inputs.type === REPORT.INCOME_VS_EXPENSE_BY_CATEGORY) {
                                    getIncomeVsExpenseReport(inputs.format, inputs.spaces, inputs.fromdate, inputs.todate, inputs.isCollaborative)
                                } else if (inputs.type === REPORT.BUDGET_UTILIZATION) {
                                    getBudgetUtilizationReport(inputs.format, inputs.spaces, inputs.fromdate, inputs.todate, inputs.isCollaborative)
                                } else if (inputs.type === REPORT.LOAN_REPAYMENT_SUMMARY) {
                                    getLoanRepaymentSummary(inputs.format, inputs.spaces, inputs.todate)
                                } else if (inputs.type === REPORT.STATEMENT_OF_FINANCIAL_POSITION) {
                                    getFinancialPositionReport(inputs.format, inputs.todate)
                                } else {
                                    alert("Coming soon!")
                                }
                            }}
                        />
                    </div>
                </form>

            </div>


            {/* select spaces modal */}
            {
                showSelectSpacesModal &&
                <SpaceSelector
                    setShowSelectSpacesModal={setShowSelectSpacesModal}
                    selectedSpacesInput={inputs.spaces}
                    onSelect={onSelectSpaces}
                    allowedSpaceTypes={reportsInfo.find(report => report.type === inputs.type)?.spaces.filter(space => space !== "ALL") || []}
                />
            }
        </>
    )

}

export default Reports;
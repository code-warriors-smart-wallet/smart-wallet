import Button from "../../Button";
import Input from "../../Input";
import React, { useEffect, useState } from 'react';
import { CategoryInfo, InstallmentPaymentInfo, RepaymentPlanInfo } from "../../../interfaces/modals"
import { toast } from 'react-toastify';
import { capitalize, getTodayDate, toStrdSpaceType } from "../../../utils/utils";
import { SpaceType } from "./Spaces";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store/store";
import { CategoryService } from "../../../services/category.service";
import { TransactionService } from "../../../services/transaction.service";
import { FaArrowAltCircleDown, FaArrowAltCircleUp, FaCreditCard, FaEdit, FaMoneyBillWave, FaTimes, FaTrash, FaUniversity, FaBullseye, FaInfoCircle, FaEye } from "react-icons/fa"
import TransactionList from "./Transactions/TransactionList";
import { getTransactionsSuccess, setLoading, setPage } from "../../../redux/features/installments";
import { LoanRepaymentPlanService } from "../../../services/loan_repayment_plan.service";
import { start } from "repl";
import { RiSendPlaneFill } from "react-icons/ri";
import { MdCallReceived } from "react-icons/md";

export enum TransactionType {
    EXPENSE = 'EXPENSE',
    INCOME = 'INCOME',
    INTERNAL_TRANSFER = 'INTERNAL_TRANSFER',
    LOAN_CHARGES = "LOAN_CHARGES",
    LOAN_PRINCIPAL = "LOAN_PRINCIPAL",
    BALANCE_INCREASE = "BALANCE_INCREASE",
    BALANCE_DECREASE = "BALANCE_DECREASE",
    REPAYMENT_PAID = "REPAYMENT_PAID",
    REPAYMENT_RECEIVED = "REPAYMENT_RECEIVED",
    SAVING = "SAVING",
    WITHDRAW = "WITHDRAW",
}

export interface transactionTypeInfo {
    spaceType: SpaceType;
    icon: React.ReactNode;
    transactionTypes: {
        type: TransactionType;
        fromSpaces: string[];
        toSpaces: string[];
        isCollaborative: boolean
    }[];
}

export const transactionTypesInfo: transactionTypeInfo[] = [
    {
        spaceType: SpaceType.CASH,
        icon: <FaMoneyBillWave />,
        transactionTypes: [
            {
                type: TransactionType.EXPENSE,
                fromSpaces: ["ACTIVE_SPACE"],
                toSpaces: ["OUTSIDE_MYWALLET"],
                isCollaborative: true
            },
            {
                type: TransactionType.INCOME,
                fromSpaces: ["OUTSIDE_MYWALLET"],
                toSpaces: ["ACTIVE_SPACE"],
                isCollaborative: true
            },
            {
                type: TransactionType.INTERNAL_TRANSFER,
                fromSpaces: ["ACTIVE_SPACE"],
                toSpaces: [SpaceType.CASH, SpaceType.BANK],
                isCollaborative: false
            }
        ]
    },
    {
        spaceType: SpaceType.BANK,
        icon: <FaUniversity />,
        transactionTypes: [
            {
                type: TransactionType.EXPENSE,
                fromSpaces: ["ACTIVE_SPACE"],
                toSpaces: ["OUTSIDE_MYWALLET"],
                isCollaborative: true
            },
            {
                type: TransactionType.INCOME,
                fromSpaces: ["OUTSIDE_MYWALLET"],
                toSpaces: ["ACTIVE_SPACE"],
                isCollaborative: true
            },
            {
                type: TransactionType.INTERNAL_TRANSFER,
                fromSpaces: ["ACTIVE_SPACE"],
                toSpaces: [SpaceType.CASH, SpaceType.BANK],
                isCollaborative: false
            }
        ]
    },
    {
        spaceType: SpaceType.CREDIT_CARD,
        icon: <FaCreditCard />,
        transactionTypes: [
            {
                type: TransactionType.BALANCE_INCREASE, // increase
                fromSpaces: ["ACTIVE_SPACE"],
                toSpaces: ["OUTSIDE_MYWALLET"],
                isCollaborative: false
            },
            {
                type: TransactionType.BALANCE_DECREASE, // increase
                toSpaces: ["ACTIVE_SPACE"],
                fromSpaces: [SpaceType.CASH, SpaceType.BANK, "OUTSIDE_MYWALLET"],
                isCollaborative: false
            }
        ]
    },
    {
        spaceType: SpaceType.LOAN_LENT,
        icon: <FaArrowAltCircleUp />,
        transactionTypes: [
            {
                type: TransactionType.REPAYMENT_RECEIVED,
                fromSpaces: ["ACTIVE_SPACE"],
                toSpaces: [SpaceType.CASH, SpaceType.BANK],
                isCollaborative: false
            },
            {
                type: TransactionType.LOAN_CHARGES,
                fromSpaces: ["ACTIVE_SPACE"],
                toSpaces: [SpaceType.CASH, SpaceType.BANK],
                isCollaborative: false
            }
        ]
    },
    {
        spaceType: SpaceType.LOAN_BORROWED,
        icon: <FaArrowAltCircleDown />,
        transactionTypes: [
            {
                type: TransactionType.REPAYMENT_PAID,
                toSpaces: ["ACTIVE_SPACE"],
                fromSpaces: [SpaceType.CASH, SpaceType.BANK],
                isCollaborative: false
            },
            {
                type: TransactionType.LOAN_CHARGES,
                toSpaces: ["ACTIVE_SPACE"],
                fromSpaces: [SpaceType.CASH, SpaceType.BANK],
                isCollaborative: false
            }
        ]
    },
    {
        spaceType: SpaceType.SAVING_GOAL,
        icon: <FaBullseye />,
        transactionTypes: [
            {
                type: TransactionType.SAVING,
                toSpaces: ["ACTIVE_SPACE"],
                fromSpaces: [SpaceType.CASH, SpaceType.BANK],
                isCollaborative: true
            },
            {
                type: TransactionType.WITHDRAW,
                fromSpaces: ["ACTIVE_SPACE"],
                toSpaces: [SpaceType.CASH, SpaceType.BANK],
                isCollaborative: true
            }
        ]
    },
]

export enum InterestPeriod {
    MONTHY = "MONTHY",
    YEARLY = "YEARLY"
}

export enum InterestType {
    FLAT = "FLAT",
    REDUCING_BALANCE = "REDUCING_BALANCE",
    EMI = "EMI",
    INTEREST_ONLY = "INTEREST_ONLY",
    NO_INTEREST = "NO_INTEREST"
}

export enum PaymentFrequency {
    Weekly = "WEEKLY",
    BiWeekly = "BI_WEEKLY",
    Monthly = "MONTHLY",
    BiMonthly = "BI_MONTHLY",
    Quarterly = "QUARTERLY",
    SemiAnnually = "SEMI_ANNUALLY",
    Annually = "ANNUALLY"
}

export const PaymentFrequencyValue = {
    [PaymentFrequency.Weekly]: 0.25,
    [PaymentFrequency.BiWeekly]: 0.5,
    [PaymentFrequency.Monthly]: 1,
    [PaymentFrequency.BiMonthly]: 2,
    [PaymentFrequency.Quarterly]: 3,
    [PaymentFrequency.SemiAnnually]: 6,
    [PaymentFrequency.Annually]: 12
};

export enum InstallmentStatus {
    PENDING = "PENDING",
    PARTIAL = "PARTIAL",
    PAID = "PAID",
    OVERDUE = "OVERDUE",
}

export type Installment = {
    installmentNumber: number;
    spaceId?: string;
    status?: string;
    loanRepaymentPlanId?: string;
    startDate: string;
    endDate: string;
    principalAmount: number;
    interestAmount: number;
    penaltyAmount?: number;
    principalPaid?: number;
    interestPaid?: number;
    penaltyPaid?: number;
    totalPayment: number;
    remainingBalance: number;
};

export enum PaymentType {
    INTEREST_ONLY = "INTEREST_ONLY",
    PRINCIPAL_ONLY = "PRINCIPAL_ONLY",
    INTEREST_AND_PRINCIPAL = "INTEREST_AND_PRINCIPAL",
    PENALTY = "PENALTY",
}

function LoanRepaymentPlan() {

    const { spacetype, spaceid } = useParams()
    const [activeSpaceId, setActiveSpaceId] = useState<string | undefined>(spaceid)
    const [activeSpaceType, setActiveSpaceType] = useState<string | undefined>(spacetype)
    const { username, spaces } = useSelector((state: RootState) => state.auth)
    const [inputs, setInputs] = useState<RepaymentPlanInfo>({
        amount: 0,
        startDate: "",
        endDate: "",
        interestRate: 0,
        interestPeriod: InterestPeriod.MONTHY,
        interestType: InterestType.FLAT,
        paymentFrequency: PaymentFrequency.Monthly,
        firstPaymentDate: "",
        spaceId: spaceid || ""
    });

    const [payInputs, setPayInputs] = useState<InstallmentPaymentInfo>({
        installmentId: null,
        remainingprincipal: 0,
        remainingInterest: 0,
        amount: 0,
        paymentType: PaymentType.INTEREST_AND_PRINCIPAL,
        from: null,
        to: null,
        interest: 0,
        principal: 0,
        planId: null,
        status: ""
    });
    const [newOrEditMode, setNewMode] = useState<boolean>(false)
    const [payMode, setPayMode] = useState<boolean>(false)
    // const [payInfo, setpayInfo] = useState<Installment | null>(null)
    const [payAmountError, setpayAmountError] = useState<string>("")
    const [transactionMode, setTransactionMode] = useState<boolean>(false)
    const [categories, setCategories] = useState<CategoryInfo[]>([])
    const spaceInfo = transactionTypesInfo.find(info => toStrdSpaceType(activeSpaceType) === info.spaceType) || null
    const { pageLimit, createRepaymentPlan, getLoanInfo, payInstallment, getTransactions, deletePayment, deletePlan } = LoanRepaymentPlanService();
    const { installments, loading, loanInfo, transactions } = useSelector((state: RootState) => state.installment)

    const { getCategories } = CategoryService();
    const dispatch = useDispatch();

    const [allowedParentCategories, setAllowedParentCategories] = useState<any[]>([])
    const [allowedSubCategories, setAllowedSubCategories] = useState<CategoryInfo[]>([])
    const currentSpace = spaces.find(sp => sp.id === spaceid);

    const onNewOrEditMode = () => {
        if (loanInfo) {
            if (loanInfo.interestPaid > 0 || loanInfo.principalPaid > 0) {
                toast.error("You already have recorded transactions for this loan. Please delete them before creating a repayment plan.")
                return;
            }
            setInputs((prev: RepaymentPlanInfo) => {
                return {
                    ...prev,
                    startDate: loanInfo?.loanStartDate?.split("T")[0] ?? "",
                    endDate: loanInfo?.loanEndDate?.split("T")[0] ?? "",
                    amount: loanInfo?.loanPrincipal?.$numberDecimal ?? ""
                }
            })
        }
        setPayMode(false)
        setNewMode(true);
    }

    const onPayMode = (installment: Installment) => {
        setTransactionMode(false)
        setPayMode(true)
        setNewMode(false);
        const remainingInterest = (installment?.interestAmount || 0) - (installment?.interestPaid || 0)
        const remainingprincipal = (installment?.principalAmount || 0) - (installment?.principalPaid || 0)
        setPayInputs((prev: InstallmentPaymentInfo) => {
            return {
                ...prev,
                remainingInterest: remainingInterest,
                remainingprincipal: remainingprincipal,
                amount: remainingInterest + remainingprincipal,
                interest: remainingInterest,
                principal: remainingprincipal,
                installmentId: installment.installmentNumber,
                planId: installment.loanRepaymentPlanId || "",
                status: installment.status || "",
                paymentType: installment.status === InstallmentStatus.PAID ? PaymentType.PENALTY : PaymentType.INTEREST_AND_PRINCIPAL
            }
        });
        // setpayInfo(installment)
    }

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target as HTMLInputElement;
        console.log(name, value)
        setInputs((prev: RepaymentPlanInfo) => {
            return { ...prev, [name]: value }
        });
    }

    const onPayInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target as HTMLInputElement;
        if (name === "amount") {
            const max = payInputs.paymentType === PaymentType.INTEREST_ONLY ?
                payInputs.remainingInterest
                : payInputs.paymentType === PaymentType.PRINCIPAL_ONLY ?
                    payInputs.remainingprincipal
                    : payInputs.paymentType === PaymentType.INTEREST_AND_PRINCIPAL ?
                        payInputs.remainingInterest + payInputs.remainingprincipal
                        : 99999

            if (Number(value) > max) {
                setpayAmountError("The amount cannot be more than " + max)
                setPayInputs((prev: InstallmentPaymentInfo) => {
                    return { ...prev, interest: 0, principal: 0 }
                });
            } else {
                let interest = 0;
                let principal = 0

                if (payInputs.paymentType === PaymentType.INTEREST_ONLY) {
                    interest = Number(value)
                    principal = 0
                } else if (payInputs.paymentType === PaymentType.PRINCIPAL_ONLY) {
                    principal = Number(value)
                    interest = 0
                } else if (payInputs.paymentType === PaymentType.INTEREST_AND_PRINCIPAL) {
                    interest = payInputs.remainingInterest
                    principal = Number(value) - payInputs.remainingInterest
                } else {
                    interest = 0;
                    principal = 0
                }

                setPayInputs((prev: InstallmentPaymentInfo) => {
                    return { ...prev, interest: interest, principal: principal }
                });

                setpayAmountError("")
            }
        }

        if (name === "paymentType") {
            const max = value === PaymentType.INTEREST_ONLY ?
                payInputs.remainingInterest
                : value === PaymentType.PRINCIPAL_ONLY ?
                    payInputs.remainingprincipal
                    : value === PaymentType.INTEREST_AND_PRINCIPAL ?
                        payInputs.remainingInterest + payInputs.remainingprincipal
                        : 99999
            const amount = value === PaymentType.PENALTY ? 0 : max

            let interest = 0;
            let principal = 0

            if (value === PaymentType.INTEREST_ONLY) {
                interest = Number(payInputs.remainingInterest)
                principal = 0
            } else if (value === PaymentType.PRINCIPAL_ONLY) {
                principal = Number(payInputs.remainingprincipal)
                interest = 0
            } else if (value === PaymentType.INTEREST_AND_PRINCIPAL) {
                interest = payInputs.remainingInterest
                principal = payInputs.remainingprincipal
            } else {
                interest = 0;
                principal = 0
            }

            setPayInputs((prev: InstallmentPaymentInfo) => {
                return { ...prev, amount: amount, interest: interest, principal: principal }
            });
            if (Number(amount) > max) {
                setpayAmountError("The amount cannot be more than " + max)
            } else {
                setpayAmountError("")
            }

        }
        setPayInputs((prev: InstallmentPaymentInfo) => {
            return { ...prev, [name]: value }
        });
    }

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    }

    const onNewOrEditSubmit = async () => {
        if (!activeSpaceId) {
            return;
        }

        console.log(inputs)

        let finalInputs = inputs;
        console.log(finalInputs)
        if (inputs.interestPeriod == InterestPeriod.YEARLY) {
            finalInputs = { ...finalInputs, interestRate: inputs.interestRate / 12 };
        }
        console.log(finalInputs)

        const monthlyInterestRate = finalInputs.interestRate
        const monthsPerInstallment = calculateMonthsPerInstallment(finalInputs.paymentFrequency as PaymentFrequency)
        const totalMonths = monthsBetween(finalInputs.startDate, finalInputs.endDate);
        const noOfInstallments = Math.floor(
            totalMonths / monthsPerInstallment
        );

        console.log({
            monthlyInterestRate, monthsPerInstallment, totalMonths, noOfInstallments
        })

        let installments: Installment[] = []
        if (finalInputs.interestType === InterestType.FLAT) {
            console.log(1)
            installments = generateFlatInstallments(noOfInstallments, finalInputs.amount, monthlyInterestRate, monthsPerInstallment, finalInputs.startDate, finalInputs.paymentFrequency as PaymentFrequency, activeSpaceId)
        } else if (finalInputs.interestType === InterestType.REDUCING_BALANCE) {
            console.log(2)
            installments = generateReducingBalanceInstallments(noOfInstallments, finalInputs.amount, monthlyInterestRate, monthsPerInstallment, finalInputs.startDate, finalInputs.paymentFrequency as PaymentFrequency, activeSpaceId)
        } else if (finalInputs.interestType === InterestType.EMI) {
            console.log(3)
            installments = generateEMIInstallments(noOfInstallments, finalInputs.amount, monthlyInterestRate, monthsPerInstallment, finalInputs.startDate, finalInputs.paymentFrequency as PaymentFrequency, activeSpaceId)
        } else if (finalInputs.interestType === InterestType.INTEREST_ONLY) {
            console.log(4)
            installments = generateInterestOnlyInstallments(noOfInstallments, finalInputs.amount, monthlyInterestRate, monthsPerInstallment, finalInputs.startDate, finalInputs.paymentFrequency as PaymentFrequency, activeSpaceId)
        } else if (finalInputs.interestType === InterestType.NO_INTEREST) {
            console.log(5)
            installments = generateNoInterestInstallments(noOfInstallments, finalInputs.amount, monthlyInterestRate, monthsPerInstallment, finalInputs.startDate, finalInputs.paymentFrequency as PaymentFrequency, activeSpaceId)
        }
        console.log(installments);
        console.table(installments);

        let totalInterest = 0;

        installments.forEach(i => {
            totalInterest += i.interestAmount
        })

        const loanRepaymentPlan = {
            spaceId: activeSpaceId,
            monthsPerInstallment: monthsPerInstallment,
            interestType: finalInputs.interestType,
            paymentFrequency: finalInputs.paymentFrequency,
            firstPaymentDate: finalInputs.firstPaymentDate,
            monthlyInterestRate: monthlyInterestRate,
            totalInterest: totalInterest
        }

        dispatch(setLoading({ loading: true }))
        createRepaymentPlan({ loanRepaymentPlan, installments })
            .finally(() => {
                console.log(">>>>> created info")
                dispatch(setLoading({ loading: false }));
            });

        // dispatch(setLoading({ loading: true }))
        // if (editId) {
        //     console.log(finalInputs)
        //     //  await editTransaction(editId, finalInputs)
        // } else {
        //     console.log(finalInputs)
        //     await createRepaymentPlan(finalInputs)
        // }
        getLoanInfo(activeSpaceId || "")
            .finally(() => {
                dispatch(setLoading({ loading: false }));
            });
        onCancel();
    }

    const onPaySubmit = async () => {

        if (!payInputs.from && !payInputs.to) {
            toast.error("Space is required!")
            return
        }
        console.log(payInputs)

        const body = {
            installmentNumber: payInputs.installmentId,
            interest: payInputs.interest,
            principal: payInputs.principal,
            penalty: payInputs.paymentType === PaymentType.PENALTY ? payInputs.amount : 0,
            date: getTodayDate(),
            from: payInputs.from,
            to: payInputs.to,
            planId: payInputs.planId
        }

        console.log(body)
        onCancel()

        dispatch(setLoading({ loading: true }))
        await payInstallment(body)
            .finally(() => {
                console.log(">>>>> paid")
                dispatch(setLoading({ loading: false }));
            });

        await getLoanInfo(activeSpaceId || "")
            .finally(() => {
                dispatch(setLoading({ loading: false }));
            });

    }

    const onTransactionMode = async (installment: any) => {
        console.log(installment)
        setTransactionMode(true)
        dispatch(setLoading({ loading: true }))
        await getTransactions(installment.loanRepaymentPlanId, installment.installmentNumber)
            .finally(() => {
                console.log(">>>>> paid")
                dispatch(setLoading({ loading: false }));
            });
    }

    const onPaymentDeleteSubmit = async (transaction: any) => {
        const category = categories.find(pc => pc.subCategoryId === transaction.scategory)?.subCategoryName?.split(" ")[0].toLocaleLowerCase();
        const body = {
            transactionId: transaction._id,
            planId: transaction.loanRepaymentPlanId,
            installmentNumber: transaction.note.split(" ")[1],
            type: category?.includes("interest") ? PaymentType.INTEREST_ONLY
                : category?.includes("principal") ? PaymentType.PRINCIPAL_ONLY
                    : category?.includes("penalty") ? PaymentType.PENALTY
                        : "",
            amount: transaction.amount.$numberDecimal
        }

        console.log(body)

        dispatch(setLoading({ loading: true }))
        await deletePayment(body)
            .finally(() => {
                console.log(">>>>> paid")
                dispatch(setLoading({ loading: false }));
            });

        await getTransactions(transaction.loanRepaymentPlanId, transaction.note.split(" ")[1])
            .finally(() => {
                console.log(">>>>> paid")
                dispatch(setLoading({ loading: false }));
            });

        await getLoanInfo(activeSpaceId || "")
            .finally(() => {
                dispatch(setLoading({ loading: false }));
            });

        // onCancel()
    }

    const onDelete = async (loanRepaymentPlanId: string) => {
        if (confirm("Are you sure? Do you want to delete repayment plan? This plan has existing transactions?")) {
            let transactionDelFlag = false
            if (loanInfo.interestPaid > 0 || loanInfo.principalPaid > 0) {
                transactionDelFlag = confirm("We found previous payments. Do you want to delete them as well?")
            }
            const body = {
                loanRepaymentPlanId, transactionDelFlag
            }
            console.log(body)

            dispatch(setLoading({ loading: true }))
            await deletePlan(body)
                .finally(() => {
                    console.log(">>>>> paid")
                    dispatch(setLoading({ loading: false }));
                });


            await getLoanInfo(activeSpaceId || "")
                .finally(() => {
                    dispatch(setLoading({ loading: false }));
                });
        }
    }

    const onCancel = () => {
        setPayMode(false)
        setNewMode(false)
        // setpayInfo(null)
        setActiveSpaceType(toStrdSpaceType(spacetype))
        setActiveSpaceId(spaceid)
        setInputs({

            amount: 0,
            startDate: "",
            endDate: "",
            interestRate: 0,
            interestPeriod: InterestPeriod.MONTHY,
            interestType: InterestType.FLAT,
            paymentFrequency: PaymentFrequency.Monthly,
            firstPaymentDate: "",
            spaceId: activeSpaceId || ""
        })

        setPayInputs({
            installmentId: null,
            amount: 0,
            paymentType: PaymentType.INTEREST_AND_PRINCIPAL,
            from: "",
            to: "",
            interest: 0,
            principal: 0,
            remainingprincipal: 0,
            remainingInterest: 0,
            planId: null,
            status: ""
        })

        setTransactionMode(false)
        dispatch(getTransactionsSuccess({ transactions: [] }))
    }


    useEffect(() => {
        console.log("hello")
        console.log("spaceid: ", spaceid)
        setActiveSpaceId(spaceid)
        setActiveSpaceType(toStrdSpaceType(spacetype))
    }, [spaceid])

    useEffect(() => {
        dispatch(setLoading({ loading: true }))
        getLoanInfo(spaceid || "")
            .finally(() => {
                console.log(">>>>> got info")
                dispatch(setLoading({ loading: false }));
            });
        getCategories(toStrdSpaceType(activeSpaceType))
            .then((res) => setCategories(res))
            .catch((err) => setCategories([]))
    }, [activeSpaceId])

    useEffect(() => {

        if (newOrEditMode && inputs.startDate != "" && inputs.paymentFrequency != "") {
            setInputs((prev: RepaymentPlanInfo) => {
                return { ...prev, firstPaymentDate: calculateFirstPaymentDate(inputs.startDate, inputs.paymentFrequency as PaymentFrequency).toISOString().split("T")[0] }
            });
        }

    }, [newOrEditMode, inputs.startDate, inputs.paymentFrequency])

    useEffect(() => {

        if (inputs.interestType === InterestType.EMI) {
            setInputs((prev: RepaymentPlanInfo) => {
                return { ...prev, paymentFrequency: PaymentFrequency.Monthly }
            });
        }

    }, [inputs.interestType])

    if (loading) return <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary">Loading...</h1>

    return (
        <>
            {/* sub header */}
            <div className="flex justify-between items-center">
                <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary flex items-center">
                    Loan repayment plan
                    {
                        spaces.filter(sp => sp.isCollaborative).length > 0 && spacetype === "all" && (
                            <FaInfoCircle
                                className="ml-3 text-primary"
                                title="The All Spaces view shows only your personal financial records. Transactions created by other members in collaborative spaces are not included."
                            />
                        )
                    }
                </h1>
                <div className="flex justify-end gap-3 items-center">
                    {
                        (!loading && installments?.length == 0) && (
                            <Button
                                text="New Plan"
                                className="max-w-fit"
                                onClick={onNewOrEditMode}
                            />
                        )

                    }
                    {
                        (!loading && installments?.length > 0) && (
                            <Button
                                text="Delete Plan"
                                className="max-w-fit pt-2 pb-2 hover:!bg-red-600 !bg-red-500"
                                onClick={() => onDelete(installments[0].loanRepaymentPlanId)}
                            />
                        )
                    }

                </div>
            </div>

            {
                newOrEditMode && (
                    <div
                        className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-opacity-50 overflow-auto p-4 modal-bg pt-10"
                    >
                        <div
                            className="relative w-full max-w-lg rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-3"
                        >
                            <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
                                {"New Repayment Plan"}
                            </div>
                            <form className="border-t border-b border-border-light-primary dark:border-border-dark-primary" onSubmit={onSubmit}>
                                {/* amount */}
                                <div className={`my-3`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Amount:</label>
                                    <Input
                                        name="amount"
                                        type="text"
                                        disabled={loanInfo?.loanPrincipal?.$numberDecimal && loanInfo?.loanPrincipal?.$numberDecimal > 0}
                                        placeholder="Enter amount"
                                        value={inputs.amount.toString()}
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                    />
                                </div>

                                {/* start date */}
                                <div className={`my-3`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Start Date:</label>
                                    <Input
                                        name="startDate"
                                        type="date"
                                        disabled={loanInfo.loanStartDate != null && loanInfo.loanStartDate != ""}
                                        placeholder="Enter amount"
                                        value={inputs.startDate.toString()}
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                    />
                                </div>

                                {/* end date */}
                                <div className={`my-3`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary">End Date:</label>
                                    <Input
                                        name="endDate"
                                        type="date"
                                        placeholder="Enter amount"
                                        disabled={loanInfo.loanStartDate != null && loanInfo.loanStartDate != ""}
                                        value={inputs.endDate.toString()}
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                    />
                                </div>

                                {/* interestRate */}
                                <div className={`my-3`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Interest rate:</label>
                                    <Input
                                        name="interestRate"
                                        type="text"
                                        placeholder="Enter interest rate"
                                        value={inputs.interestRate.toString()}
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                    />
                                </div>

                                {/* interestPeriod */}
                                <div className={inputs.interestRate > 0 ? `my-3` : `my-3 hidden`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary font-bold">Interest period:</label>
                                    <select
                                        className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50"
                                        value={inputs.interestPeriod || ""}
                                        name="interestPeriod"
                                        onChange={onInputChange}
                                    >
                                        {
                                            Object.values(InterestPeriod).map(freq => {
                                                return (
                                                    <option value={freq} className="capitalize">
                                                        {freq.split("_").join(" ")}
                                                    </option>
                                                )
                                            })
                                        }
                                    </select>
                                </div>

                                {/* interestType */}
                                <div className={inputs.interestRate > 0 ? `my-3` : `my-3 hidden`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary font-bold">Interest type:</label>
                                    <select
                                        className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50"
                                        value={inputs.interestType || ""}
                                        name="interestType"
                                        onChange={onInputChange}
                                    >
                                        {
                                            Object.values(InterestType).map(freq => {
                                                return (
                                                    <option value={freq} className="capitalize">
                                                        {freq.split("_").join(" ")}
                                                    </option>
                                                )
                                            })
                                        }
                                    </select>
                                </div>

                                {/* Payment Frequency */}
                                <div className={inputs.interestRate > 0 && inputs.interestType !== InterestType.EMI ? `my-3` : `my-3 hidden`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary font-bold">Payment Frequency:</label>
                                    <select
                                        className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50"
                                        value={inputs.paymentFrequency || ""}
                                        name="paymentFrequency"
                                        onChange={onInputChange}
                                    >
                                        {
                                            Object.values(PaymentFrequency).map(freq => {
                                                return (
                                                    <option value={freq} className="capitalize">
                                                        {freq.split("_").join(" ")}
                                                    </option>
                                                )
                                            })
                                        }
                                    </select>
                                </div>

                                {/* firstPaymentDate */}
                                <div className={`my-3`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary">First Payment Date:</label>
                                    <Input
                                        name="firstPaymentDate"
                                        type="date"
                                        placeholder="Enter amount"
                                        value={inputs.firstPaymentDate.toString()}
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                    />
                                </div>

                                {/* Existing transactions */}
                            </form>
                            <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
                                <Button
                                    text="Cancel"
                                    className="max-w-fit"
                                    priority="secondary"
                                    onClick={onCancel}
                                />
                                <Button
                                    text={"Create"}
                                    className="max-w-fit ml-3"
                                    onClick={onNewOrEditSubmit}
                                />
                            </div>
                        </div>
                    </div>
                )

            }

            {
                payMode && (
                    <div
                        className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-opacity-50 overflow-auto p-4 modal-bg pt-10"
                    >
                        <div
                            className="relative w-full max-w-lg rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-3"
                        >
                            <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
                                {activeSpaceType === SpaceType.LOAN_BORROWED ? "Pay installment" : "Collect installment"}
                            </div>
                            <form className="border-t border-b border-border-light-primary dark:border-border-dark-primary" onSubmit={onSubmit}>
                                <div className="border border-border-light-primary dark:border-border-dark-primary p-2 text-text-light-primary dark:text-text-dark-primary">
                                    <p>Remaining Interest: {payInputs.remainingInterest}</p>
                                    <p>Remaining Principal: {payInputs.remainingprincipal}</p>
                                </div>
                                {/* Payment Type */}
                                <div className={`my-3`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary font-bold">Payment Type:</label>
                                    <select
                                        className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50"
                                        value={payInputs.paymentType || ""}
                                        name="paymentType"
                                        onChange={onPayInputChange}
                                    >
                                        {
                                            Object.values(PaymentType).map(freq => {
                                                return (
                                                    <option value={freq} className="capitalize" disabled={payInputs.status === InstallmentStatus.PAID && freq !== PaymentType.PENALTY}>
                                                        {freq.split("_").join(" ")}
                                                    </option>
                                                )
                                            })
                                        }
                                    </select>
                                </div>

                                {/* amount */}
                                <div className={`my-3`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Amount:</label>
                                    <Input
                                        name="amount"
                                        type="text"
                                        placeholder="Enter amount"
                                        value={payInputs.amount.toString()}
                                        onChange={onPayInputChange}
                                        className="mt-1 mb-1"
                                    />
                                    {
                                        payAmountError != "" && <p className="text-red-500 text-xs italic">{payAmountError}</p>
                                    }
                                    <p className="text-yellow-500 text-xs italic">
                                        {
                                            payInputs.paymentType === PaymentType.INTEREST_AND_PRINCIPAL &&
                                            "Note: Payments are applied to interest first, then principal." + (
                                                payInputs.interest > 0 && payInputs.principal > 0 ? ` (Interest = ${payInputs.interest}, Principal = ${payInputs.principal})` : ""
                                            )
                                        }
                                    </p>
                                </div>

                                {/* Space */}
                                <div className={`my-3`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary font-bold">{activeSpaceType === SpaceType.LOAN_BORROWED ? "Pay from:" : "Received to:"}</label>
                                    <select
                                        className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50"
                                        value={(activeSpaceType === SpaceType.LOAN_BORROWED ? payInputs.from : payInputs.to) || ""}
                                        name={activeSpaceType === SpaceType.LOAN_BORROWED ? "from" : "to"}
                                        onChange={onPayInputChange}
                                    >
                                        <option value={""} className="capitalize">
                                            Select space
                                        </option>
                                        {
                                            spaces.filter(sp => [SpaceType.BANK, SpaceType.CASH].includes(sp.type as SpaceType) && !sp.isCollaborative).map(freq => {
                                                return (
                                                    <option value={freq.id} className="capitalize">
                                                        {freq.name.split("_").join(" ")}
                                                    </option>
                                                )
                                            })
                                        }
                                    </select>
                                </div>

                            </form>
                            <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
                                <Button
                                    text="Cancel"
                                    className="max-w-fit"
                                    priority="secondary"
                                    onClick={onCancel}
                                />
                                <Button
                                    text={activeSpaceType === SpaceType.LOAN_BORROWED ? "Pay" : "Collect"}
                                    className="max-w-fit ml-3"
                                    onClick={onPaySubmit}
                                />
                            </div>
                        </div>
                    </div>
                )

            }

            {
                transactionMode && transactions.length > 0 && (
                    <div
                        className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-opacity-50 overflow-auto p-4 modal-bg pt-10"
                    >
                        <div
                            className="relative w-full max-w-lg rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-3"
                        >
                            <div className="flex justify-between shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
                                {transactions[0].note + "s"}
                                <div className="flex gap-2">
                                    <Button
                                        text={<FaTimes />}
                                        onClick={onCancel}
                                        className="max-w-fit pt-2 pb-2 !bg-transparent border border-border-light-primary dark:border-border-dark-primary hover:!bg-border-light-primary dark:hover:!bg-border-dark-primary"
                                    />
                                </div>
                            </div>
                            <table className="w-full mt-3">
                                {/* <thead>
                                    <tr>
                                        <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Date</td>
                                        <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Type</td>
                                        <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Amount</td>
                                        <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Actions</td>
                                    </tr>
                                </thead> */}
                                <tbody>
                                    {
                                        transactions.map(transaction => {
                                            return (
                                                <tr
                                                    className={"hover:bg-hover-light-primary dark:hover:bg-hover-dark-primary cursor-pointer"}
                                                >
                                                    <td className="px-2 py-2  border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">{transaction.date.split("T")[0]}</td>
                                                    <td className="px-2 py-2 border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">{categories.find(pc => pc.subCategoryId === transaction.scategory)?.subCategoryName?.split(" ")[0]}</td>
                                                    <td className="px-2 py-2 border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">{transaction.amount.$numberDecimal}</td>
                                                    <td className="px-2 py-2 border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">
                                                        <Button
                                                            text={<FaTrash />}
                                                            className="max-w-fit pt-2 pb-2 hover:!bg-hover-light-primary dark:hover:!bg-hover-dark-primary !bg-transparent !text-red-500 cursor-pointer"
                                                            onClick={() => onPaymentDeleteSubmit(transaction)}
                                                        />
                                                    </td>

                                                </tr>
                                            )
                                        })
                                    }
                                </tbody>
                            </table>

                        </div>
                    </div>
                )
            }

            {
                !loading && installments?.length > 0 && (
                    <table className="w-full mt-6">
                        <thead>
                            <tr>
                                <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">No</td>
                                <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Start date</td>
                                <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">End date</td>
                                <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Prin. amount</td>
                                <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Int. amount</td>
                                <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Tot. amount</td>
                                <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Prin. paid</td>
                                <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Int. paid</td>
                                <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Penalty paid</td>
                                <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Status</td>
                                <td className="px-2 py-2 bg-primary border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Actions</td>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                installments.map(installment => {
                                    return (
                                        <tr
                                            className={`${isCurrentInstallment(installment.startDate, installment.endDate) ? "bg-yellow-900" : "hover:bg-hover-light-primary dark:hover:bg-hover-dark-primary cursor-pointer"}`}
                                        // onClick={() => onTransactionMode(installment)}
                                        >
                                            <td className="px-2 py-3  border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">{installment.installmentNumber}</td>
                                            <td className="px-2 py-3 border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">{installment.startDate.split("T")[0]}</td>
                                            <td className="px-2 py-3 border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">{installment.endDate.split("T")[0]}</td>
                                            <td className="px-2 py-3 border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">{installment.principalAmount}</td>
                                            <td className="px-2 py-3 border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">{installment.interestAmount}</td>
                                            <td className="px-2 py-3 border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">{installment.principalAmount + installment.interestAmount}</td>
                                            <td className="px-2 py-3 border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">{installment.principalPaid}</td>
                                            <td className="px-2 py-3 border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">{installment.interestPaid}</td>
                                            <td className="px-2 py-3 border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">{installment.penaltyPaid}</td>
                                            <td
                                                className={`px-2 py-3 border-b border-border-light-primary dark:border-border-dark-primary ${getInstallmentStatusColor(installment.status)}`}
                                            >{capitalize(installment.status)}</td>
                                            <td className="px-2 py-3 border-b border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">
                                                <Button
                                                    text={activeSpaceType === SpaceType.LOAN_BORROWED ? <RiSendPlaneFill /> : <MdCallReceived />}
                                                    className="max-w-fit test-xs pt-1 pb-1 pl-2 pr-2 mr-1"
                                                    onClick={() => onPayMode(installment)}
                                                />
                                                {
                                                    installment.principalPaid > 0 || installment.interestPaid > 0 || installment.penaltyPaid > 0 ?
                                                        <Button
                                                            text={<FaEye />}
                                                            className="max-w-fit test-xs pt-1 pb-1 pl-2 pr-2"
                                                            onClick={() => onTransactionMode(installment)}
                                                        /> : null
                                                }
                                            </td>

                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </table>
                )
            }

            {
                (!loading && installments?.length == 0) && <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary text-center mt-48">Loan repayment plan is not created yet!</h1>
            }
        </>
    )
}

function isCurrentInstallment(startDate: string, endDate: string) {
    const today = new Date();

    const start = new Date(startDate)
    const end = new Date(endDate)
    return today > start && today < end;
}

function getInstallmentStatusColor(status: string) {
    switch (status) {
        case InstallmentStatus.PENDING:
            return "text-red-500";

        case InstallmentStatus.PARTIAL:
            return "text-yellow-500";

        case InstallmentStatus.PAID:
            return "text-green-600";

        case InstallmentStatus.OVERDUE:
            return "text-red-600";

        default:
            return "text-gray-400";
    }
}

export function calculateFirstPaymentDate(
    startDate: string,
    frequency: PaymentFrequency
): Date {
    const result = new Date(startDate);

    switch (frequency) {
        case PaymentFrequency.Weekly:
            result.setDate(result.getDate() + 7);
            break;

        case PaymentFrequency.BiWeekly:
            result.setDate(result.getDate() + 14);
            break;

        case PaymentFrequency.Monthly:
            result.setMonth(result.getMonth() + 1);
            break;

        case PaymentFrequency.BiMonthly:
            result.setMonth(result.getMonth() + 2);
            break;

        case PaymentFrequency.Quarterly:
            result.setMonth(result.getMonth() + 3);
            break;

        case PaymentFrequency.SemiAnnually:
            result.setMonth(result.getMonth() + 6);
            break;

        case PaymentFrequency.Annually:
            result.setFullYear(result.getFullYear() + 1);
            break;
    }

    return result;
}

export function calculateMonthsPerInstallment(
    frequency: PaymentFrequency
): number {
    let result = 0;

    switch (frequency) {
        case PaymentFrequency.Weekly:
            result = 0.25;
            break;

        case PaymentFrequency.BiWeekly:
            result = 0.5;
            break;

        case PaymentFrequency.Monthly:
            result = 1;
            break;

        case PaymentFrequency.BiMonthly:
            result = 2;
            break;

        case PaymentFrequency.Quarterly:
            result = 3;
            break;

        case PaymentFrequency.SemiAnnually:
            result = 6;
            break;

        case PaymentFrequency.Annually:
            result = 12;
            break;
    }

    return result;
}

export function monthsBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();

    return years * 12 + months;
}

export function generateFlatInstallments(
    noOfInstallments: number,
    amount: number,
    monthlyInterestRate: number,
    monthsPerInstallment: number,
    startDate: string,
    paymentFrequency: PaymentFrequency,
    spaceId: string,
): Installment[] {
    if (noOfInstallments <= 0) return []

    let installments = []
    if (noOfInstallments > 0) {
        const principalPerInstallment = Number(
            (amount / noOfInstallments).toFixed(2)
        );

        const interestPerInstallment = Number(
            (
                (amount * monthlyInterestRate * monthsPerInstallment) / 100
            ).toFixed(2)
        );

        let currentStart = startDate

        let remaining_balance = amount
        for (let i = 0; i < noOfInstallments; i++) {
            const currentEnd = calculateFirstPaymentDate(currentStart, paymentFrequency).toISOString().split("T")[0];

            remaining_balance -= principalPerInstallment

            installments.push({
                spaceId: spaceId,
                installmentNumber: i + 1,
                startDate: currentStart,
                endDate: currentEnd,
                principalAmount: principalPerInstallment,
                interestAmount: interestPerInstallment,
                totalPayment: principalPerInstallment + interestPerInstallment,
                remainingBalance: Number(remaining_balance.toFixed(2))
            });


            currentStart = currentEnd;
        }

    }

    return installments;
}

export function generateReducingBalanceInstallments(
    noOfInstallments: number,
    amount: number,
    monthlyInterestRate: number,
    monthsPerInstallment: number,
    startDate: string,
    paymentFrequency: PaymentFrequency,
    spaceId: string,
): Installment[] {
    if (noOfInstallments <= 0) return []

    let installments = []
    if (noOfInstallments > 0) {
        const principalPerInstallment = Number(
            (amount / noOfInstallments).toFixed(2)
        );


        let currentStart = startDate
        let remainingBalance = amount
        for (let i = 0; i < noOfInstallments; i++) {
            const currentEnd = calculateFirstPaymentDate(currentStart, paymentFrequency).toISOString().split("T")[0];

            const interestPerInstallment = Number(
                (
                    (remainingBalance * monthlyInterestRate * monthsPerInstallment) / 100
                ).toFixed(2)
            );

            remainingBalance -= principalPerInstallment

            installments.push({
                spaceId: spaceId,
                installmentNumber: i + 1,
                startDate: currentStart,
                endDate: currentEnd,
                principalAmount: principalPerInstallment,
                interestAmount: interestPerInstallment,
                remainingBalance: remainingBalance,
                totalPayment: principalPerInstallment + interestPerInstallment
            });

            currentStart = currentEnd;
        }

    }

    return installments;
}


export function generateEMIInstallments(
    noOfInstallments: number,
    amount: number,
    monthlyInterestRate: number,
    monthsPerInstallment: number,
    startDate: string,
    paymentFrequency: PaymentFrequency,
    spaceId: string,
): Installment[] {
    const installments = [];

    if (noOfInstallments <= 0) return [];

    // interest per installment
    const r = (monthlyInterestRate * monthsPerInstallment) / 100;

    const n = noOfInstallments;

    // EMI formula
    const emi = Number(
        (
            (amount * r * Math.pow(1 + r, n)) /
            (Math.pow(1 + r, n) - 1)
        ).toFixed(2)
    );

    let remainingBalance = amount;
    let currentStart = startDate;

    for (let i = 0; i < n; i++) {
        // const currentEnd = new Date(currentStart);

        const currentEnd = calculateFirstPaymentDate(currentStart, paymentFrequency).toISOString().split("T")[0];

        const interestAmount = Number(
            (remainingBalance * r).toFixed(2)
        );

        let principalAmount = Number(
            (emi - interestAmount).toFixed(2)
        );

        // adjust last installment
        if (i === n - 1) {
            principalAmount = Number(remainingBalance.toFixed(2));
        }

        remainingBalance = Number(
            (remainingBalance - principalAmount).toFixed(2)
        );

        installments.push({
            spaceId: spaceId,
            installmentNumber: i + 1,
            startDate: currentStart,
            endDate: currentEnd,
            emiAmount: emi,
            principalAmount: principalAmount,
            interestAmount: interestAmount,
            totalPayment: principalAmount + interestAmount,
            remainingBalance: remainingBalance
        });

        currentStart = currentEnd;
    }

    return installments;
}


export function generateInterestOnlyInstallments(
    noOfInstallments: number,
    amount: number,
    monthlyInterestRate: number,
    monthsPerInstallment: number,
    startDate: string,
    paymentFrequency: PaymentFrequency,
    spaceId: string,
) {
    const installments = [];

    if (noOfInstallments <= 0) return [];

    const interestPerInstallment = Number(
        (
            (amount * monthlyInterestRate * monthsPerInstallment) /
            100
        ).toFixed(2)
    );

    let currentStart = startDate;

    for (let i = 0; i < noOfInstallments; i++) {
        const currentEnd = calculateFirstPaymentDate(currentStart, paymentFrequency).toISOString().split("T")[0];

        let principalAmount = 0;

        // last installment → pay full principal
        if (i === noOfInstallments - 1) {
            principalAmount = Number(amount.toFixed(2));
        }

        const totalPayment = Number(
            (principalAmount + interestPerInstallment).toFixed(2)
        );

        const remainingBalance =
            i === noOfInstallments - 1 ? 0 : amount;

        installments.push({
            spaceId: spaceId,
            installmentNumber: i + 1,
            startDate: currentStart,
            endDate: currentEnd,
            principalAmount: principalAmount,
            interestAmount: interestPerInstallment,
            totalPayment: totalPayment,
            remainingBalance: remainingBalance
        });

        currentStart = currentEnd;
    }

    return installments;
}

export function generateNoInterestInstallments(
    noOfInstallments: number,
    amount: number,
    monthlyInterestRate: number,
    monthsPerInstallment: number,
    startDate: string,
    paymentFrequency: PaymentFrequency,
    spaceId: string,
) {
    const installments = [];

    if (noOfInstallments <= 0) return [];

    const basePrincipal = amount / noOfInstallments;

    let remainingBalance = amount;
    let currentStart = startDate;

    for (let i = 0; i < noOfInstallments; i++) {
        const currentEnd = calculateFirstPaymentDate(currentStart, paymentFrequency).toISOString().split("T")[0];

        // fix rounding in last installment
        let principalAmount =
            i === noOfInstallments - 1
                ? Number(remainingBalance.toFixed(2))
                : Number(basePrincipal.toFixed(2));

        remainingBalance = Number(
            (remainingBalance - principalAmount).toFixed(2)
        );

        installments.push({
            spaceId: spaceId,
            installmentNumber: i + 1,
            startDate: currentStart,
            endDate: currentEnd,
            principalAmount: principalAmount,
            interestAmount: 0,
            totalPayment: principalAmount,
            remainingBalance: remainingBalance
        });

        currentStart = currentEnd;
    }

    return installments;
}


// export function calculateInstallments(
//   amount: number,
//   startDate: string,
//   endDate: string,
//   frequency: PaymentFrequency
// ) {
//   const totalMonths = monthsBetween(startDate, endDate);

//   const monthsPerInstallment = calculateMonthsPerInstallment(frequency);

//   const installments = totalMonths / monthsPerInstallment;

//   const principalPerInstallment = amount / installments;

//   return {
//     totalMonths,
//     monthsPerInstallment,
//     installments,
//     principalPerInstallment
//   };
// }

export default LoanRepaymentPlan;
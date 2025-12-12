import Button from "../../Button";
import Input from "../../Input";
import React, { useEffect, useState } from 'react';
import { CategoryInfo, TransactionInfo } from "../../../interfaces/modals"
import { toast } from 'react-toastify';
import { toStrdSpaceType } from "../../../utils/utils";
import { SpaceType } from "./Spaces";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store/store";
import { CategoryService } from "../../../services/category.service";
import { TransactionService } from "../../../services/transaction.service";
import { FaArrowAltCircleDown, FaArrowAltCircleUp, FaCreditCard, FaEdit, FaMoneyBillWave, FaTimes, FaTrash, FaUniversity, FaBullseye  } from "react-icons/fa"
import TransactionList from "./Transactions/TransactionList";

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
         },
         {
            type: TransactionType.INCOME,
            fromSpaces: ["OUTSIDE_MYWALLET"],
            toSpaces: ["ACTIVE_SPACE"]
         },
         {
            type: TransactionType.INTERNAL_TRANSFER,
            fromSpaces: ["ACTIVE_SPACE"],
            toSpaces: [SpaceType.CASH, SpaceType.BANK]
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
            toSpaces: ["OUTSIDE_MYWALLET"]
         },
         {
            type: TransactionType.INCOME,
            fromSpaces: ["OUTSIDE_MYWALLET"],
            toSpaces: ["ACTIVE_SPACE"]
         },
         {
            type: TransactionType.INTERNAL_TRANSFER,
            fromSpaces: ["ACTIVE_SPACE"],
            toSpaces: [SpaceType.CASH, SpaceType.BANK]
         }
      ]
   },
   {
      spaceType: SpaceType.CREDIT_CARD,
      icon: <FaCreditCard />,
      transactionTypes: [
         {
            type: TransactionType.BALANCE_INCREASE, // increase
            toSpaces: ["ACTIVE_SPACE"],
            fromSpaces: ["OUTSIDE_MYWALLET"]
         },
         {
            type: TransactionType.BALANCE_DECREASE, // increase
            toSpaces: ["ACTIVE_SPACE"],
            fromSpaces: ["OUTSIDE_MYWALLET"]
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
            toSpaces: [SpaceType.CASH, SpaceType.BANK]
         },
         {
            type: TransactionType.LOAN_CHARGES,
            fromSpaces: ["ACTIVE_SPACE"],
            toSpaces: [SpaceType.CASH, SpaceType.BANK]
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
            fromSpaces: [SpaceType.CASH, SpaceType.BANK]
         },
         {
            type: TransactionType.LOAN_CHARGES,
            toSpaces: ["ACTIVE_SPACE"],
            fromSpaces: [SpaceType.CASH, SpaceType.BANK]
         }
      ]
   },
   {
      spaceType: SpaceType.SAVING_GOAL,
      icon: <FaBullseye  />,
      transactionTypes: [
         {
            type: TransactionType.SAVING,
            toSpaces: ["ACTIVE_SPACE"],
            fromSpaces: [SpaceType.CASH, SpaceType.BANK]
         },
         {
            type: TransactionType.WITHDRAW,
            fromSpaces: ["ACTIVE_SPACE"],
            toSpaces: [SpaceType.CASH, SpaceType.BANK]
         }
      ]
   },
]

function Transactions() {

   const { spacetype, spaceid } = useParams()
   const [activeSpaceId, setActiveSpaceId] = useState<string | undefined>(spaceid)
   const [activeSpaceType, setActiveSpaceType] = useState<string | undefined>(spacetype)
   const { spaces } = useSelector((state: RootState) => state.auth)
   const [inputs, setInputs] = useState<TransactionInfo>({
      type: "",
      amount: 0.0,
      from: null,
      to: null,
      date: getTodayDate(),
      note: "",
      scategory: null,
      pcategory: null,
   });
   const [newOrEditMode, setNewMode] = useState<boolean>(false)
   const [viewMode, setViewMode] = useState<boolean>(false)
   const [editId, setEditId] = useState<string | null>(null)
   // const [canEditTransaction, setCanEditTransaction] = useState<boolean>(false)
   const [transactions, setTransactions] = useState<any[]>([])
   const [total, setTotal] = useState<any>(0)
   const [categories, setCategories] = useState<CategoryInfo[]>([])
   const [page, setPage] = useState<number>(1);
   const [loading, setLoading] = useState<boolean>(false)
   const spaceInfo = transactionTypesInfo.find(info => toStrdSpaceType(activeSpaceType) === info.spaceType) || null
   const { createTransaction, editTransaction, deleteTransaction, getTransactionsByUser } = TransactionService();
   const { getCategories } = CategoryService();
   const pageLimit = 10;

   const [allowedParentCategories, setAllowedParentCategories] = useState<any[]>([])
   const [allowedSubCategories, setAllowedSubCategories] = useState<CategoryInfo[]>([])

   console.log("allowedSubCategories", allowedSubCategories)

   const onView = (transaction: any) => {
      const transactionInfo: TransactionInfo = {
         amount: transaction.amount.$numberDecimal,
         date: transaction.date.split("T")[0],
         from: transaction.from,
         to: transaction.to,
         note: transaction.note,
         pcategory: transaction.pcategory,
         scategory: transaction.scategory,
         type: transaction.type,
         scheduleId: transaction?.scheduleId || null,
         spaceId: transaction.spaceId
      }
      console.log(transaction, transactionInfo);
      setInputs(transactionInfo)
      setEditId(transaction._id)
      const spaceType = spaces.find(space => space.id === transactionInfo.spaceId)?.type
      console.log(transactionInfo.type, transactionInfo.spaceId, spaceType)
      setActiveSpaceType(spaceType);
      setActiveSpaceId(transactionInfo.spaceId)
      setViewMode(true)
   }

   const onNewOrEditMode = () => {
      setViewMode(false)
      setNewMode(true);
   }

   const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target as HTMLInputElement;
      setInputs((prev: TransactionInfo) => {
         return { ...prev, [name]: value }
      });
   }

   const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
   }

   const onNewOrEditSubmit = async () => {
      console.log(inputs)
      if (!activeSpaceId) {
         console.log("No space id found")
         return;
      }
      if (inputs.amount == 0.0) {
         toast.error("Amount is required!")
         return;
      }

      let finalInputs = inputs;
      setLoading(true)
      if (editId) {
         finalInputs = { ...inputs, spaceId: activeSpaceId }
         console.log(finalInputs)
         await editTransaction(editId, finalInputs)
      } else {
         finalInputs = { ...inputs, spaceId: activeSpaceId }
         console.log(finalInputs)
         await createTransaction(finalInputs)
      }
      getTransactionsByUser(spaceid || "", pageLimit, (page - 1) * pageLimit)
         .then(res => {
            setTransactions(res.transactions)
            setTotal(res.total)
         })
         .catch(err => setTransactions([]))
         .finally(() => {
            setLoading(false);
         });
      onCancel();
   }

   const onDelete = async () => {
      if (!editId) return;
      setLoading(true)
      await deleteTransaction(editId)
      getTransactionsByUser(spaceid || "", pageLimit, (page - 1) * pageLimit)
         .then(res => {
            setTransactions(res.transactions)
            setTotal(res.total)
         })
         .catch(err => setTransactions([]))
         .finally(() => {
            setLoading(false);
         });
      onCancel();
   }

   const onCancel = () => {
      setViewMode(false)
      setNewMode(false)
      setEditId(null)
      setActiveSpaceType(spacetype)
      setActiveSpaceId(spaceid)
      setInputs({ type: "", amount: 0.0, from: null, to: null, date: getTodayDate(), note: "", scategory: null, pcategory: null })
   }

   useEffect(() => {
      if (inputs.type == "") return;
      if (spaceInfo?.transactionTypes.find(t => t.type === inputs.type)?.fromSpaces.includes("ACTIVE_SPACE")) {
         setInputs((prev: any) => {
            return { ...prev, from: activeSpaceId }
         });
      }

      else if (spaceInfo?.transactionTypes.find(t => t.type === inputs.type)?.fromSpaces.includes("OUTSIDE_MYWALLET")) {
         setInputs((prev: any) => {
            return { ...prev, from: null }
         });
      }

      if (spaceInfo?.transactionTypes.find(t => t.type === inputs.type)?.toSpaces.includes("ACTIVE_SPACE")) {
         setInputs((prev: any) => {
            return { ...prev, to: activeSpaceId }
         });
      }

      else if (spaceInfo?.transactionTypes.find(t => t.type === inputs.type)?.toSpaces.includes("OUTSIDE_MYWALLET")) {
         setInputs((prev: any) => {
            return { ...prev, to: null }
         });
      }

      const pcategories = categories
         .filter(cat => cat.transactionTypes.includes(inputs.type))
         .map(cat => ({
            parentCategoryId: cat.parentCategoryId,
            parentCategory: cat.parentCategory
         }));
      const distinctpcategories = [...new Map(
         pcategories.map(cat => [cat.parentCategoryId, cat])).values()
      ]
      setAllowedParentCategories(distinctpcategories)
      if (distinctpcategories.length === 1) {
         setInputs((prev: any) => {
            return { ...prev, pcategory: pcategories[0].parentCategoryId }
         })
      }
   }, [inputs.type])

   useEffect(() => {
      console.log("hello", activeSpaceType)
      if (!viewMode) {
         setInputs({ type: "", amount: 0.0, from: null, to: null, date: getTodayDate(), note: "", scategory: null, pcategory: null })
      }
   }, [activeSpaceType])


   console.log(inputs, activeSpaceType, allowedParentCategories)

   useEffect(() => {
      setActiveSpaceId(spaceid)
      setActiveSpaceType(spacetype)
      setLoading(true)

      getCategories(toStrdSpaceType(activeSpaceType))
         .then((res) => setCategories(res))
         .catch((err) => setCategories([]))

      getTransactionsByUser(spaceid || "", pageLimit, (page - 1) * pageLimit)
         .then(res => {
            setTransactions(res.transactions)
            setTotal(res.total)
         })
         .catch(err => setTransactions([]))
         .finally(() => {
            setLoading(false);
         });

   }, [page, spaceid])

   useEffect(() => {
      const scategories = categories
         .filter(cat => cat.parentCategoryId === inputs.pcategory && cat.transactionTypes.includes(inputs.type))
      if (scategories.length === 1) {
         setInputs((prev: any) => {
            return { ...prev, scategory: scategories[0].subCategoryId }
         })
      }
      setAllowedSubCategories(scategories)
   }, [inputs.pcategory])

   if (loading) return <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary">Loading...</h1>

   return (
      <>
         {/* sub header */}
         <div className="flex justify-between items-center">
            <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary">Transactions</h1>
            <div className="flex justify-end gap-3 items-center">
               {
                  (!loading && transactions?.length != 0) && (
                     <>
                        <Button
                           text={`${(page - 1) * pageLimit + 1}-${(page - 1) * pageLimit + (transactions?.length)} of ${total}`}
                           className="max-w-fit bg-transparent pointer-events-none"
                           onClick={() => { }}
                        />
                        <Button
                           text="Prev"
                           className="max-w-fit bg-transparent border border-border-light-primary dark:border-border-dark-primary"
                           onClick={() => setPage(prev => {
                              return prev - 1
                           })}
                           disabled={page == 1}
                        />
                        <Button
                           text="Next"
                           className="max-w-fit bg-transparent border border-border-light-primary dark:border-border-dark-primary"
                           onClick={() => setPage(prev => {
                              return prev + 1
                           })}
                           disabled={page * pageLimit >= total}
                        />
                     </>
                  )
               }

               <Button
                  text="New Transaction"
                  className="max-w-fit"
                  onClick={onNewOrEditMode}
               />
            </div>
         </div>

         {/* new or edit transaction */}
         {
            newOrEditMode && (
               <div
                  className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-opacity-50 overflow-auto p-4 modal-bg pt-10"
               >
                  <div
                     className="relative w-full max-w-lg rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-3"
                  >
                     <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
                        {editId ? "Edit Transaction" : "New Transaction"}
                     </div>
                     <form className="border-t border-b border-border-light-primary dark:border-border-dark-primary" onSubmit={onSubmit}>
                        {/* space */}
                        <div className={spacetype == "all" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">Space:</label>
                           <select
                              className="w-full disabled:opacity-50 p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                              value={`${activeSpaceType}-${activeSpaceId}`}
                              name="type"
                              disabled={editId != null}
                              onChange={(e) => {
                                 const parts = e.target.value.split("-")
                                 setActiveSpaceType(parts[0])
                                 setActiveSpaceId(parts[1])
                              }}
                           >
                              <option key={"all"} value={"all-all"} disabled>
                                 Select Space
                              </option>
                              {
                                 spaces.map((space) => {
                                    return (
                                       <option key={space.id} value={`${space.type}-${space.id}`}>
                                          {space.name.split("_").join(" ")}
                                       </option>
                                    )
                                 })
                              }

                           </select>
                        </div>

                        {/* type */}
                        <div className={activeSpaceType != "all" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">Type:</label>
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
                                 spaceInfo?.transactionTypes.map((t) => {
                                    return (
                                       <option key={t.type} value={t.type}>
                                          {t.type.split("_").join(" ")}
                                       </option>
                                    )
                                 })
                              }

                           </select>
                        </div>

                        {/* from */}
                        <div className={inputs.type != "" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">From space:</label>
                           <select
                              className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50 disabled *:capitalize capitalize"
                              value={inputs.from || ""}
                              name="from"
                              onChange={onInputChange}
                              disabled={spaceInfo?.transactionTypes.find(t => t.type === inputs.type)?.fromSpaces.some(sp => ["ACTIVE_SPACE", "OUTSIDE_MYWALLET"].includes(sp))}
                           >

                              {
                                 spaceInfo?.transactionTypes.find(t => t.type === inputs.type)?.fromSpaces.includes("ACTIVE_SPACE") ? (
                                    <option value={activeSpaceId}>
                                       {spaces.find(s => s.id == activeSpaceId)?.name.split("-").join(" ").toUpperCase()}
                                    </option>
                                 )
                                    : spaceInfo?.transactionTypes.find(t => t.type === inputs.type)?.fromSpaces.includes("OUTSIDE_MYWALLET") ? (
                                       <option value={undefined}>
                                          OUTSIDE SMARTWALLET
                                       </option>
                                    ) :
                                       (
                                          <option value={""} disabled>
                                             Select Space
                                          </option>
                                       )
                              }
                              {
                                 spaces.filter((s) => {
                                    const transactionInfo = spaceInfo?.transactionTypes.find(t => t.type === inputs.type)
                                    return transactionInfo?.fromSpaces.includes(s.type)
                                 }).map((s) => {
                                    return (
                                       <option value={s.id}>
                                          {s.name.split("_").join(" ")}
                                       </option>
                                    )
                                 })
                              }
                           </select>
                        </div>

                        {/* to */}
                        <div className={inputs.type != "" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">To space:</label>
                           <select
                              className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50 *:capitalize capitalize"
                              value={inputs.to || ""}
                              name="to"
                              onChange={onInputChange}
                              disabled={spaceInfo?.transactionTypes.find(t => t.type === inputs.type)?.toSpaces.some(sp => ["ACTIVE_SPACE", "OUTSIDE_MYWALLET"].includes(sp))}
                           >

                              {
                                 spaceInfo?.transactionTypes.find(t => t.type === inputs.type)?.toSpaces.includes("ACTIVE_SPACE") ? (
                                    <option value={activeSpaceId}>
                                       {spaces.find(s => s.id == activeSpaceId)?.name.split("-").join(" ").toUpperCase()}
                                    </option>
                                 )
                                    : spaceInfo?.transactionTypes.find(t => t.type === inputs.type)?.toSpaces.includes("OUTSIDE_MYWALLET") ? (
                                       <option value={undefined}>
                                          OUTSIDE SMARTWALLET
                                       </option>
                                    ) :
                                       (
                                          <option value={""}>
                                             Select Space
                                          </option>
                                       )
                              }
                              {
                                 spaces.filter((s) => {
                                    const transactionInfo = spaceInfo?.transactionTypes.find(t => t.type === inputs.type)
                                    return transactionInfo?.toSpaces.includes(s.type) && s.id != activeSpaceId
                                 }).map((s) => {
                                    return (
                                       <option value={s.id}>
                                          {s.name.split("_").join(" ").toUpperCase()}
                                       </option>
                                    )
                                 })
                              }
                           </select>
                        </div>

                        {/* p category */}
                        <div className={inputs.type != "" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">Category:</label>
                           <select
                              className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50"
                              value={inputs.pcategory || ""}
                              name={"pcategory"}
                              onChange={onInputChange}
                           >
                              {
                                 allowedParentCategories.length > 1 && (
                                    <option value="">Select category</option>
                                 )
                              }
                              {
                                 allowedParentCategories.map(cat => {
                                    return (
                                       <option value={cat.parentCategoryId}>
                                          {cat.parentCategory}
                                       </option>
                                    )
                                 })
                              }
                           </select>
                        </div>

                        {/* sub category */}
                        <div className={inputs.type != "" && inputs.pcategory ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">Sub Category:</label>
                           <select
                              className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50"
                              value={inputs.scategory || ""}
                              name="scategory"
                              onChange={onInputChange}
                           >
                              {
                                 allowedSubCategories.length > 1 && (
                                    <option value="">Select category</option>
                                 )
                              }
                              {
                                 allowedSubCategories.map(cat => {
                                    return (
                                       <option value={cat.subCategoryId}>
                                          {cat.subCategoryName}
                                       </option>
                                    )
                                 })
                              }
                           </select>
                        </div>

                        {/* amount */}
                        <div className={inputs.type != "" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">Amount:</label>
                           <Input
                              name="amount"
                              type="number"
                              placeholder="Enter amount"
                              value={inputs.amount.toString()}
                              onChange={onInputChange}
                              className="mt-1 mb-1"
                           />
                        </div>

                        {/* date */}
                        <div className={inputs.type != "" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">Date:</label>
                           <Input
                              name="date"
                              type="date"
                              placeholder="Enter amount"
                              value={inputs.date.toString()}
                              onChange={onInputChange}
                              className="mt-1 mb-1"
                           />
                        </div>
                        {/* note */}
                        <div className={inputs.type != "" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">Note(*):</label>
                           <Input
                              name="note"
                              type="text"
                              placeholder="Enter note (optional)"
                              value={inputs.note}
                              onChange={onInputChange}
                              className="mt-1 mb-1"
                           />
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
                           text={editId ? "Save" : "Create"}
                           className="max-w-fit ml-3"
                           onClick={onNewOrEditSubmit}
                        />
                     </div>
                  </div>
               </div>
            )
         }

         {/* View Transaction */}
         {
            viewMode && (
               <div
                  className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-opacity-50 overflow-auto p-4 modal-bg pt-10"
               >
                  <div
                     className="relative w-full max-w-lg rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-3"
                  >
                     <div className="flex justify-between shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
                        View Transaction
                        <div className="flex gap-2">
                           {
                              inputs.type != TransactionType.LOAN_PRINCIPAL && (
                                 <>
                                    <Button
                                       text={<FaEdit />}
                                       onClick={onNewOrEditMode}
                                       className="max-w-fit pt-2 pb-2"
                                    />
                                    <Button
                                       text={<FaTrash />}
                                       onClick={onDelete}
                                       className="max-w-fit pt-2 pb-2 hover:!bg-red-600 !bg-red-500"
                                    />
                                 </>
                              )
                           }
                           <Button
                              text={<FaTimes />}
                              onClick={onCancel}
                              className="max-w-fit pt-2 pb-2 !bg-transparent border border-border-light-primary dark:border-border-dark-primary hover:!bg-border-light-primary dark:hover:!bg-border-dark-primary"
                           />
                        </div>
                     </div>
                     <form className="border-t border-border-light-primary dark:border-border-dark-primary" onSubmit={onSubmit}>
                        {/* space */}
                        <div className={spacetype == "all" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">Space:</label>
                           <select
                              className="w-full disabled:opacity-50 p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                              value={`${activeSpaceType}-${activeSpaceId}`}
                              name="type"
                              disabled={true}
                           >
                              <option key={"all"} value={"all-all"} disabled>
                                 Select Space
                              </option>
                              {
                                 spaces.map((space) => {
                                    return (
                                       <option key={space.id} value={`${space.type}-${space.id}`}>
                                          {space.name.split("_").join(" ")}
                                       </option>
                                    )
                                 })
                              }

                           </select>
                        </div>

                        {/* type */}
                        <div className="my-3">
                           <label className="text-text-light-primary dark:text-text-dark-primary">Type:</label>
                           <select
                              className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50"
                              value={inputs.type}
                              name="type"
                              disabled={true}
                           >
                              {
                                 Object.values(TransactionType).map((t) => {
                                    return (
                                       <option value={t} key={t}>
                                          {t.split("_").join(" ")}
                                       </option>
                                    )
                                 })
                              }

                           </select>
                        </div>

                        {/* from */}
                        <div className={inputs.type != "" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">From space:</label>
                           <select
                              className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50 *:capitalize capitalize"
                              value={inputs.from || ""}
                              name="from"
                              disabled={true}
                           >
                              {
                                 spaces.map((s) => {
                                    return (
                                       <option value={s.id}>
                                          {s.name.split("_").join(" ")}
                                       </option>
                                    )
                                 })
                              }
                              <option value={""}>
                                 OUTSIDE WALLET
                              </option>
                           </select>
                        </div>

                        {/* to */}
                        <div className={inputs.type != "" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">To space:</label>
                           <select
                              className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm *:capitalize capitalize disabled:opacity-50"
                              value={inputs.to || ""}
                              name="to"
                              disabled={true}
                           >
                              {
                                 spaces.map((s) => {
                                    return (
                                       <option value={s.id}>
                                          {s.name.split("_").join(" ").toUpperCase()}
                                       </option>
                                    )
                                 })
                              }
                              <option value="">
                                 OUTSIDE WALLET
                              </option>
                           </select>
                        </div>

                        {/* p category */}
                        <div className={inputs.type != "" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">Category:</label>
                           <select
                              className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50"
                              value={inputs.pcategory || ""}
                              name={"pcategory"}
                              disabled={true}
                           >
                              {categories.filter(cat => inputs.pcategory && cat.parentCategoryId == inputs.pcategory).slice(0, 1)?.map((c) => {
                                 return (
                                    <option key={c.parentCategoryId} value={c._id}>
                                       {c.parentCategory}
                                    </option>
                                 );
                              })
                              }

                           </select>
                        </div>

                        {/* sub category */}
                        <div className={inputs.type != "" && inputs.pcategory ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">Sub Category:</label>
                           <select
                              className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50"
                              value={inputs.scategory || ""}
                              name="scategory"
                              disabled={true}
                           >
                              <option value={""}>
                                 Select sub category
                              </option>
                              {
                                 categories.map(c => {
                                    return (
                                       <option value={c.subCategoryId}>
                                          {c.subCategoryName}
                                       </option>
                                    )
                                 })
                              }
                           </select>
                        </div>

                        {/* amount */}
                        <div className={inputs.type != "" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">Amount:</label>
                           <Input
                              name="amount"
                              type="number"
                              placeholder="Enter amount"
                              value={inputs.amount.toString()}
                              onChange={() => { }}
                              className="mt-1 mb-1 disabled:opacity-50"
                              disabled={true}
                           />
                        </div>

                        {/* date */}
                        <div className={inputs.type != "" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">Date:</label>
                           <Input
                              name="date"
                              type="date"
                              placeholder="Enter amount"
                              value={inputs.date.toString()}
                              onChange={() => { }}
                              className="mt-1 mb-1 disabled:opacity-50"
                              disabled={true}
                           />
                        </div>
                        {/* note */}
                        <div className={inputs.type != "" ? `my-3` : `my-3 hidden`}>
                           <label className="text-text-light-primary dark:text-text-dark-primary">Note(*):</label>
                           <Input
                              name="note"
                              type="text"
                              placeholder="Enter note (optional)"
                              value={inputs.note == "" ? "Not provided" : inputs.note}
                              onChange={() => { }}
                              className="mt-1 mb-1 disabled:opacity-50"
                              disabled={true}
                           />
                        </div>
                     </form>
                  </div>
               </div>
            )
         }

         {/* loading */}
         {
            (!loading && transactions?.length == 0) && <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary text-center mt-48">No transactions found!</h1>
         }

         {/* transaction list */}
         <TransactionList
            transactions={transactions}
            categories={categories}
            onClick={onView}
         />
      </>
   )
}

function getTodayDate() {
   const input = new Date();

   const year = input.getFullYear();
   const month = String(input.getMonth() + 1).padStart(2, '0');
   const day = String(input.getDate()).padStart(2, '0');

   const localDate = `${year}-${month}-${day}`;
   return localDate;
}

export default Transactions;
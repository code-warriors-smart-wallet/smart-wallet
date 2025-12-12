import Button from "../../Button";
import Input from "../../Input";
import { useEffect, useState } from 'react';
import { SpaceInfo } from "../../../interfaces/modals"
import { toast } from 'react-toastify';
import { SpaceService } from '../../../services/space.service';
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store/store";
import { capitalize, toStrdSpaceType } from "../../../utils/utils";
import SpaceForm from "./Space/SpaceForm";
import { useParams } from "react-router-dom";
import { getDueDate, getStatementDate } from "./Dashboard/CreditCardSummary";

export enum SpaceType {
   CASH = 'CASH',
   BANK = 'BANK',
   CREDIT_CARD = 'CREDIT_CARD',
   LOAN_LENT = 'LOAN_LENT',
   LOAN_BORROWED = 'LOAN_BORROWED',
   SAVING_GOAL = 'SAVING_GOAL'
}

function Spaces({ onCancel, editSpaceId, summary }: { onCancel: () => void, editSpaceId?: string | null, summary?: any }) {

   const { spacetype } = useParams();
   const [newMode, setNewMode] = useState<boolean>(false)
   const [inputs, setInputs] = useState<SpaceInfo>({
      name: "",
      type: "",
      id: "",
      loanPrincipal: 0.0,
      loanStartDate: null,
      loanEndDate: null,
      creditCardLimit: 0.0,
      statementDate: null,
      dueDate: null,
      targetAmount: 0,
      savedAlready: 0,
      desiredDate: null,
      from: null,
      to: null
   });
   const { createSpace, editSpace, deleteSpace } = SpaceService();
   const { spaces } = useSelector((state: RootState) => state.auth)
   const today = new Date().toISOString().split("T")[0];

   const onNewModeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target as HTMLInputElement;
      setInputs(prev => {
         return { ...prev, [name]: value }
      });
   }

   const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
   }

   const onNewModeSubmit = async () => {
      if (inputs.name == "") {
         toast.error("Name is required!")
         return;
      }
      if (inputs.type == "") {
         toast.error("Type is required!")
         return;
      }
      console.log(inputs)
      if (editSpaceId) {
         await editSpace(editSpaceId, inputs)
         window.location.reload();
      } else {
         await createSpace(inputs)
      }

      // await createSpace(inputs)
      setInputs({ name: "", type: "", id: "", loanPrincipal: 0.0, creditCardLimit: 0.0, from: null, to: null })
      setNewMode(false)
      onCancel()
   }

   const onCancelClick = () => {
      onCancel()
      setInputs({ name: "", type: "", id: "", loanPrincipal: 0.0, creditCardLimit: 0.0, from: null, to: null })
      window.location.reload();
   }

   useEffect(() => {
      if (!editSpaceId) return;
      const strdSpaceType = toStrdSpaceType(spacetype)

      if (strdSpaceType === SpaceType.CASH || strdSpaceType === SpaceType.BANK) {
         const spaceInfo = spaces.find(sp => sp.id === editSpaceId)
         setInputs((prev: any) => {
            return { ...prev, type: spaceInfo?.type, name: spaceInfo?.name }
         })
      } else if (strdSpaceType === SpaceType.LOAN_BORROWED || strdSpaceType === SpaceType.LOAN_LENT) {
         const spaceInfo = summary?.loan[0];
         const loanPrincipalTransaction = summary?.loanPrincipalTransaction;
         const newInputs = {
            ...inputs,
            type: spaceInfo?.type,
            name: spaceInfo?.name,
            loanPrincipal: spaceInfo?.loanPrincipal?.$numberDecimal,
            loanEndDate: spaceInfo?.loanEndDate?.split("T")[0],
            loanStartDate: spaceInfo?.loanStartDate?.split("T")[0],
            from: strdSpaceType === SpaceType.LOAN_LENT ? loanPrincipalTransaction?.from : inputs.from,
            to: strdSpaceType === SpaceType.LOAN_BORROWED ? loanPrincipalTransaction?.to : inputs.to
         }
         console.log("yes", spaceInfo, newInputs)
         setInputs(newInputs)
      } else if (strdSpaceType === SpaceType.CREDIT_CARD) {
         const spaceInfo = summary?.spaceInfo[0];
         const actualDueDate = spaceInfo?.creditCardDueDate?.split("T")[0]
         const actualStatementDate = spaceInfo?.creditCardStatementDate?.split("T")[0]
         const newInputs = {
            ...inputs,
            type: spaceInfo?.type,
            name: spaceInfo?.name,
            creditCardLimit: spaceInfo?.creditCardLimit?.$numberDecimal,
            statementDate: getStatementDate(actualStatementDate, actualDueDate),
            dueDate: getDueDate(actualDueDate)
         }
         console.log("yes", spaceInfo, newInputs)
         setInputs(newInputs)
      }

   }, [editSpaceId])

   return (
      <>
         {/* <div className="flex justify-between items-center">
            <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary">Spaces</h1>
            <Button
               text="New space"
               className="max-w-fit"
               onClick={() => setNewMode(true)}
            />
         </div> */}
         {/* {
            newMode && (
               // <div
               //    className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-opacity-50 overflow-auto p-4 modal-bg pt-10"
               // >
               //    <div
               //       className="relative w-full max-w-lg rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-3"
               //    >
               //       <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
               //          New Space
               //       </div>
               //       <form className="border-t border-b border-border-light-primary dark:border-border-dark-primary" onSubmit={onSubmit}>
               //          <div className="my-3">
               //             <label className="text-text-light-primary dark:text-text-dark-primary">Type:</label>
               //             <select
               //                className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
               //                value={inputs.type}
               //                name="type"
               //                onChange={onNewModeInputChange}
               //             >
               //                <option value={""}>
               //                   Select type
               //                </option>
               //                {
               //                   Object.values(SpaceType).map((st) => {
               //                      return (
               //                         <option value={st}>
               //                            {st.split("_").join(" ")}
               //                         </option>
               //                      )
               //                   })
               //                }

               //             </select>
               //          </div>
               //          <div className="my-3">
               //             <label className="text-text-light-primary dark:text-text-dark-primary">Name:</label>
               //             <Input
               //                name="name"
               //                type="text"
               //                placeholder="Enter the Name"
               //                value={inputs.name}
               //                onChange={onNewModeInputChange}
               //                className="mt-1 mb-1"
               //             />
               //          </div>
               //          {
               //             (inputs.type === SpaceType.LOAN_BORROWED || inputs.type === SpaceType.LOAN_LENT) && (
               //                <>
               //                   <div className="my-3">
               //                      <label className="text-text-light-primary dark:text-text-dark-primary">Loan amount:</label>
               //                      <Input
               //                         name="loanPrincipal"
               //                         type="number"
               //                         placeholder="Enter loan amount"
               //                         value={inputs.loanPrincipal?.toString() || ""}
               //                         onChange={onNewModeInputChange}
               //                         className="mt-1 mb-1"
               //                      />
               //                   </div>
               //                   <div className={`my-3`}>
               //                      <label className="text-text-light-primary dark:text-text-dark-primary">Start Date <span className="text-xs text-red-300 italic">(optional)</span>:</label>
               //                      <Input
               //                         name="loanStartDate"
               //                         type="date"
               //                         placeholder="Enter date"
               //                         value={inputs.loanStartDate?.toString() || ""}
               //                         onChange={onNewModeInputChange}
               //                         className="mt-1 mb-1"
               //                      />
               //                   </div>
               //                   <div className={`my-3`}>
               //                      <label className="text-text-light-primary dark:text-text-dark-primary">Due Date <span className="text-xs text-red-300 italic">(optional)</span>:</label>
               //                      <Input
               //                         name="loanEndDate"
               //                         type="date"
               //                         placeholder="Enter date"
               //                         value={inputs.loanEndDate?.toString() || ""}
               //                         onChange={onNewModeInputChange}
               //                         className="mt-1 mb-1"
               //                      />
               //                   </div>
               //                </>
               //             )
               //          }
               //          {
               //             (inputs.type === SpaceType.LOAN_BORROWED) && (
               //                <div className="my-3">
               //                   <label className="text-text-light-primary dark:text-text-dark-primary">To space:</label>
               //                   <select
               //                      className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
               //                      value={inputs.to || ""}
               //                      name="to"
               //                      onChange={onNewModeInputChange}
               //                   >
               //                      <option value={""}>
               //                         Select to space
               //                      </option>
               //                      {
               //                         spaces.filter(sp => sp.type == SpaceType.BANK || sp.type == SpaceType.CASH).map((sp) => {
               //                            return (
               //                               <option value={sp.id}>
               //                                  {sp.name.split("_").join(" ")}
               //                               </option>
               //                            )
               //                         })
               //                      }
               //                   </select>
               //                </div>
               //             )
               //          }
               //          {
               //             (inputs.type === SpaceType.LOAN_LENT) && (
               //                <div className="my-3">
               //                   <label className="text-text-light-primary dark:text-text-dark-primary">From space:</label>
               //                   <select
               //                      className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
               //                      value={inputs.from || ""}
               //                      name="from"
               //                      onChange={onNewModeInputChange}
               //                   >
               //                      <option value={""}>
               //                         Select from space
               //                      </option>
               //                      {
               //                         spaces.filter(sp => sp.type == SpaceType.BANK || sp.type == SpaceType.CASH).map((sp) => {
               //                            return (
               //                               <option value={sp.id}>
               //                                  {sp.name.split("_").join(" ")}
               //                               </option>
               //                            )
               //                         })
               //                      }
               //                   </select>
               //                </div>
               //             )
               //          }
               //          {
               //             (inputs.type === SpaceType.CREDIT_CARD) && (
               //                <>
               //                   <div className="my-3">
               //                      <label className="text-text-light-primary dark:text-text-dark-primary">Credit card limit:</label>
               //                      <Input
               //                         name="creditCardLimit"
               //                         type="number"
               //                         placeholder="Enter credit card limit"
               //                         value={inputs.creditCardLimit?.toString() || ""}
               //                         onChange={onNewModeInputChange}
               //                         className="mt-1 mb-1"
               //                      />
               //                   </div>
               //                   <div className={`my-3`}>
               //                      <label className="text-text-light-primary dark:text-text-dark-primary">Statement Date <span className="text-xs text-red-300 italic">(optional)</span>:</label>
               //                      <Input
               //                         name="statementDate"
               //                         type="date"
               //                         placeholder="Enter date"
               //                         value={inputs.statementDate?.toString() || ""}
               //                         onChange={onNewModeInputChange}
               //                         className="mt-1 mb-1"
               //                         min={today}
               //                         id="statementDate"
               //                      />
               //                   </div>
               //                   <div className={`my-3`}>
               //                      <label className="text-text-light-primary dark:text-text-dark-primary">Due Date <span className="text-xs text-red-300 italic">(optional)</span>:</label>
               //                      <Input
               //                         name="dueDate"
               //                         type="date"
               //                         placeholder="Enter date"
               //                         value={inputs.dueDate?.toString() || ""}
               //                         onChange={onNewModeInputChange}
               //                         className="mt-1 mb-1"
               //                         min={today}
               //                         id="dueDate"
               //                      />
               //                   </div>
               //                </>
               //             )
               //          }
               //       </form>
               //       <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
               //          <Button
               //             text="Cancel"
               //             className="max-w-fit"
               //             priority="secondary"
               //             onClick={() => setNewMode(false)}
               //          />
               //          <Button
               //             text="Create"
               //             className="max-w-fit ml-3"
               //             onClick={onNewModeSubmit}
               //          />
               //       </div>
               //    </div>
               // </div> */}
         <SpaceForm
            inputs={inputs}
            onAddOrEdit={onNewModeSubmit}
            onCancel={onCancelClick}
            onInputChange={onNewModeInputChange}
            onSubmit={onSubmit}
            spaces={spaces}
            editSpaceId={editSpaceId}
         />
         {/* )
         } */}
         {/* <div className="flex flex-wrap w-full gap-3 mt-4">
            {
               spaces?.map((space) => {
                  return (
                     <div className="flex-1 rounded-sm min-w-48 max-w-64 p-2 border border-border-light-primary dark:border-border-dark-primary">
                        <h1 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary capitalize">{space.name}</h1>
                        <h2 className="text-text-light-secondary dark:text-text-dark-secondary capitalize">{capitalize(space.type.split("_").join("-"))}</h2>
                     </div>
                  )
               })
            }
         </div> */}
      </>
   )
}

export default Spaces;
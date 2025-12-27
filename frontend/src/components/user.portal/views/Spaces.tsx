import { useEffect, useState } from 'react';
import { SpaceInfo } from "../../../interfaces/modals"
import { toast } from 'react-toastify';
import { SpaceService } from '../../../services/space.service';
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store/store";
import { toStrdSpaceType } from "../../../utils/utils";
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

export enum COLLABORATOR_STATUS {
   PENDING = 'PENDING',
   ACCEPTED = 'ACCEPTED',
   REJECTED = 'REJECTED',
   LEFT = 'LEFT',
   REMOVED = 'REMOVED',
}

export const collaboratorStatusInfo = [
  { status: COLLABORATOR_STATUS.PENDING, color: "bg-yellow-500" },
  { status: COLLABORATOR_STATUS.ACCEPTED, color: "bg-green-500" },
  { status: COLLABORATOR_STATUS.REJECTED, color: "bg-red-500" },
  { status: COLLABORATOR_STATUS.LEFT, color: "bg-gray-500" },
];

const defaultSpaceInputs = {
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
      to: null,
      isCollaborative: false,
      collaborator: "",
      newCollaborators: [],
      oldCollaborators: []
   }
function Spaces({ onCancel, editSpaceId, summary }: { onCancel: () => void, editSpaceId?: string | null, summary?: any }) {

   const { spacetype } = useParams();
   const [newMode, setNewMode] = useState<boolean>(false)
   const [inputs, setInputs] = useState<SpaceInfo>(defaultSpaceInputs);
   const { createSpace, editSpace, existsUser, addCollaborator, removeCollaborator } = SpaceService();
   const { spaces } = useSelector((state: RootState) => state.auth)
   const today = new Date().toISOString().split("T")[0];

   const onNewModeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target as HTMLInputElement;

      if (name == "isCollaborative") {
         setInputs(prev => {
            return { ...prev, isCollaborative: (e.target as HTMLInputElement).checked }
         });
      } else {
         setInputs(prev => {
            return { ...prev, [name]: value.trim() }
         });
      }
   }

   const onAddCollaborator = async () => {
      if (editSpaceId) {
         const response = await addCollaborator(editSpaceId, inputs.collaborator)
         if (response) {
            const updatedOldColsList = [...inputs.oldCollaborators, { email: inputs.collaborator, status: "PENDING" }];
            setInputs(prev => {
               return { ...prev, oldCollaborators: updatedOldColsList, collaborator: "" }
            });
         }
      } else if (await existsUser(inputs.collaborator.trim())) {
         const newList = [...inputs.newCollaborators, inputs.collaborator.trim()];
         setInputs(prev => {
            return { ...prev, newCollaborators: newList, collaborator: "" }
         });
      } else {
         toast.error("User not found: " + inputs.collaborator)
      }
   }

   const onRemoveCollaborator = async (collaboratorEmail: string) => {
      if (editSpaceId) {
         if (!confirm(`Are you sure?\nDo you want to remove collaborator ${collaboratorEmail}?`)) {
            return;
         }
         const response = await removeCollaborator(editSpaceId, collaboratorEmail);
         if (response) {
            const updatedOldColsList = inputs.oldCollaborators.filter(col => col.email != collaboratorEmail);
            setInputs(prev => {
               return { ...prev, oldCollaborators: updatedOldColsList }
            });
         }
      } else {
         const newList = inputs.newCollaborators.filter(col => col != collaboratorEmail);
         setInputs(prev => {
            return { ...prev, newCollaborators: newList }
         });
      }
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
         await createSpace({ ...inputs, collaborators: inputs.newCollaborators })
      }

      // await createSpace(inputs)
      setInputs(defaultSpaceInputs)
      setNewMode(false)
      onCancel()
   }

   const onCancelClick = () => {
      onCancel()
      setInputs(defaultSpaceInputs)
      // window.location.reload();
   }

   useEffect(() => {
      if (!editSpaceId) return;
      const strdSpaceType = toStrdSpaceType(spacetype)

      if (strdSpaceType === SpaceType.CASH || strdSpaceType === SpaceType.BANK) {
         const spaceInfo = summary?.spaceInfo
         console.log(spaceInfo);
         setInputs((prev: SpaceInfo) => {
            return {
               ...prev,
               type: spaceInfo?.type,
               name: spaceInfo?.name,
               isCollaborative: spaceInfo?.isCollaborative,
               oldCollaborators: spaceInfo?.collaborators?.map((c: { userId: { email: string; }; status: string; }) => ({
                  email: c.userId?.email || "",
                  status: c.status
               })) || []
            }
         })

         // const spaceInfo = spaces.find(sp => sp.id === editSpaceId)
         // setInputs((prev: any) => {
         //    return { ...prev, type: spaceInfo?.type, name: spaceInfo?.name }
         // })
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
            dueDate: getDueDate(actualDueDate),
         }
         console.log("yes", spaceInfo, newInputs)
         setInputs(newInputs)
      } else if (strdSpaceType === SpaceType.SAVING_GOAL) {
         const spaceInfo = summary?.goal;
         const newInputs = {
            ...inputs,
            type: spaceInfo?.type,
            name: spaceInfo?.name,
            targetAmount: spaceInfo?.targetAmount?.$numberDecimal,
            desiredDate: spaceInfo?.desiredDate?.split("T")[0],
            savedAlready: spaceInfo?.savedAlready,
            isCollaborative: spaceInfo?.isCollaborative,
            oldCollaborators: spaceInfo?.collaborators?.map((c: { userId: { email: string; }; status: string; }) => ({
               email: c.userId?.email || "",
               status: c.status
            })) || []
         }
         console.log("yes", spaceInfo, newInputs)
         setInputs(newInputs)
      }

   }, [editSpaceId])

   return (
      <>
         <SpaceForm
            inputs={inputs}
            onAddOrEdit={onNewModeSubmit}
            onCancel={onCancelClick}
            onInputChange={onNewModeInputChange}
            onSubmit={onSubmit}
            spaces={spaces}
            editSpaceId={editSpaceId}
            onAddCollaborator={onAddCollaborator}
            onRemoveCollaborator={onRemoveCollaborator}
         />
      </>
   )
}

export default Spaces;
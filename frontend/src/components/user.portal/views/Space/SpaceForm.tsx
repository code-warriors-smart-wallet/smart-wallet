import { SpaceInfo, PlanType } from "../../../../interfaces/modals";
import Button from "../../../../components/Button"
import Input from "../../../../components/Input"
import { FaTimes } from "react-icons/fa";
import { SpaceService } from "../../../../services/space.service";
import { COLLABORATOR_STATUS, collaboratorStatusInfo } from "../Spaces";
import { FiRefreshCw } from "react-icons/fi";
import { RootState } from "../../../../redux/store/store";
import { useSelector } from "react-redux";
import { useState } from "react";

enum SpaceType {
    CASH = 'CASH',
    BANK = 'BANK',
    CREDIT_CARD = 'CREDIT_CARD',
    LOAN_LENT = 'LOAN_LENT',
    LOAN_BORROWED = 'LOAN_BORROWED',
    SAVING_GOAL = 'SAVING_GOAL'
}

interface SpaceFormProps {
    inputs: SpaceInfo,
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
    spaces: {
        id: string;
        name: string;
        type: string;
        isCollaborative: boolean;
        isOwner: boolean
    }[],
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    onAddOrEdit: () => void,
    onCancel: () => void,
    editSpaceId: string | null | undefined,
    onAddCollaborator: () => void,
    onRemoveCollaborator: (col: string) => void
}

export const collaborativeSpaceTypes = [SpaceType.CASH, SpaceType.BANK, SpaceType.SAVING_GOAL]

function SpaceForm({ inputs, onInputChange, spaces, onSubmit, onAddOrEdit, onCancel, editSpaceId, onAddCollaborator, onRemoveCollaborator }: SpaceFormProps) {

    const today = new Date().toISOString().split("T")[0];
    const { plan } = useSelector((state: RootState) => state.auth);
    const { createSpaceLoading, addColLoading } = SpaceService()
    const canEdit = spaces.find(sp => sp.id === editSpaceId)?.isOwner;
    console.log(inputs, canEdit)

    return (
        <div
            className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-opacity-50 overflow-auto p-4 modal-bg pt-10"
        >
            <div
                className="relative w-full max-w-lg rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-3"
            >
                <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
                    {
                        editSpaceId ? (
                            canEdit ? "Edit Space" : "View details"
                        ) : "New Space"
                    }
                </div>
                <form className="border-t border-b border-border-light-primary dark:border-border-dark-primary" onSubmit={onSubmit}>
                    {/* type */}
                    <div className="my-3">
                        <label className="text-text-light-primary dark:text-text-dark-primary">Type:</label>
                        <select
                            className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                            value={inputs.type}
                            name="type"
                            onChange={onInputChange}
                            disabled={editSpaceId ? true : false}
                        >
                            <option value={""}>
                                Select type
                            </option>
                            {
                                Object.values(SpaceType).map((st) => {
                                    

                                        <option key={st} value={st}>
                                            {st.split("_").join(" ")}
                                        </option>
                                    )
                                })
                            }

                        </select>
                    </div>

                    {/* name */}
                    <div className="my-3">
                        <label className="text-text-light-primary dark:text-text-dark-primary">Name:</label>
                        <Input
                            name="name"
                            type="text"
                            placeholder="Enter the Name"
                            value={inputs.name}
                            onChange={onInputChange}
                            className="mt-1 mb-1"
                            disabled={!canEdit && editSpaceId != null}
                        />
                    </div>

                    {
                        (inputs.type === SpaceType.LOAN_BORROWED || inputs.type === SpaceType.LOAN_LENT) && (
                            <>
                                <div className="my-3">
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Loan amount:</label>
                                    <Input
                                        name="loanPrincipal"
                                        type="number"
                                        placeholder="Enter loan amount"
                                        value={inputs.loanPrincipal?.toString() || ""}
                                        disabled={canEdit && inputs.plan ? true : false}
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                    />
                                </div>
                                {/* <div className={`my-3`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Start Date <span className="text-xs text-red-300 italic">(optional)</span>:</label>
                                    <Input
                                        name="loanStartDate"
                                        type="date"
                                        placeholder="Enter date"
                                        value={inputs.loanStartDate?.toString() || ""}
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                    />
                                </div>
                                <div className={`my-3`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Due Date <span className="text-xs text-red-300 italic">(optional)</span>:</label>
                                    <Input
                                        name="loanEndDate"
                                        type="date"
                                        placeholder="Enter date"
                                        value={inputs.loanEndDate?.toString() || ""}
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                    />
                                </div> */}
                            </>
                        )
                    }
                    {
                        (inputs.type === SpaceType.LOAN_BORROWED) && (
                            <div className="my-3">
                                <label className="text-text-light-primary dark:text-text-dark-primary">To space:</label>
                                <select
                                    className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                                    value={inputs.to || ""}
                                    name="to"
                                    onChange={onInputChange}
                                >
                                    <option value={""}>
                                        Select to space
                                    </option>
                                    {
                                        spaces.filter(sp => sp.type == SpaceType.BANK || sp.type == SpaceType.CASH).map((sp) => {
                                            return (
                                                <option value={sp.id}>
                                                    {sp.name.split("_").join(" ")}
                                                </option>
                                            )
                                        })
                                    }
                                </select>
                            </div>
                        )
                    }
                    {
                        (inputs.type === SpaceType.LOAN_LENT) && (
                            <div className="my-3">
                                <label className="text-text-light-primary dark:text-text-dark-primary">From space:</label>
                                <select
                                    className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                                    value={inputs.from || ""}
                                    name="from"
                                    onChange={onInputChange}
                                >
                                    <option value={""}>
                                        Select from space
                                    </option>
                                    {
                                        spaces.filter(sp => sp.type == SpaceType.BANK || sp.type == SpaceType.CASH).map((sp) => {
                                            return (
                                                <option value={sp.id}>
                                                    {sp.name.split("_").join(" ")}
                                                </option>
                                            )
                                        })
                                    }
                                </select>
                            </div>
                        )
                    }
                    {
                        (inputs.type === SpaceType.CREDIT_CARD) && (
                            <>
                                <div className="my-3">
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Credit card limit:</label>
                                    <Input
                                        name="creditCardLimit"
                                        type="number"
                                        placeholder="Enter credit card limit"
                                        value={inputs.creditCardLimit?.toString() || ""}
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                    />
                                </div>
                                <div className={`my-3`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Statement Date: <span className="text-xs text-red-300 italic">(optional)</span>:</label>
                                    <Input
                                        name="statementDate"
                                        type="date"
                                        placeholder="Enter date"
                                        value={inputs.statementDate?.toString() || ""}
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                        min={today}
                                        id="statementDate"
                                    />
                                </div>
                                <div className={`my-3`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Due Date: <span className="text-xs text-red-300 italic">(optional)</span>:</label>
                                    <Input
                                        name="dueDate"
                                        type="date"
                                        placeholder="Enter date"
                                        value={inputs.dueDate?.toString() || ""}
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                        min={today}
                                        id="dueDate"
                                    />
                                </div>
                            </>
                        )
                    }
                    {
                        (inputs.type === SpaceType.SAVING_GOAL) && (
                            <>
                                <div className="my-3">
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Target amount:</label>
                                    <Input
                                        name="targetAmount"
                                        type="number"
                                        placeholder="Enter target amount"
                                        value={inputs.targetAmount?.toString() || ""}
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                        disabled={!canEdit && editSpaceId != null}
                                    />
                                </div>
                                {
                                    !editSpaceId && (
                                        <div className="my-3">
                                            <label className="text-text-light-primary dark:text-text-dark-primary">Saved already:</label>
                                            <Input
                                                name="savedAlready"
                                                type="number"
                                                placeholder="Enter the amount you saved already"
                                                value={inputs.savedAlready?.toString() || ""}
                                                onChange={onInputChange}
                                                className="mt-1 mb-1"
                                                disabled={!canEdit && editSpaceId != null}
                                            />
                                        </div>
                                    )
                                }
                                <div className={`my-3`}>
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Desired date</label>
                                    <Input
                                        name="desiredDate"
                                        type="date"
                                        placeholder="Enter date"
                                        value={inputs.desiredDate?.toString() || ""}
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                        min={today}
                                        id="desiredDate"
                                        disabled={!canEdit && editSpaceId != null}
                                    />
                                </div>
                            </>

                        )
                    }

                    {
                        !editSpaceId && collaborativeSpaceTypes.includes(inputs.type as SpaceType) && (
                            <div className="my-3 flex items-center">
                                <input
                                    type="checkbox"
                                    name="isCollaborative"
                                    id="isCollaborative"
                                    onChange={onInputChange}
                                    checked={inputs.isCollaborative}
                                />
                                <label htmlFor="isCollaborative" className="text-text-light-primary dark:text-text-dark-primary ml-2">Collaborative space</label>
                            </div>
                        )
                    }

                    {
                        inputs.isCollaborative && (
                            <div className="border border-border-light-primary dark:border-border-dark-primary p-2 rounded">
                                {
                                    editSpaceId ? (
                                        canEdit ? (
                                            <div className="my-3">
                                                <label className="text-text-light-primary dark:text-text-dark-primary">Invite member:</label>
                                                <Input
                                                    name="collaborator"
                                                    type="text"
                                                    placeholder="Enter the email"
                                                    value={inputs.collaborator}
                                                    onChange={onInputChange}
                                                    className="mt-1 mb-1"
                                                />
                                                <Button
                                                    text={addColLoading ? "Adding" : "Add"}
                                                    className={addColLoading ? "opacity-50 disabled max-w-fit mt-2" : "max-w-fit mt-2"}
                                                    onClick={onAddCollaborator}
                                                />
                                            </div>
                                        ) : null
                                    ) : (
                                        <div className="my-3">
                                            <label className="text-text-light-primary dark:text-text-dark-primary">Invite member:</label>
                                            <Input
                                                name="collaborator"
                                                type="text"
                                                placeholder="Enter the email"
                                                value={inputs.collaborator}
                                                onChange={onInputChange}
                                                className="mt-1 mb-1"
                                            />
                                            <Button
                                                text={addColLoading ? "Adding" : "Add"}
                                                className={addColLoading ? "opacity-50 disabled max-w-fit mt-2" : "max-w-fit mt-2"}
                                                onClick={onAddCollaborator}
                                            />
                                        </div>
                                    )
                                }
                                {
                                    editSpaceId && (
                                        <div className="flex flex-col gap-2">
                                            <h1 className="text-text-light-primary dark:text-text-dark-primary mt-2">Members</h1>
                                            {
                                                inputs.oldCollaborators.map(col => {
                                                    return (
                                                        col.status != COLLABORATOR_STATUS.LEFT && col.status != COLLABORATOR_STATUS.REMOVED && (
                                                            <div key={col.email} className="border border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary p-2 rounded flex items-center justify-between *:text-sm">
                                                                <p>
                                                                    <span className="mr-3">{col.email}</span>
                                                                    <span className={`px-2 py-1 ${collaboratorStatusInfo.find(info => info.status === col.status)?.color || "bg-yellow-500"} rounded-md`}>
                                                                        {col.status}
                                                                    </span>
                                                                </p>
                                                                {
                                                                    canEdit && (
                                                                        <>
                                                                            <FaTimes
                                                                                className="cursor-pointer"
                                                                                onClick={() => onRemoveCollaborator(col.email)}
                                                                                title="Remove member"
                                                                            />
                                                                        </>
                                                                    )
                                                                }
                                                            </div>
                                                        )

                                                    )
                                                })
                                            }
                                        </div>
                                    )
                                }
                                <div className="flex flex-col gap-2">
                                    {
                                        inputs.newCollaborators.map(col => {
                                            return (
                                                <div key={col} className="border border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary p-2 rounded flex items-center justify-between">
                                                    <p>{col}</p>
                                                    <FaTimes
                                                        onClick={() => onRemoveCollaborator(col)}
                                                    />
                                                </div>
                                            )
                                        })
                                    }
                                </div>

                            </div>
                        )
                    }
                </form>
                {
                    editSpaceId ? (
                        canEdit ? (
                            <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
                                <Button
                                    text="Cancel"
                                    className="max-w-fit"
                                    priority="secondary"
                                    onClick={onCancel}
                                />
                                <Button
                                    text={createSpaceLoading ? "Processing" : editSpaceId ? "Save" : "Create"}
                                    className="max-w-fit ml-3"
                                    onClick={onAddOrEdit}
                                />
                            </div>
                        ) : (
                            <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
                                <Button
                                    text="Close"
                                    className="max-w-fit"
                                    priority="secondary"
                                    onClick={onCancel}
                                />
                            </div>
                        )
                    ) : (
                        <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
                            <Button
                                text="Cancel"
                                className="max-w-fit"
                                priority="secondary"
                                onClick={onCancel}
                            />
                            <Button
                                text={createSpaceLoading ? "Processing" : editSpaceId ? "Save" : "Create"}
                                className="max-w-fit ml-3"
                                disabled={
                                    !inputs.type ||
                                    !inputs.name ||
                                    (inputs.type === SpaceType.LOAN_BORROWED && (!inputs.to || !inputs.loanPrincipal)) ||
                                    (inputs.type === SpaceType.LOAN_LENT && (!inputs.from || !inputs.loanPrincipal)) ||
                                    (inputs.type === SpaceType.CREDIT_CARD && !inputs.creditCardLimit) ||
                                    (inputs.type === SpaceType.SAVING_GOAL && !inputs.targetAmount && !inputs.desiredDate)
                                }
                                onClick={onAddOrEdit}
                            />
                        </div>
                    )
                }
            </div>
        </div>
    )

}

export default SpaceForm;
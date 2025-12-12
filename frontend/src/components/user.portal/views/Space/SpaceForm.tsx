import { SpaceInfo } from "@/interfaces/modals"
import Button from "../../../../components/Button"
import { SpaceType } from "../Spaces"
import Input from "../../../../components/Input"

interface SpaceFormProps {
    inputs: SpaceInfo,
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
    spaces: {
        id: string;
        name: string;
        type: SpaceType;
    }[],
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    onAddOrEdit: () => void,
    onCancel: () => void,
    editSpaceId: string | null | undefined
}

function SpaceForm({ inputs, onInputChange, spaces, onSubmit, onAddOrEdit, onCancel, editSpaceId }: SpaceFormProps) {

    const today = new Date().toISOString().split("T")[0];
    console.log(inputs)

    return (
        <div
            className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-opacity-50 overflow-auto p-4 modal-bg pt-10"
        >
            <div
                className="relative w-full max-w-lg rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-3"
            >
                <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
                    {editSpaceId ? "Edit Space" : "New Space"}
                </div>
                <form className="border-t border-b border-border-light-primary dark:border-border-dark-primary" onSubmit={onSubmit}>
                    <div className="my-3">
                        <label className="text-text-light-primary dark:text-text-dark-primary">Type:</label>
                        <select
                            className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                            value={inputs.type}
                            name="type"
                            onChange={onInputChange}
                        >
                            <option value={""}>
                                Select type
                            </option>
                            {
                                Object.values(SpaceType).map((st) => {
                                    return (
                                        <option value={st}>
                                            {st.split("_").join(" ")}
                                        </option>
                                    )
                                })
                            }

                        </select>
                    </div>
                    <div className="my-3">
                        <label className="text-text-light-primary dark:text-text-dark-primary">Name:</label>
                        <Input
                            name="name"
                            type="text"
                            placeholder="Enter the Name"
                            value={inputs.name}
                            onChange={onInputChange}
                            className="mt-1 mb-1"
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
                                        onChange={onInputChange}
                                        className="mt-1 mb-1"
                                    />
                                </div>
                                <div className={`my-3`}>
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
                                </div>
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
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Statement Date <span className="text-xs text-red-300 italic">(optional)</span>:</label>
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
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Due Date <span className="text-xs text-red-300 italic">(optional)</span>:</label>
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
                                    />
                                </div>
                            </>

                        )
                    }
                </form>
                <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
                    <Button
                        text="Cancel"
                        className="max-w-fit"
                        priority="secondary"
                        onClick={onCancel}
                    />
                    <Button
                        text={editSpaceId ? "Save" : "Create"}
                        className="max-w-fit ml-3"
                        onClick={onAddOrEdit}
                    />
                </div>
            </div>
        </div>
    )

}

export default SpaceForm;
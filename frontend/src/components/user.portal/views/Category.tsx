import { useParams } from "react-router-dom";
import Button from "../../../components/Button";
import { CategoryService } from "../../../services/category.service";
import { useEffect, useState } from "react";
import { capitalize, generateRandomColor, toStrdSpaceType } from "../../../utils/utils";
import { TransactionType, transactionTypesInfo } from "./Transactions";
import Input from "../../../components/Input";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store/store";
import { toast } from "react-toastify";

enum CategoryType {
    PARENT_CATEGORY = "PARENT_CATEGORY",
    SUB_CATEGORY = "SUB_CATEGORY"
}

interface SubCategoryInfo {
    type: CategoryType,
    parentCategoryId: string,
    subCategoryName: string,
    parentCategoryName: string,
    subCategorycolor: string,
    parentCategorycolor: string,
    transactionType: "",
    subCategories: {
        subCategoryName: string,
        subCategorycolor: string,
        transactionTypes: string[],
    }[]
}

function Category() {
    const { spacetype, spaceid } = useParams();
    const { getCategories, getCategoriesBySpace, createSubCategory, updateSubCategory, deleteSubCategory, createMainCategory } = CategoryService();
    const [categories, setCategories] = useState<any[]>([])
    const [parentCategories, setParentCategories] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [newOrEditMode, setNewOrEditMode] = useState<boolean>(false)
    const [inputs, setInputs] = useState<SubCategoryInfo>({
        type: CategoryType.SUB_CATEGORY,
        parentCategoryId: "",
        subCategoryName: "",
        parentCategoryName: "",
        subCategorycolor: generateRandomColor(),
        parentCategorycolor: generateRandomColor(),
        transactionType: "",
        subCategories: []
    });
    const [editPid, setEditPid] = useState<string | null>(null)
    const [editSid, setEditSid] = useState<string | null>(null)
    const [allowedTransactionTypesToDisplay, setAllowedTransactionTypesToDisplay] = useState<TransactionType[]>([])
    const [allowedTransactionTypesToCreate, setAllowedTransactionTypesToCreate] = useState<TransactionType[]>([])
    const { username, spaces } = useSelector((state: RootState) => state.auth)
    const currentSpace = spaces.find(sp => sp.id === spaceid);


    const fetchCategories = () => {
        setLoading(true)
        if (spacetype === "all") {
            getCategories()
                .then((res) => {
                    console.log(res)
                    setCategories(res)
                    const distinctpcategories = [...new Map(
                        res.map(cat => [cat.parentCategoryId, cat])).values()
                    ]
                    setParentCategories(distinctpcategories)
                })
                .catch((err) => setCategories([]))
                .finally(() => setLoading(false))
        } else {
            getCategoriesBySpace(spaceid || "")
                .then((res) => {
                    setCategories(res)
                    const distinctpcategories = [...new Map(
                        res.map(cat => [cat.parentCategoryId, cat])).values()
                    ]
                    setParentCategories(distinctpcategories)
                })
                .catch((err) => setCategories([]))
                .finally(() => setLoading(false))
        }
    }

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target as HTMLInputElement;
        setInputs((prev: SubCategoryInfo) => {
            return { ...prev, [name]: value }
        });
    }

    const onNewOrEditMode = () => {
        setNewOrEditMode(true);
    }

    const onEditMode = (category: any) => {
        setInputs({
            type: CategoryType.SUB_CATEGORY,
            parentCategoryId: category.parentCategoryId,
            subCategoryName: category.subCategoryName,
            parentCategoryName: "",
            subCategorycolor: category.subCategoryColor,
            parentCategorycolor: generateRandomColor(),
            transactionType: category.transactionTypes[0],
            subCategories: []
        })
        setNewOrEditMode(true);
        setEditSid(category.subCategoryId)
        setEditPid(category.parentCategoryId)
    }

    const onRemove = (name: string) => {
        const newCategories = inputs.subCategories.filter(cat => cat.subCategoryName !== name)
        setInputs((prev) => ({
            ...prev,
            subCategories: newCategories,
        }));
    }

    const onAdd = () => {
        if (inputs.subCategoryName == "") {
            toast.error("Sub category name is required!")
            return;
        }

        if (inputs.subCategorycolor == "") {
            toast.error("Color is required!")
            return;
        }

        if (inputs.transactionType == "") {
            toast.error("Transaction type is required!")
            return;
        }

        console.log(inputs)
        const existingCategory = inputs.subCategories.filter(cat => cat.subCategoryName === inputs.subCategoryName)

        if (existingCategory.length != 0) {
            toast.error(`'${inputs.subCategoryName}' category already exists!`)
            return;
        }

        const subCategory = {
            subCategorycolor: inputs.subCategorycolor,
            subCategoryName: inputs.subCategoryName,
            transactionTypes: [inputs.transactionType]
        };

        setInputs((prev) => ({
            ...prev,
            subCategories: [...prev.subCategories, subCategory],
            subCategorycolor: generateRandomColor(),
            subCategoryName: "",
            transactionType: ""
        }));
    };

    const onCancel = () => {
        setNewOrEditMode(false)
        setEditPid(null)
        setEditSid(null)
        setInputs({
            type: CategoryType.SUB_CATEGORY,
            parentCategoryId: "",
            parentCategoryName: "",
            subCategoryName: "",
            subCategorycolor: "",
            parentCategorycolor: "",
            transactionType: "",
            subCategories: []
        })
    }

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    }

    const onNewOrEditSubmit = async () => {
        console.log(inputs)
        let finalInputs = {}
        if (inputs.type === CategoryType.SUB_CATEGORY) {
            if (inputs.subCategoryName == "") {
                toast.error("Sub category name is required!")
                return;
            }

            if (inputs.parentCategoryId == "") {
                toast.error("Main category is required!")
                return;
            }

            if (inputs.subCategorycolor == "") {
                toast.error("Sub category color is required!")
                return;
            }

            if (inputs.transactionType == "") {
                toast.error("Transaction type is required!")
                return;
            }

            finalInputs = {
                subCategoryName: inputs.subCategoryName,
                parentCategoryId: inputs.parentCategoryId,
                subCategorycolor: inputs.subCategorycolor,
                transactionType: inputs.transactionType
            }
        } else if (inputs.type === CategoryType.PARENT_CATEGORY) {
            if (inputs.parentCategoryName == "") {
                toast.error("Main category name is required!")
                return;
            }

            if (inputs.parentCategorycolor == "") {
                toast.error("Main category color is required!")
                return;
            }

            if (inputs.subCategories.length == 0) {
                toast.error("At least one sub category is required to create main category!")
                return;
            }

            finalInputs = {
                spaces: [toStrdSpaceType(spacetype)],
                parentCategory: inputs.parentCategoryName,
                color: inputs.parentCategorycolor,
                subCategories: inputs.subCategories,
            }
        }
        console.log(finalInputs)

        setLoading(true)
        if (editSid && editPid) {
            finalInputs = {
                oldParentCategoryId: editPid,
                newParentCategoryId: inputs.parentCategoryId,
                subCategoryId: editSid,
                name: inputs.subCategoryName,
                color: inputs.subCategorycolor,
                transactionTypes: [inputs.transactionType]
            }
            console.log(">>", finalInputs)
            await updateSubCategory(finalInputs)
        } else {
            if (inputs.type === CategoryType.SUB_CATEGORY) {
                await createSubCategory(finalInputs)
            }
            else if (inputs.type === CategoryType.PARENT_CATEGORY) {
                await createMainCategory(finalInputs)
            }
        }
        fetchCategories();
        setAllowedTransactionTypesToDisplay(findAllowedTransactionTypes() || [])
        setAllowedTransactionTypesToCreate(findAllowedTransactionTypesToCreate() || [])
        onCancel();
    }
    const findAllowedTransactionTypes = () => {
        if (spacetype === "all") {
            // return [TransactionType.INCOME, TransactionType.EXPENSE ,TransactionType.INTERNAL_TRANSFER, TransactionType.BALANCE_DECREASE, TransactionType.BALANCE_INCREASE]
            return Object.values(TransactionType)
        } else {
            return transactionTypesInfo.find(info => info.spaceType === toStrdSpaceType(spacetype))?.transactionTypes.map(type => type.type)
        }
    }

    const findAllowedTransactionTypesToCreate = () => {
        if (spacetype === "all") {
            return [TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.INTERNAL_TRANSFER, TransactionType.BALANCE_DECREASE, TransactionType.BALANCE_INCREASE]
        } else {
            return transactionTypesInfo.find(info => info.spaceType === toStrdSpaceType(spacetype))?.transactionTypes.map(type => type.type)
        }
    }

    const onDelete = async (pid: string, sid: string) => {
        await deleteSubCategory(pid, sid);
        fetchCategories();
        setAllowedTransactionTypesToDisplay(findAllowedTransactionTypes() || [])
        setAllowedTransactionTypesToCreate(findAllowedTransactionTypesToCreate() || [])
        onCancel();
    }

    useEffect(() => {
        fetchCategories();
        setAllowedTransactionTypesToDisplay(findAllowedTransactionTypes() || [])
        setAllowedTransactionTypesToCreate(findAllowedTransactionTypesToCreate() || [])
    }, [spacetype, spaceid])

    if (loading) return <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary">Loading...</h1>

    return (
        <>
            {/* header */}
            <div className="flex justify-between items-center">
                <h1 className="text-xl text-text-light-primary dark:text-text-dark-primary">Categories</h1>
                {
                    !toStrdSpaceType(spacetype).startsWith("LOAN") && (
                        <Button
                            text="New Category"
                            className="max-w-fit"
                            onClick={onNewOrEditMode}
                        />
                    )
                }
            </div>

            {/* category list */}
            <div className="*:text-text-light-primary *:dark:text-text-dark-primary mt-4">
                <div className="w-full">
                    <div className="w-full overflow-x-auto">
                        <h2 className="my-2 font-bold">Categories Managed by you</h2>
                        {
                            categories
                                .filter(cat =>
                                    cat.transactionTypes.find((type: TransactionType) => allowedTransactionTypesToDisplay.includes(type))
                                    && (
                                        (spacetype === "all" && cat.userId) || (spacetype !== "all" && cat?.user?.username)
                                    )).length > 0 ? (
                                <table className="min-w-xl w-full border-collapse">
                                    <thead>
                                        <tr className="bg-transparent  p-2 *:p-2 *:font-bold text-primary *:border-b *:border-b-border-light-primary *:dark:border-b-border-dark-primary">
                                            <td>Main Category</td>
                                            <td>Sub Category</td>
                                            <td>Transaction Type</td>
                                            <td>Color</td>
                                            <td>Actions</td>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent text-text-light-primary dark:text-text-dark-primary text-sm *:hover:bg-hover-light-primary *:hover:dark:bg-hover-dark-primary *:border-b *:border-b-border-light-primary *:dark:border-b-border-dark-primary">
                                        {
                                            categories
                                                .filter(cat =>
                                                    cat.transactionTypes.find((type: TransactionType) => allowedTransactionTypesToDisplay.includes(type))
                                                    && (
                                                        (
                                                            (spacetype === "all" && cat.userId) || (spacetype !== "all" && cat?.user?.username)
                                                        )
                                                    ))
                                                .map((cat, index) => {
                                                    return (
                                                        <tr key={`${cat.subCategoryId}`} className="*:p-2 hover:!bg-transparent cursor-pointer" style={{ backgroundColor: cat.color + "30" }}>
                                                            <td className="font-bold capitalize">{cat.parentCategory}</td>
                                                            <td className="capitalize">{cat.subCategoryName}</td>
                                                            <td className="capitalize">
                                                                {
                                                                    cat.transactionTypes
                                                                        .find((type: TransactionType) => allowedTransactionTypesToDisplay.includes(type))?.split("_").join(" ")
                                                                }
                                                            </td>
                                                            <td>
                                                                <span style={{ backgroundColor: cat.subCategoryColor }} className="w-15 h-3 inline-block"></span>
                                                            </td>
                                                            <td className="flex gap-2">
                                                                <Button
                                                                    text="Edit"
                                                                    className="max-w-fit pt-1 pb-1 px-2"
                                                                    disabled={spacetype !== "all" ? cat?.user?.username !== username : false}
                                                                    onClick={() => onEditMode(cat)}
                                                                />
                                                                <Button
                                                                    text="Delete"
                                                                    className="max-w-fit pt-1 pb-1 px-2 hover:!bg-red-600 !bg-red-500"
                                                                    disabled={spacetype !== "all" ? cat?.user?.username !== username : false}
                                                                    onClick={() => onDelete(cat.parentCategoryId, cat.subCategoryId)}
                                                                />
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                        }
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">You do not have any categories!</p>

                            )
                        }

                        <h2 className="my-2 mt-7 font-bold">Categories Managed by the system</h2>
                        <table className="min-w-xl w-full border-collapse">
                            <thead>
                                <tr className="bg-transparent  p-2 *:p-2 *:font-bold text-primary *:border-b *:border-b-border-light-primary *:dark:border-b-border-dark-primary">
                                    <td>Main Category</td>
                                    <td>Sub Category</td>
                                    <td>Transaction Type</td>
                                    <td>Color</td>
                                </tr>
                            </thead>
                            <tbody className="bg-transparent text-text-light-primary dark:text-text-dark-primary text-sm *:hover:bg-hover-light-primary *:hover:dark:bg-hover-dark-primary *:border-b *:border-b-border-light-primary *:dark:border-b-border-dark-primary">
                                {
                                    categories
                                        .filter(cat => 
                                            cat.transactionTypes.find((type: TransactionType) => allowedTransactionTypesToDisplay.includes(type)) 
                                            && (!cat?.user?.username && !cat.userId))
                                        .map((cat, index) => {
                                            return (
                                                <tr key={`${cat.subCategoryId}`} className="*:p-2 hover:!bg-transparent cursor-pointer" style={{ backgroundColor: cat.color + "30" }}>
                                                    <td className="font-bold capitalize">{cat.parentCategory}</td>
                                                    <td className="capitalize">{cat.subCategoryName}</td>
                                                    <td className="capitalize">
                                                        {
                                                            cat.transactionTypes
                                                                .find((type: TransactionType) => allowedTransactionTypesToDisplay.includes(type))?.split("_").join(" ")
                                                        }
                                                    </td>
                                                    <td>
                                                        <span style={{ backgroundColor: cat.subCategoryColor }} className="w-15 h-3 inline-block"></span>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* new or edit category */}
            {
                newOrEditMode && (
                    <div
                        className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-opacity-50 overflow-auto p-4 modal-bg pt-10"
                    >
                        <div
                            className="relative w-full max-w-lg rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-3"
                        >
                            <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
                                {editSid && editPid ? "Edit Category" : "New Category"}
                            </div>
                            <form className="border-t border-b border-border-light-primary dark:border-border-dark-primary" onSubmit={onSubmit}>
                                {/* type */}
                                <div className="my-3">
                                    <label className="text-text-light-primary dark:text-text-dark-primary">Type:</label>
                                    <select
                                        className="w-full p-3 disabled:opacity-50 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                                        value={inputs.type}
                                        name="type"
                                        onChange={onInputChange}
                                        disabled={editPid != null && editSid != null}
                                    >
                                        {
                                            Object.values(CategoryType).map((type) => {
                                                return (
                                                    <option value={type}>
                                                        {capitalize(type.split("_").join(" "))}
                                                    </option>
                                                )
                                            })
                                        }

                                    </select>
                                </div>

                                {/* p category */}
                                {
                                    inputs.type === CategoryType.SUB_CATEGORY ? (
                                        <div className={`my-3`}>
                                            <label className="text-text-light-primary dark:text-text-dark-primary">Main Category:</label>
                                            <select
                                                className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm disabled:opacity-50"
                                                value={inputs.parentCategoryId || ""}
                                                name={"parentCategoryId"}
                                                onChange={onInputChange}
                                            >
                                                <option value="">Select main category</option>
                                                {
                                                    parentCategories.map((cat) => {
                                                        return (
                                                            <option value={cat.parentCategoryId}>
                                                                {cat.parentCategory}
                                                            </option>
                                                        )
                                                    })
                                                }
                                            </select>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`my-3`}>
                                                <label className="text-text-light-primary dark:text-text-dark-primary">Main Category name:</label>
                                                <Input
                                                    name="parentCategoryName"
                                                    type="text"
                                                    placeholder="Enter main category name"
                                                    value={inputs.parentCategoryName.toString()}
                                                    onChange={onInputChange}
                                                    className="mt-1 mb-1"
                                                />
                                            </div>
                                            {/* color */}
                                            <div className={`my-3`}>
                                                <label className="text-text-light-primary dark:text-text-dark-primary">Main category color:</label>
                                                <input
                                                    name="parentCategorycolor"
                                                    type="color"
                                                    placeholder="Enter color"
                                                    value={inputs.parentCategorycolor.toString()}
                                                    onChange={onInputChange}
                                                    className="w-full"
                                                />
                                            </div>
                                        </>
                                    )
                                }

                                {
                                    inputs.type === CategoryType.SUB_CATEGORY ? (
                                        <>
                                            {/* sub category name */}
                                            <div className={`my-3`}>
                                                <label className="text-text-light-primary dark:text-text-dark-primary">Sub category name:</label>
                                                <Input
                                                    name="subCategoryName"
                                                    type="text"
                                                    placeholder="Enter sub category name"
                                                    value={inputs.subCategoryName.toString()}
                                                    onChange={onInputChange}
                                                    className="mt-1 mb-1"
                                                />
                                            </div>

                                            {/* Transaction type */}
                                            <div className="my-3">
                                                <label className="text-text-light-primary dark:text-text-dark-primary">Transaction type:</label>
                                                <select
                                                    className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                                                    value={inputs.transactionType}
                                                    name="transactionType"
                                                    onChange={onInputChange}
                                                >
                                                    <option value={""}>
                                                        Select transaction type
                                                    </option>
                                                    {
                                                        allowedTransactionTypesToCreate.map((type) => {
                                                            return (
                                                                <option value={type}>
                                                                    {type.split("_").join(" ")}
                                                                </option>
                                                            )
                                                        })
                                                    }

                                                </select>
                                            </div>

                                            {/* color */}
                                            <div className={`my-3`}>
                                                <label className="text-text-light-primary dark:text-text-dark-primary">Sub category color:</label>
                                                <input
                                                    name="subCategorycolor"
                                                    type="color"
                                                    placeholder="Enter color"
                                                    value={inputs.subCategorycolor.toString()}
                                                    onChange={onInputChange}
                                                    className="w-full"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-2 border border-border-light-primary dark:border-border-dark-primary rounded my-2">
                                            <h3 className="text-xl text-text-light-primary dark:text-text-dark-primary">Sub categories</h3>

                                            {
                                                inputs.subCategories.map((cat) => {
                                                    return (
                                                        <div
                                                            style={{
                                                                borderWidth: 1,
                                                                borderColor: cat.subCategorycolor,
                                                                color: cat.subCategorycolor,
                                                                backgroundColor: cat.subCategorycolor + "10",
                                                            }}
                                                            className="w-full rounded py-1 px-2 mt-2 flex items-center justify-between *:text-sm"
                                                        >
                                                            <span>{capitalize(cat.subCategoryName)} - {cat.transactionTypes[0].split("_").join(" ")}</span>
                                                            <Button
                                                                text="Remove"
                                                                className="max-w-fit pt-1 pb-1 px-2"
                                                                onClick={() => onRemove(cat.subCategoryName)}
                                                            />
                                                        </div>
                                                    )
                                                })
                                            }

                                            {/* sub category name */}
                                            <div className={`my-3`}>
                                                <label className="text-text-light-primary dark:text-text-dark-primary">Sub category name:</label>
                                                <Input
                                                    name="subCategoryName"
                                                    type="text"
                                                    placeholder="Enter sub category name"
                                                    value={inputs.subCategoryName.toString()}
                                                    onChange={onInputChange}
                                                    className="mt-1 mb-1"
                                                />
                                            </div>

                                            {/* Transaction type */}
                                            <div className="my-3">
                                                <label className="text-text-light-primary dark:text-text-dark-primary">Transaction type:</label>
                                                <select
                                                    className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                                                    value={inputs.transactionType}
                                                    name="transactionType"
                                                    onChange={onInputChange}
                                                >
                                                    <option value={""}>
                                                        Select transaction type
                                                    </option>
                                                    {
                                                        allowedTransactionTypesToCreate.map((type) => {
                                                            return (
                                                                <option value={type}>
                                                                    {type.split("_").join(" ")}
                                                                </option>
                                                            )
                                                        })
                                                    }

                                                </select>
                                            </div>

                                            {/* color */}
                                            <div className={`my-3`}>
                                                <label className="text-text-light-primary dark:text-text-dark-primary">Sub category color:</label>
                                                <input
                                                    name="subCategorycolor"
                                                    type="color"
                                                    placeholder="Enter color"
                                                    value={inputs.subCategorycolor.toString()}
                                                    onChange={onInputChange}
                                                    className="w-full"
                                                />
                                            </div>

                                            <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
                                                <Button
                                                    text={"Add"}
                                                    className="max-w-fit ml-3"
                                                    onClick={onAdd}
                                                />
                                            </div>
                                        </div>
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
                                    text={editPid && editSid ? "Save" : "Create"}
                                    className="max-w-fit ml-3"
                                    onClick={onNewOrEditSubmit}
                                />
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    )

}

export default Category;
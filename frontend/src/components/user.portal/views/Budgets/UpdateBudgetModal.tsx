import React from "react";
import Button from "../../../Button";

interface UpdateBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectScope: (scope: 'current' | 'future' | 'all') => void;
    budgetType: string;
    currentPeriod: string;
}

const UpdateBudgetModal: React.FC<UpdateBudgetModalProps> = ({
    isOpen,
    onClose,
    onSelectScope,
    budgetType,
    currentPeriod
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed top-0 left-0 w-screen h-screen z-[1001] grid place-items-center bg-black/50 overflow-auto p-4">
            <div className="relative w-full max-w-md rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-6">
                <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
                    Update Budget Amount
                </div>

                <div className="space-y-4">
                    <p className="text-text-light-primary dark:text-text-dark-primary">
                        How would you like to apply the amount change?
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => onSelectScope('current')}
                            className="w-full p-4 text-left border border-border-light-primary dark:border-border-dark-primary rounded-lg hover:bg-bg-light-primary dark:hover:bg-bg-dark-primary transition-colors cursor-pointer"
                        >
                            <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                                This {budgetType.toLowerCase()} only
                            </div>
                            <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
                                Update only {currentPeriod}
                            </div>
                        </button>

                        <button
                            onClick={() => onSelectScope('future')}
                            className="w-full p-4 text-left border border-border-light-primary dark:border-border-dark-primary rounded-lg hover:bg-bg-light-primary dark:hover:bg-bg-dark-primary transition-colors cursor-pointer"
                        >
                            <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                                This and all future {budgetType.toLowerCase()}s
                            </div>
                            <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
                                Update from {currentPeriod} onwards (including current period)
                            </div>
                        </button>

                        <button
                            onClick={() => onSelectScope('all')}
                            className="w-full p-4 text-left border border-border-light-primary dark:border-border-dark-primary rounded-lg hover:bg-bg-light-primary dark:hover:bg-bg-dark-primary transition-colors cursor-pointer"
                        >
                            <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                                All {budgetType.toLowerCase()}s (past and future)
                            </div>
                            <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
                                Update all periods including past ones
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center pt-6 justify-end space-x-3">
                    <Button
                        text="Cancel"
                        className="max-w-fit cursor-pointer"
                        priority="secondary"
                        onClick={onClose}
                        type="button"
                    />
                </div>
            </div>
        </div>
    );
};

export default UpdateBudgetModal;
import React from "react";
import Button from "../../../Button";
import { BudgetType, BudgetInfo } from "../Budget";
import { capitalize } from "../../../../utils/utils";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  inputs: BudgetInfo;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubCategoryToggle: (subCategoryId: string) => void;
  selectAllSubCategories: () => void;
  clearAllSubCategories: () => void;
  filteredCategories: any[];
  filteredSubCategories: any[];
  selectedSubCategories: Set<string>;
  editId: string | null;
  loading: boolean;
  getTodayDate: () => string;
  allowedSpaces: any[];
  showSpaceField: boolean;
  isAllSpacesMode: boolean;
  selectedSpaceForAllSpaces: string;
}

const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  inputs,
  onInputChange,
  onSubCategoryToggle,
  selectAllSubCategories,
  clearAllSubCategories,
  filteredCategories,
  filteredSubCategories,
  selectedSubCategories,
  editId,
  loading,
  getTodayDate,
  allowedSpaces,
  showSpaceField,
  isAllSpacesMode,
  selectedSpaceForAllSpaces
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-black/50 overflow-auto p-4 pt-10">
      <div className="relative w-full max-w-2xl rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-6">
        <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
          {editId ? "Edit Budget" : "New Budget"}
        </div>

        {(inputs.spaceId || (isAllSpacesMode && selectedSpaceForAllSpaces)) && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
              <span className="font-medium">
                {editId ? "Updating budget for:" : "Creating budget for:"}
              </span>{" "}
              {(() => {
                const spaceId = inputs.spaceId || selectedSpaceForAllSpaces;
                const space = allowedSpaces.find(s => s.id === spaceId);

                return space
                  ? `${capitalize(space.name)} - ${capitalize(space.type.replace("_", " "))}`
                  : "Selected Space";
              })()}
            </p>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            {/* Budget Name */}
            <div>
              <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                Budget Name <span className="text-red-500">*</span>:
              </label>
              <input
                name="name"
                type="text"
                placeholder="Enter budget name"
                value={inputs.name}
                onChange={onInputChange}
                className="w-full p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                required
              />
            </div>

            {/* Budget Type */}
            <div>
              <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                Budget Type <span className="text-red-500">*</span>:
              </label>
              <select
                name="type"
                value={inputs.type}
                onChange={onInputChange}
                className="w-full p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                required
              >
                {Object.values(BudgetType).map((type) => (
                  <option key={type} value={type}>
                    {capitalize(type.toLowerCase().replace('_', ' '))}
                  </option>
                ))}
              </select>
            </div>

            {/* Space Selection (only for "all" view) */}
            {showSpaceField && (
              <div>
                <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                  Space <span className="text-red-500">*</span>:
                </label>
                <select
                  name="spaceId"
                  value={inputs.spaceId}
                  onChange={onInputChange}
                  className="w-full p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                  required
                >
                  <option value="">Select a space</option>
                  {allowedSpaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {capitalize(space.name)} - {capitalize(space.type.replace('_', ' '))}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  Budgets can only be created for Cash, Bank, or Credit Card spaces
                </p>
              </div>
            )}

            {filteredCategories.length > 0 ? (
              <>
                {/* Main Category Selection */}
                <div>
                  <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                    Main Category <span className="text-red-500">*</span>:
                  </label>
                  <select
                    name="mainCategoryId"
                    value={inputs.mainCategoryId}
                    onChange={onInputChange}
                    className="w-full p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                    required
                  >
                    <option value="">Select a main category</option>
                    {filteredCategories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.parentCategory}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub-categories Selection */}
                {inputs.mainCategoryId && filteredSubCategories.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-text-light-primary dark:text-text-dark-primary">
                        Sub-categories:
                      </label>
                      <div className="flex gap-2">
                        <Button
                          text="Select All"
                          className="max-w-fit text-xs cursor-pointer"
                          priority="secondary"
                          onClick={selectAllSubCategories}
                        />
                        <Button
                          text="Clear All"
                          className="max-w-fit text-xs cursor-pointer"
                          priority="secondary"
                          onClick={clearAllSubCategories}
                        />
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-border-light-primary dark:border-border-dark-primary rounded-md p-3">
                      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">
                        {selectedSubCategories.size === 0 ? (
                          <span className="text-blue-600 dark:text-blue-400 italic">
                            Budget will apply to All sub-categories under {filteredCategories.find(cat => cat._id === inputs.mainCategoryId)?.parentCategory}
                          </span>
                        ) : selectedSubCategories.size === filteredSubCategories.length ? (
                          <span className="text-green-600 dark:text-green-400 italic">
                            Budget will apply to All sub-categories under {filteredCategories.find(cat => cat._id === inputs.mainCategoryId)?.parentCategory}
                          </span>
                        ) : (
                          `Selected ${selectedSubCategories.size} of ${filteredSubCategories.length} sub-categories`
                        )}
                      </p>

                      <div className="space-y-2">
                        {filteredSubCategories.map((subCategory) => (
                          <label key={subCategory._id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSubCategories.has(subCategory._id)}
                              onChange={() => onSubCategoryToggle(subCategory._id)}
                              className="rounded border-border-light-primary dark:border-border-dark-primary text-primary focus:ring-primary"
                            />
                            <span className="text-text-light-primary dark:text-text-dark-primary capitalize">
                              {capitalize(subCategory.name)}
                            </span>
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: subCategory.color }}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 border border-yellow-200 dark:border-yellow-800 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
                  No categories available for the selected space.
                  Please ensure you have expense categories set up for this space type.
                </p>
              </div>
            )}

            {/* Budget Amount */}
            <div>
              <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                Budget Amount <span className="text-red-500">*</span>:
              </label>
              <input
                name="amount"
                type="number"
                placeholder="Enter budget amount"
                value={inputs.amount.toString()}
                onChange={onInputChange}
                min="0.01"
                step="0.01"
                className="w-full p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                required
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                Start Date <span className="text-red-500">*</span>:
              </label>
              <input
                name="startDate"
                type="date"
                value={inputs.startDate}
                onChange={onInputChange}
                min={getTodayDate()}
                className="w-full p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                required
              />
            </div>

            {/* End Date (auto-calculated) */}
            <div>
              <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">
                End Date (Auto-calculated):
              </label>
              <input
                name="endDate"
                type="date"
                value={inputs.endDate}
                onChange={onInputChange}
                min={inputs.startDate || getTodayDate()}
                className="w-full p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-gray-100 dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary cursor-not-allowed text-sm"
                required
                disabled
              />
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                End date is automatically calculated based on budget type
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 flex-wrap items-center pt-6 justify-end space-x-3">
            <Button
              text="Cancel"
              className="max-w-fit cursor-pointer"
              priority="secondary"
              onClick={onClose}
              type="button"
            />
            <Button
              text={editId ? "Update Budget" : "Create Budget"}
              className="max-w-fit cursor-pointer"
              type="submit"
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </div >
  );
};

export default BudgetModal;

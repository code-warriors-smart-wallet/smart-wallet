import { RootState } from "@/redux/store/store";
import { capitalize, toStrdSpaceType } from "../../utils/utils";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { SpaceType } from "./views/Spaces";
import Button from "../Button";
import { useState } from "react";

function SpaceSelector({ setShowSelectSpacesModal, selectedSpacesInput, onSelect, allowedSpaceTypes }: { setShowSelectSpacesModal: React.Dispatch<React.SetStateAction<boolean>>, selectedSpacesInput: string[], onSelect: (selectedSpaces: { _id: string, name: string, type: string }[]) => void, allowedSpaceTypes?: string[] }) {

    const { spacetype, spaceid } = useParams();
    const activeSpaceType = toStrdSpaceType(spacetype || "");
    const { username, spaces } = useSelector((state: RootState) => state.auth)
    const [selectedSpaces, setSelectedSpaces] = useState<{ _id: string, name: string, type: string }[]>(spaces.filter(space => selectedSpacesInput.includes(space.id)).map(space => ({ _id: space.id, name: space.name, type: space.type })));

    return (
        <main className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-opacity-50 overflow-auto p-4 modal-bg pt-10">

            <div className="relative w-full max-w-lg rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-3 *:text-text-light-primary *:dark:text-text-dark-primary" >

                <h1 className="text-xl py-2 border-b mb-3 border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary">Select Spaces</h1>
                <div className="py-2 flex items-center gap-3">
                    <input
                        type="checkbox"
                        name="all"
                        id="all"
                        checked={selectedSpaces.length === spaces.filter(space => !allowedSpaceTypes || allowedSpaceTypes.includes(space.type)).length}
                        onChange={(e) => {
                            if (e.target.checked) {
                                const allSpaces = spaces.filter(space => !allowedSpaceTypes || allowedSpaceTypes.includes(space.type)).map((space) => ({ _id: space.id, name: space.name, type: space.type }));
                                setSelectedSpaces(allSpaces);
                            } else {
                                setSelectedSpaces([]);
                            }
                        }}
                    />
                    <label htmlFor="all"> Select all spaces</label>
                </div>
                {
                    Object.keys(SpaceType).filter(type => !allowedSpaceTypes || allowedSpaceTypes.includes(type)).map((type) => {
                        const localType = capitalize(type.split("_").join(" "));
                        return (
                            <div key={type} className="py-2 flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name={localType}
                                    id={localType}
                                    checked={selectedSpaces.filter(space => space.type === type).length === spaces.filter(space => space.type === type).length}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            const spacesOfType = spaces.filter(space => space.type === type).map(space => ({ _id: space.id, name: space.name, type: space.type }));
                                            setSelectedSpaces(prev => [...prev, ...spacesOfType]);
                                        } else {
                                            setSelectedSpaces(prev => prev.filter(space => space.type !== type));
                                        }
                                    }}
                                />
                                <label htmlFor={localType}> Select all {localType} spaces</label>
                            </div>
                        )
                    })
                }

                {
                    spaces.filter(space => !allowedSpaceTypes || allowedSpaceTypes.includes(space.type)).map((space) => {
                        return (
                            <div key={space.id} className="py-2 flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name={space.name}
                                    id={space.id}
                                    checked={selectedSpaces.some(selected => selected._id === space.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedSpaces(prev => [...prev, { _id: space.id, name: space.name, type: space.type }]);
                                        } else {
                                            setSelectedSpaces(prev => prev.filter(selected => selected._id !== space.id));
                                        }
                                    }}
                                />
                                <label htmlFor={space.id}> {space.name}</label>
                            </div>
                        )
                    })
                }

                <div className="flex shrink-0 flex-wrap items-center pt-2 justify-end">
                    <Button
                        text="Cancel"
                        className="max-w-fit"
                        priority="secondary"
                        onClick={() => setShowSelectSpacesModal(false)}
                    />
                    <Button
                        text={"Select"}
                        className="max-w-fit ml-3"
                        onClick={() => {
                            onSelect(selectedSpaces);
                            setShowSelectSpacesModal(false);
                        }}
                    />
                </div>


            </div>
        </main>
    );
}

export default SpaceSelector;
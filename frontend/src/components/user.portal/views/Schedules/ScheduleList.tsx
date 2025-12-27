import { capitalize, getFormattedDate, toStrdSpaceType } from "../../../../utils/utils";
import { CategoryInfo, Repeat } from "../../../../interfaces/modals";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/store/store";
import { FaArrowDown, FaArrowUp, FaCalendar, FaHandHoldingUsd, FaLongArrowAltRight, FaMoneyBillWave, FaRegClock, FaSyncAlt, FaTimes, FaUserAlt, FaUserClock } from "react-icons/fa";
import { FiAlertTriangle, FiCalendar, FiCheckCircle, FiClock, FiFlag, FiSunrise } from "react-icons/fi"
import { RiPercentLine } from "react-icons/ri";
import { TransactionType } from "../Transactions";
import { useParams } from "react-router-dom";
import { SpaceType } from "../Spaces";
import Button from "../../../../components/Button";

function ScheduleList({ schedules, categories, onClick, onConfirm, onSkip }: { schedules: any[], categories: CategoryInfo[], onClick?: (t: any) => void, onConfirm: (id: string) => void, onSkip: (id: string) => void }) {

    const { username, spaces, currency } = useSelector((state: RootState) => state.auth)
    const { spacetype, spaceid } = useParams()
    const standardSpaceType = toStrdSpaceType(spacetype || "") as SpaceType;
    const currentSpace = spaces.find(sp => sp.id === spaceid);
    return (
        <ul className="mt-5 *:mb-3">
            {
                schedules?.map((schedule) => {
                    return (
                        <li
                            key={schedule._id}
                            className={`rounded border border-border-light-primary dark:border-border-dark-primary p-2 flex flex-col gap-1 hover:bg-hover-light-primary dark:hover:bg-hover-dark-primary hover:cursor-pointer`}
                        >
                            <div className="flex justify-between">
                                <span className="text-text-light-primary dark:text-text-dark-primary capitalize">
                                    {
                                        (categories.find(pc => pc.subCategoryId === schedule.scategory)?.subCategoryName)
                                    }
                                </span>
                                <span className="text-text-light-primary dark:text-text-dark-primary">{currency}. {schedule.amount.$numberDecimal}</span>
                            </div>
                            <div className="flex gap-3 *:text-xs">
                                <span className="text-text-light-secondary dark:text-text-dark-secondary">{schedule.note}</span>
                            </div>
                            <div className="flex justify-between gap-3 *:text-sm">
                                <div className="flex gap-4">
                                    <span className="text-text-light-secondary dark:text-text-dark-secondary flex gap-2 items-center capitalize">
                                        {
                                            spacetype !== "all" && (
                                                <span>
                                                    {
                                                        standardSpaceType === SpaceType.CASH || standardSpaceType === SpaceType.BANK ? (
                                                            spaceid === schedule.from ? <FaArrowUp className="text-red-500" /> : <FaArrowDown className="text-green-500" />
                                                        ) : standardSpaceType === SpaceType.LOAN_BORROWED || standardSpaceType === SpaceType.LOAN_LENT ? (
                                                            schedule.type === TransactionType.LOAN_PRINCIPAL ?
                                                                <FaMoneyBillWave className="text-yellow-500" /> :
                                                                schedule.type === TransactionType.REPAYMENT_PAID ?
                                                                    <FaArrowUp className="text-red-500" /> :
                                                                    schedule.type === TransactionType.REPAYMENT_RECEIVED ?
                                                                        <FaArrowDown className="text-green-500" /> :
                                                                        <RiPercentLine className="text-red-500" />
                                                        ) : standardSpaceType === SpaceType.CREDIT_CARD ? (
                                                            schedule.type === TransactionType.BALANCE_INCREASE ?
                                                                <FaArrowUp className="text-red-500" /> :
                                                                schedule.type === TransactionType.BALANCE_DECREASE ?
                                                                    <FaArrowDown className="text-green-500" /> :
                                                                    <RiPercentLine className="text-red-500" />

                                                        ) : (
                                                            <FaMoneyBillWave className="text-purple-500" />
                                                        )
                                                    }
                                                </span>
                                            )
                                        }
                                        {
                                            spaceid === schedule.from ?
                                                `${spaces.find(s => s.id == schedule.to)?.name || "Outside wallet"}` :
                                                spaceid === schedule.to ?
                                                    `${spaces.find(s => s.id == schedule.from)?.name || "Outside wallet"}` :
                                                    <>{`${spaces.find(s => s.id == schedule.from)?.name || "Outside wallet"}`} <FaLongArrowAltRight /> {`${spaces.find(s => s.id == schedule.to)?.name || "Outside wallet"}`}</>
                                        }
                                    </span>
                                    <span className="text-text-light-secondary dark:text-text-dark-secondary flex gap-2 items-center capitalize">
                                        <FaSyncAlt className="text-purple-500" />
                                        <span className="capitalize">
                                            {schedule.recurrent ? `Every ${schedule.interval} ${capitalize(schedule.repeat)}` : "One Time"}
                                            {
                                                schedule.recurrent && (
                                                    <span>{schedule.endDate ? `, until: ${getFormattedDate(schedule.endDate)}` : ", forever"}</span>
                                                )
                                            }
                                            {
                                                !schedule.recurrent && (
                                                    <span>, on {getFormattedDate(schedule.startDate)}</span>
                                                )
                                            }
                                        </span>
                                    </span>
                                    {
                                        currentSpace?.isCollaborative && (
                                            <span className="text-text-light-secondary dark:text-text-dark-secondary flex gap-2 items-center capitalize">
                                                <FaUserAlt className="inline-block" size={15} />
                                                {
                                                    username === schedule.userId.username ? "You"
                                                        : schedule?.memberStatus === "REMOVED_MEMBER" ? "Removed member"
                                                            : schedule?.memberStatus === "LEFT_MEMBER" ? "Left member"
                                                                : schedule.userId.username
                                                }
                                            </span>
                                        )
                                    }
                                </div>
                                <span className="text-text-light-secondary dark:text-text-dark-secondary text-xs">
                                    {
                                        schedule.isActive ? getNoOfDaysDifference(schedule.nextDueDate) : (
                                            <span className="flex gap-2 items-center *:font-bold">
                                                <FiCheckCircle className="text-text-light-secondary dark:text-text-dark-secondary" size={17} />
                                                <span className="text-text-light-secondary dark:text-text-dark-secondary">Closed</span>
                                            </span>
                                        )
                                    }
                                </span>
                            </div>
                            <div className="flex gap-3 mt-2">
                                {
                                    schedule.isActive && schedule.userId.username === username && (

                                        <>

                                            <Button
                                                text="Confirm"
                                                className="max-w-fit pt-1 pb-1"
                                                onClick={() => onConfirm(schedule._id)}
                                            />
                                            {
                                                schedule.recurrent && (
                                                    < Button
                                                        text="Skip"
                                                        className="max-w-fit pt-1 pb-1 hover:!bg-bg-light-primary dark:hover:!bg-bg-dark-primary"
                                                        onClick={() => onSkip(schedule._id)}
                                                        priority="secondary"
                                                    />
                                                )
                                            }

                                        </>

                                    )
                                }
                                < Button
                                    text="View"
                                    className="max-w-fit pt-1 pb-1 hover:!bg-bg-light-primary dark:hover:!bg-bg-dark-primary"
                                    onClick={onClick ? () => onClick(schedule) : () => { }}
                                    priority="secondary"
                                />
                            </div>

                        </li>
                    )
                })
            }

        </ul>
    )

}

export default ScheduleList;

function getNoOfDaysDifference(date: string): React.ReactNode {
    const today = new Date();
    const targetDate = new Date(date);

    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffMs = targetDate.getTime() - today.getTime();

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let text = <span></span>
    let icon = <></>
    if (days < 0) {
        text = <span className="text-red-500">{`${Math.abs(days)} days overdue`}</span>
        icon = <FiAlertTriangle className="text-red-500" size={17} />
    } else if (days === 0) {
        icon = <FiCalendar className="text-yellow-500" size={17} />;
        text = <span className="text-yellow-500">Due on Today</span>
    } else if (days === 1) {
        icon = <FiClock className="text-text-light-primary dark:text-text-dark-primary" size={17} />;
        text = <span className="text-text-light-primary dark:text-text-dark-primary">Due on Tomorrow</span>
    } else {
        icon = <FiClock className="text-text-light-primary dark:text-text-dark-primary" size={17} />;
        text = <span className="text-text-light-primary dark:text-text-dark-primary">{`Due in ${days} days`}</span>
    }

    return <span className="flex gap-2 items-center *:font-bold">{icon}{text}</span>
}

function getNextDueDate(currentDueDate: Date | string, recurrent: boolean, repeat: Repeat, interval: number): string {
    if (!recurrent) return "closed";

    const result = new Date(currentDueDate);

    if (repeat === "YEAR") {
        result.setFullYear(result.getFullYear() + interval);
    } else if (repeat === "MONTH") {
        const originalDate = result.getDate();
        result.setMonth(result.getMonth() + interval);

        if (result.getDate() !== originalDate) {
            result.setDate(0);
        }
    } else if (repeat === "WEEK") {
        result.setDate(result.getDate() + interval * 7);
    } else if (repeat === "DAY") {
        result.setDate(result.getDate() + interval);
    }

    return result.toISOString().split("T")[0];
}
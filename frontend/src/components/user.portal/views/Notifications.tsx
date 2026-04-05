import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store/store";
import { api } from "../../../config/api.config";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import { FaTrash } from "react-icons/fa";

interface NotificationData {
    _id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
}

export default function Notifications() {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<"all" | "unread">("all");

    useEffect(() => {
        if (userId) {
            fetchNotifications();
        } else {
            setLoading(false);
        }
    }, [userId]);

    const fetchNotifications = async () => {
        setLoading(true);
        console.log(`[FRONTEND] Fetching notifications for userId: ${userId}`);
        try {
            const response = await api.get(`notification/user/${userId}`);
            if (response.data.success) {
                setNotifications(response.data.data.object);
            } else {
                toast.error("Failed to load notifications.");
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("Could not fetch notifications.");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return; // Already read

        try {
            const response = await api.patch(`notification/${id}/read`);
            if (response.data.success) {
                // Update local state to reflect the change
                setNotifications(prev => prev.map(notif => 
                    notif._id === id ? { ...notif, isRead: true } : notif
                ));
            }
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent marking as read when clicking delete
        
        try {
            const response = await api.delete(`notification/${id}`);
            if (response.data.success) {
                setNotifications(prev => prev.filter(notif => notif._id !== id));
                toast.success("Notification deleted");
            } else {
                toast.error("Failed to delete notification");
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
            toast.error("Could not delete notification");
        }
    };

    const displayedNotifications = notifications.filter(n => filter === "all" ? true : !n.isRead);

    return (
        <div className="flex flex-col gap-6 md:p-4">
            <div className="w-full flex justify-between items-center sm:hidden mb-2">
                <h2 className="text-xl font-bold dark:text-text-dark-primary text-text-light-primary text-center">Notifications</h2>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-light-primary dark:border-border-dark-primary pb-4">
                <div className="hidden sm:block">
                    <h2 className="text-xl font-bold dark:text-text-dark-primary text-text-light-primary">Your Notifications</h2>
                    <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">Stay updated with your latest alerts and summaries.</p>
                </div>
                
                <div className="flex bg-gray-100 dark:bg-bg-dark-secondary rounded-lg p-1 w-full sm:w-auto">
                    <button 
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-white dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary shadow-sm' : 'text-text-light-tertiary dark:text-text-dark-tertiary'}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button 
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'unread' ? 'bg-white dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary shadow-sm' : 'text-text-light-tertiary dark:text-text-dark-tertiary'}`}
                        onClick={() => setFilter('unread')}
                    >
                        Unread
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border-light-primary dark:border-border-dark-primary h-64">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-full mb-4">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary">No notifications yet</h3>
                    <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary mt-1">We'll notify you when something important happens.</p>
                </div>
            ) : displayedNotifications.length === 0 ? (
                <div className="flex justify-center items-center h-48 bg-gray-50 dark:bg-bg-dark-secondary/20 rounded-xl border border-border-light-primary dark:border-border-dark-primary">
                    <p className="text-text-light-tertiary dark:text-text-dark-tertiary">No unread notifications.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {displayedNotifications.map((notif) => (
                        <div 
                            key={notif._id} 
                            onClick={() => markAsRead(notif._id, notif.isRead)}
                            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex gap-4 items-start
                                ${notif.isRead 
                                    ? 'bg-white dark:bg-bg-dark-secondary border-border-light-primary dark:border-border-dark-primary' 
                                    : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700'
                                }
                            `}
                        >
                            <div className="mt-1 flex-shrink-0">
                                {notif.isRead ? (
                                    <div className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                ) : (
                                    <div className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                    <h4 className={`text-base font-medium truncate ${notif.isRead ? 'text-text-light-secondary dark:text-text-dark-secondary' : 'text-text-light-primary dark:text-white'}`}>
                                        {notif.title}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap mt-0.5">
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                        </span>
                                        <button 
                                            onClick={(e) => deleteNotification(notif._id, e)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete notification"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                </div>
                                
                                <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-text-light-secondary dark:text-text-dark-secondary'}`}>
                                    {notif.message}
                                </p>

                                {notif.actionUrl && (
                                    <div className="mt-3">
                                        <a href={notif.actionUrl} onClick={(e) => e.stopPropagation()} className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-full inline-flex items-center transition-colors">
                                            View Details
                                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

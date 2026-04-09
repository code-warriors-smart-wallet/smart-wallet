import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationState {
    unreadCount: number;
    notifications: any[];
    lastPlan: string | null; // Used to detect plan changes for pop-ups
}

const initialState: NotificationState = {
    unreadCount: 0,
    notifications: [],
    lastPlan: localStorage.getItem('lastPlan') || null
};

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        setNotifications(state, action: PayloadAction<{ notifications: any[], unreadCount: number }>) {
            state.notifications = action.payload.notifications;
            state.unreadCount = action.payload.unreadCount;
        },
        setUnreadCount(state, action: PayloadAction<number>) {
            state.unreadCount = action.payload;
        },
        markRead(state, action: PayloadAction<string>) {
            const notification = state.notifications.find(n => n._id === action.payload);
            if (notification && !notification.isRead) {
                notification.isRead = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
        setLastPlan(state, action: PayloadAction<string | null>) {
            state.lastPlan = action.payload;
            if (action.payload) {
                localStorage.setItem('lastPlan', action.payload);
            } else {
                localStorage.removeItem('lastPlan');
            }
        }
    }
});

export const { setNotifications, setUnreadCount, markRead, setLastPlan } = notificationSlice.actions;
export default notificationSlice.reducer;

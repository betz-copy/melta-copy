import i18next from 'i18next';
import React, { CSSProperties } from 'react';
import { toast } from 'react-toastify';
import { environment } from '../../../globals';
import { INotification } from '../../../interfaces/notifications';
import { getMyNotificationsRequest } from '../../../services/notificationService';
import { InfiniteScroll } from '../../InfiniteScroll';
import PopperSidebar from '../../PopperSidebar';
import { NotificationCard } from './Notification';

const { infiniteScrollPageCount } = environment.notifications;

interface NotificationsScreenProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    sideBarWidth: CSSProperties['width'];
    updateNotificationCount: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ open, setOpen, sideBarWidth, updateNotificationCount }) => {
    return (
        <PopperSidebar open={open} setOpen={setOpen} title={i18next.t('notifications.title')} side="right" sideMargin={sideBarWidth}>
            <InfiniteScroll<INotification>
                queryKey="getMyNotifications"
                queryFunction={({ pageParam }) => getMyNotificationsRequest(infiniteScrollPageCount, Number(pageParam))}
                onQueryError={(error) => {
                    // eslint-disable-next-line no-console
                    console.log('failed to get notifications. error:', error);
                    toast.error(i18next.t('notifications.failedToGetNotifications'));
                }}
                endText={i18next.t('notifications.noNotificationsLeft')}
            >
                {(notification) => <NotificationCard notification={notification} onSeen={updateNotificationCount} />}
            </InfiniteScroll>
        </PopperSidebar>
    );
};

import { CircularProgress, Grid, Menu, MenuItem, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties, useState } from 'react';
import { toast } from 'react-toastify';
import {
    InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { useMutation } from 'react-query';
import { environment } from '../../../globals';
import { INotificationGroupCountDetails, INotificationPopulated } from '../../../interfaces/notifications';
import { getMyNotificationsRequest, manyNotificationSeenRequest } from '../../../services/notificationService';
import { InfiniteScroll } from '../../InfiniteScroll';
import PopperSidebar from '../../PopperSidebar';
import { NotificationCard } from './NotificationCard';
import { NotificationCount } from './NotificationCount';

const { infiniteScrollPageCount, groups } = environment.notifications;

interface NotificationsScreenProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    sideBarWidth: CSSProperties['width'];
    notificationCountDetails: INotificationGroupCountDetails;
    updateNotificationCountDetails: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
    open,
    setOpen,
    sideBarWidth,
    notificationCountDetails,
    updateNotificationCountDetails,
}) => {
    const groupNames = Object.keys(groups) as (keyof typeof groups)[];

    const [selectedGroup, setSelectedGroup] = useState<keyof typeof groups>('general');

    const [rightClickedGroup, setRightClickedGroup] = useState<keyof typeof groups>();
    const [tabOptionsAnchor, setTabOptionsAnchor] = useState<HTMLElement>();

    const { mutate, isLoading } = useMutation((groupName: keyof typeof groups) => manyNotificationSeenRequest(groups[groupName]), {
        onSuccess: (seenNotifications, groupName) => {
            updateNotificationCountDetails();

            if (seenNotifications.length) {
                toast.success(i18next.t('notifications.allSeen', { group: i18next.t(`notifications.groups.${groupName}`) }));
            }
        },
        onError: (error, groupName) => {
            const translatedGroupName = i18next.t(`notifications.groups.${groupName}`)

            // eslint-disable-next-line no-console
            console.log(`failed to set all notifications of group "${translatedGroupName}" as seen. error:`, error);
            toast.error(i18next.t('notifications.failedSetAllAsSeen', { group: translatedGroupName }));
        },
    });

    const onCloseTabOptions = () => {
        setRightClickedGroup(undefined);
        setTabOptionsAnchor(undefined);
    };

    return (
        <PopperSidebar
            open={open}
            setOpen={setOpen}
            title={i18next.t('notifications.title')}
            topButtons={
                <Tooltip title={i18next.t('notifications.infoRightClickTab')}>
                    <InfoIcon sx={{ marginTop: '0.4rem' }} />
                </Tooltip>
            }
            side="right"
            sideMargin={sideBarWidth}
        >
            <ToggleButtonGroup
                exclusive
                value={selectedGroup}
                onChange={(_event, newGroup) => {
                    if (!newGroup) return;
                    setSelectedGroup(newGroup);
                }}
                sx={{ height: '2.5rem' }}
                fullWidth
            >
                {groupNames.map((groupName) => (
                    <ToggleButton
                        key={groupName}
                        value={groupName}
                        sx={{ padding: '0.5rem' }}
                        onContextMenu={(event) => {
                            setRightClickedGroup(groupName);
                            setTabOptionsAnchor(event.currentTarget);
                            event.preventDefault();
                        }}>
                        <Grid container wrap="nowrap" alignItems="center" justifyContent="space-between">
                            <Grid item>
                                <Typography fontWeight="bold">
                                    {i18next.t(`notifications.groups.${groupName}`)}
                                </Typography>
                            </Grid>

                            <Grid item>
                                <NotificationCount notificationCount={notificationCountDetails.groups[groupName]} />
                            </Grid>
                        </Grid>
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>

            {isLoading ? <CircularProgress sx={{ marginX: 'auto', marginTop: '1rem' }} /> : <InfiniteScroll<INotificationPopulated>
                queryKey={['getMyNotifications', selectedGroup]}
                queryFunction={({ pageParam }) =>
                    getMyNotificationsRequest({
                        limit: infiniteScrollPageCount,
                        step: pageParam,
                        types: groups[selectedGroup],
                    })
                }
                onQueryError={(error) => {
                    console.log('failed to get notifications. error:', error); // eslint-disable-line no-console
                    toast.error(i18next.t('notifications.failedToGetNotifications'));
                }}
                endText={i18next.t('notifications.noNotificationsLeft')}
            >
                {(notification) => <NotificationCard notification={notification} onSeen={updateNotificationCountDetails} />}
            </InfiniteScroll>}

            {rightClickedGroup && tabOptionsAnchor && (
                <Menu open={Boolean(rightClickedGroup)} onClose={onCloseTabOptions} anchorEl={tabOptionsAnchor}>
                    <MenuItem
                        onClick={() => {
                            onCloseTabOptions();

                            if (!notificationCountDetails.groups[rightClickedGroup]) return;
                            mutate(rightClickedGroup);
                        }}
                    >
                        {i18next.t('notifications.setAllAsSeen', { group: i18next.t(`notifications.groups.${rightClickedGroup}`) })}
                    </MenuItem>
                </Menu>
            )}
        </PopperSidebar >
    );
};

import { Button, CircularProgress, Grid, Tab, Tabs, IconButton, Divider, Box } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties, useState } from 'react';
import { toast } from 'react-toastify';
import { useMutation } from 'react-query';
import { LoadingButton } from '@mui/lab';
import BallotIcon from '@mui/icons-material/Ballot';
import SmsIcon from '@mui/icons-material/Sms';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import EventIcon from '@mui/icons-material/Event';
import { environment } from '../../../globals';
import { INotificationGroupCountDetails, INotificationPopulated } from '../../../interfaces/notifications';
import { getMyNotificationsRequest, manyNotificationSeenRequest } from '../../../services/notificationService';
import { InfiniteScroll } from '../../InfiniteScroll';
import PopperSidebar from '../../PopperSidebar';
import { NotificationCard } from './NotificationCard';
import { NotificationCount } from './NotificationCount';
import DateRange from '../../inputs/DateRange';
import { SelectCheckbox } from '../../SelectCheckbox';

const { infiniteScrollPageCount, groups, notificationsMoreData } = environment.notifications;

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
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [openCalenders, setOpenCalenders] = useState<boolean>(false);
    const [notificationsToShowCheckbox, setNotificationsToShowCheckbox] = useState(notificationsMoreData[selectedGroup]);

    const onSetStartDate = (newStartDateInput: Date | null) => {
        setStartDate(newStartDateInput);
    };
    const onSetEndDate = (newEndDateInput: Date | null) => {
        setEndDate(newEndDateInput);
    };
    const filterCleaning = () => {
        onSetStartDate(null);
        onSetEndDate(null);
        setOpenCalenders(false);
    };
    const { mutate, isLoading } = useMutation((groupName: keyof typeof groups) => manyNotificationSeenRequest(groups[groupName]), {
        onSuccess: (seenNotifications, groupName) => {
            updateNotificationCountDetails();

            if (seenNotifications.length) {
                toast.success(i18next.t('notifications.allSeen', { group: i18next.t(`notifications.groups.${groupName}`) }));
            }
        },
        onError: (error, groupName) => {
            const translatedGroupName = i18next.t(`notifications.groups.${groupName}`);

            // eslint-disable-next-line no-console
            console.log(`failed to set all notifications of group "${translatedGroupName}" as seen. error:`, error);
            toast.error(i18next.t('notifications.failedSetAllAsSeen', { group: translatedGroupName }));
        },
    });

    return (
        <PopperSidebar
            open={open}
            setOpen={setOpen}
            title={i18next.t('notifications.title')}
            side="right"
            sideMargin={sideBarWidth}
            filterCleaning={filterCleaning}
        >
            <Tabs
                value={selectedGroup}
                onChange={(_event, newGroup) => {
                    if (!newGroup) return;
                    setSelectedGroup(newGroup);
                }}
                sx={{ height: '3.5rem', display: 'flex', justifyContent: 'space-around' }}
            >
                {groupNames.map((groupName, index) => (
                    <Button
                        key={groupName}
                        value={groupName}
                        onClick={(event) => {
                            setSelectedGroup(groupName);
                            setNotificationsToShowCheckbox(notificationsMoreData[groupName]);
                            event.preventDefault();
                        }}
                        sx={{ width: '100%' }}
                    >
                        {index === 0 ? <img src="/icons/text-bubble.svg" /> : <img src="/icons/general-notification.svg" />}
                        <Tab label={i18next.t(`notifications.groups.${groupName}`)} />
                        <NotificationCount notificationCount={notificationCountDetails.groups[groupName]} />
                    </Button>
                ))}
            </Tabs>
            {isLoading ? (
                <CircularProgress sx={{ marginX: 'auto', marginTop: '1rem' }} />
            ) : (
                <>
                    <Grid sx={{ display: 'flex', justifyContent: 'space-evenly', padding: '10px' }}>
                        <Box
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                            }}
                            sx={{ width: '90%' }}
                        >
                            <SelectCheckbox
                                title="סוג התראה"
                                options={notificationsMoreData[selectedGroup]}
                                selectedOptions={notificationsToShowCheckbox}
                                setSelectedOptions={setNotificationsToShowCheckbox}
                                getOptionId={({ type }) => type}
                                getOptionLabel={({ displayName }) => displayName}
                                size="small"
                            />
                        </Box>

                        {!openCalenders && (
                            <Button
                                onClick={() => setOpenCalenders(!openCalenders)}
                                sx={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    display: 'inline-block',
                                    // width: '20px',
                                    height: '38px',
                                    padding: '8px', // Add padding around the button
                                    boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
                                }}
                            >
                                <img src="/icons/calendar.svg" />
                            </Button>
                        )}

                        <IconButton onClick={filterCleaning} sx={{ borderRadius: 10 }}>
                            <FilterAltOffIcon />
                        </IconButton>
                    </Grid>

                    {openCalenders && (
                        <Grid sx={{ padding: '10px' }}>
                            <DateRange
                                onStartDateChange={onSetStartDate}
                                onEndDateChange={onSetEndDate}
                                startDateInput={startDate}
                                endDateInput={endDate}
                            />
                        </Grid>
                    )}

                    <InfiniteScroll<INotificationPopulated>
                        queryKey={['getMyNotifications', selectedGroup, startDate, endDate, notificationsToShowCheckbox]}
                        queryFunction={({ pageParam }) =>
                            getMyNotificationsRequest({
                                limit: infiniteScrollPageCount,
                                step: pageParam,
                                types: notificationsToShowCheckbox.map((notification) => notification.type),
                                startDate,
                                endDate,
                            })
                        }
                        onQueryError={(error) => {
                            console.log('failed to get notifications. error:', error); // eslint-disable-line no-console
                            toast.error(i18next.t('notifications.failedToGetNotifications'));
                        }}
                        endText={i18next.t('notifications.noNotificationsLeft')}
                    >
                        {(notification) => (
                            <Grid item style={{ padding: '8px' }}>
                                <NotificationCard notification={notification} onSeen={updateNotificationCountDetails} />
                            </Grid>
                        )}
                    </InfiniteScroll>
                </>
            )}
            <Grid item container justifyContent="flex-end" sx={{ bottom: 0, padding: '10px' }}>
                <LoadingButton
                    onClick={() => {
                        if (!notificationCountDetails.groups[selectedGroup]) return;
                        mutate(selectedGroup);
                    }}
                    loading={isLoading}
                >
                    {i18next.t('notifications.setAllSeen')}
                </LoadingButton>
            </Grid>
        </PopperSidebar>
    );
};

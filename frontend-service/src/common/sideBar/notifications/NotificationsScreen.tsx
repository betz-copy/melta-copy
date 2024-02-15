import { Button, CircularProgress, Grid, Tab, Tabs, IconButton } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties, useState } from 'react';
import { toast } from 'react-toastify';
import { useMutation } from 'react-query';
import { LoadingButton } from '@mui/lab';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
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
    const [openCalenders, setOpenCalendars] = useState<boolean>(false);
    const [notificationsToShowCheckbox, setNotificationsToShowCheckbox] = useState(notificationsMoreData[selectedGroup]);
    const [isCheckBoxClicked, setIsCheckBoxClicked] = useState(false);

    const onSetStartDate = (newStartDateInput: Date | null) => {
        setStartDate(newStartDateInput);
    };
    const onSetEndDate = (newEndDateInput: Date | null) => {
        setEndDate(newEndDateInput);
    };
    const filterCleaning = () => {
        onSetStartDate(null);
        onSetEndDate(null);
        setNotificationsToShowCheckbox(notificationsMoreData[selectedGroup]);
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
    const handleGroupChange = (_event, newGroup) => {
        if (!newGroup) return;
        setSelectedGroup(newGroup);
    };
    return (
        <PopperSidebar
            open={open}
            setOpen={setOpen}
            title={i18next.t('notifications.title')}
            side="right"
            sideMargin={sideBarWidth}
            filterCleaning={filterCleaning}
            isCheckBoxClicked={isCheckBoxClicked}
        >
            <Grid>
                <Tabs value={selectedGroup} onChange={handleGroupChange} sx={{ height: '3.5rem' }}>
                    {groupNames.map((groupName) => (
                        <Button
                            key={groupName}
                            value={groupName}
                            onClick={(event) => {
                                setSelectedGroup(groupName);
                                setNotificationsToShowCheckbox(notificationsMoreData[groupName]);
                                event.preventDefault();
                            }}
                            sx={{ width: '100%', color: selectedGroup === groupName ? '#012169' : 'inherit' }}
                        >
                            <img src={`/icons/${groupName}-notification${selectedGroup === groupName ? '-clicked' : ''}.svg`} />

                            <Tab
                                label={i18next.t(`notifications.groups.${groupName}`)}
                                // sx={{ color: selectedGroup === groupName ? '#012169' : 'inherit' }}
                            />
                            <NotificationCount notificationCount={notificationCountDetails.groups[groupName]} />
                        </Button>
                    ))}
                </Tabs>
            </Grid>

            {isLoading ? (
                <CircularProgress sx={{ marginX: 'auto', marginTop: '1rem' }} />
            ) : (
                <>
                    <Grid sx={{ display: 'flex', justifyContent: 'space-evenly', padding: '15px' }}>
                        <Grid sx={{ width: '80%' }}>
                            <SelectCheckbox
                                title={i18next.t('notifications.notificationType')}
                                options={notificationsMoreData[selectedGroup]}
                                selectedOptions={notificationsToShowCheckbox}
                                setSelectedOptions={setNotificationsToShowCheckbox}
                                getOptionId={({ type }) => type}
                                getOptionLabel={({ displayName }) => displayName}
                                size="small"
                                overrideSx={{
                                    '& .MuiSelect-select': {
                                        backgroundColor: '#FFFF',
                                        color: '#9398C2',
                                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                                    },
                                }}
                                handleCheckboxClick={(value) => setIsCheckBoxClicked(value)}
                                isDraggableDisabled
                            />
                        </Grid>
                        <Button
                            onClick={() => setOpenCalendars(!openCalenders)}
                            sx={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                display: 'inline-block',
                                height: '40px',
                                width: '10px',
                                padding: '8px',
                                boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            <img src="/icons/calendar.svg" />
                        </Button>

                        <IconButton onClick={filterCleaning} sx={{ borderRadius: 10 }}>
                            <FilterAltOffIcon />
                        </IconButton>
                    </Grid>
                    {openCalenders && (
                        <Grid sx={{ padding: '15px' }}>
                            <DateRange
                                onStartDateChange={onSetStartDate}
                                onEndDateChange={onSetEndDate}
                                startDateInput={startDate}
                                endDateInput={endDate}
                                overrideSx={{
                                    '& input': {
                                        backgroundColor: '#FFFF',
                                    },
                                }}
                            />
                        </Grid>
                    )}
                    <InfiniteScroll<INotificationPopulated>
                        queryKey={['getMyNotifications', selectedGroup, startDate, endDate, notificationsToShowCheckbox]}
                        queryFunction={({ pageParam }) =>
                            getMyNotificationsRequest({
                                limit: infiniteScrollPageCount,
                                step: pageParam,
                                types: notificationsToShowCheckbox.map(({ type }) => type),
                                startDate: startDate ?? undefined,
                                endDate: endDate ?? undefined,
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

                    <Grid container sx={{ position: 'absolute', bottom: 0, justifyContent: 'flex-end', padding: '8px', backgroundColor: 'white' }}>
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
                </>
            )}
        </PopperSidebar>
    );
};

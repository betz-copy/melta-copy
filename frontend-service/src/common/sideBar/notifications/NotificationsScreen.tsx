import { CircularProgress, Grid, Tab, Tabs } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties, useState } from 'react';
import { toast } from 'react-toastify';
import { useMutation } from 'react-query';
import { LoadingButton } from '@mui/lab';
import { environment } from '../../../globals';
import { INotificationGroupCountDetails, INotificationPopulated } from '../../../interfaces/notifications';
import { getMyNotificationsRequest, manyNotificationSeenRequest } from '../../../services/notificationService';
import { InfiniteScroll } from '../../InfiniteScroll';
import PopperSidebar from '../../PopperSidebar';
import { NotificationCard } from './NotificationCard';
import { NotificationCount } from './NotificationCount';
import DateRange from '../../inputs/DateRange';
import { SelectCheckbox } from '../../SelectCheckbox';
import IconButtonWithPopover from '../../IconButtonWithPopover';

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
    console.log({ notificationsToShowCheckbox });

    const onSetStartDate = (newStartDateInput: Date | null) => {
        setStartDate(newStartDateInput);
    };
    const onSetEndDate = (newEndDateInput: Date | null) => {
        setEndDate(newEndDateInput);
    };
    const filterCleaning = () => {
        onSetStartDate(null);
        onSetEndDate(null);
        setOpenCalendars(false);
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
            isCheckBoxClicked={isCheckBoxClicked}
        >
            <Grid>
                <Tabs value={selectedGroup} onChange={handleGroupChange}>
                    {groupNames.map((groupName) => (
                        <Tab
                            value={groupName}
                            key={groupName}
                            iconPosition="start"
                            label={
                                <Grid container gap="10px" display="flex" alignItems="center" justifyContent="space-around">
                                    <img
                                        src={
                                            // eslint-disable-next-line no-nested-ternary
                                            groupName === 'general'
                                                ? selectedGroup === groupName
                                                    ? '/icons/general-notification-clicked.svg'
                                                    : '/icons/general-notification.svg'
                                                : selectedGroup === groupName
                                                ? '/icons/requests-notification-clicked.svg'
                                                : '/icons/requests-notification.svg'
                                        }
                                    />
                                    <Grid item> {i18next.t(`notifications.groups.${groupName}`)}</Grid>
                                    <Grid item>
                                        <NotificationCount notificationCount={notificationCountDetails.groups[groupName]} />
                                    </Grid>
                                </Grid>
                            }
                            onClick={(event) => {
                                setSelectedGroup(groupName);
                                setNotificationsToShowCheckbox(notificationsMoreData[groupName]);
                                event.preventDefault();
                            }}
                            sx={{
                                width: '50%',
                                '&:focus': {
                                    color: '#1E2775',
                                    fontWeight: '700',
                                },
                            }}
                        />
                    ))}
                </Tabs>
            </Grid>

            {isLoading ? (
                <CircularProgress sx={{ marginX: 'auto', marginTop: '1rem' }} />
            ) : (
                <>
                    <Grid sx={{ display: 'flex', justifyContent: 'space-around', padding: '18px' }}>
                        <Grid item sx={{ width: openCalenders ? '100%' : '80%' }}>
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
                                        borderRadius: '12px',
                                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                                        border: 0,
                                        width: openCalenders ? '17rem' : '13rem',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': { border: 0 },
                                    '&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                                        border: 0,
                                    },
                                    '&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        border: 0,
                                    },
                                }}
                                handleCheckboxClick={(value) => setIsCheckBoxClicked(value)}
                                isDraggableDisabled
                            />
                        </Grid>
                        {!openCalenders && (
                            <Grid
                                item
                                sx={{
                                    backgroundColor: 'white',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    padding: '8px',
                                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                                }}
                                onClick={() => setOpenCalendars(!openCalenders)}
                            >
                                <img src="/icons/calendar.svg" style={{ height: '20px' }} />
                            </Grid>
                        )}
                    </Grid>
                    {openCalenders && (
                        <Grid sx={{ padding: '17px' }}>
                            <DateRange
                                onStartDateChange={onSetStartDate}
                                onEndDateChange={onSetEndDate}
                                startDateInput={startDate}
                                endDateInput={endDate}
                                overrideSx={{
                                    '& input': {
                                        backgroundColor: '#FFFF',
                                        fontSize: '15px',
                                    },

                                    '.MuiOutlinedInput-notchedOutline': {
                                        border: 0,
                                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                                        borderRadius: '12px',
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderRadius: '15px',
                                            boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                                            border: 0,
                                        },
                                    },
                                }}
                            />

                            <IconButtonWithPopover
                                iconButtonProps={{ onClick: () => filterCleaning() }}
                                popoverText=""
                                disabled={!(startDate || endDate)}
                                style={{
                                    borderRadius: '5px',
                                    padding: '6px, 4px, 6px, 4px',
                                    marginRight: '208px',
                                }}
                            >
                                {startDate || endDate ? <img src="/icons/delete-filters-enable.svg" /> : <img src="/icons/delete-filters.svg" />}
                            </IconButtonWithPopover>
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

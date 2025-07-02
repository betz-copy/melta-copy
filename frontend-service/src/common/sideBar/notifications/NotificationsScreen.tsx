import { CalendarToday, FilterList, FilterListOff, MarkChatUnreadOutlined, SmsOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { CircularProgress, Grid, IconButton, Tab, Tabs, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties, useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../../globals';
import { INotificationGroupCountDetails, INotificationPopulated, NotificationType } from '../../../interfaces/notifications';
import { IGetMyNotificationsRequestQuery } from '../../../services/notificationService';
import { useDarkModeStore } from '../../../stores/darkMode';
import IconButtonWithPopover from '../../IconButtonWithPopover';
import { InfiniteScroll } from '../../InfiniteScroll';
import DateRange from '../../inputs/DateRange';
import PopperSidebar from '../../PopperSidebar';
import { SelectCheckbox } from '../../SelectCheckBox';
import { NotificationCard } from './NotificationCard';
import { NotificationCount } from './NotificationCount';

const { infiniteScrollPageCount, groups, notificationsMoreData } = environment.notifications;

interface NotificationsScreenProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    sideBarWidth: CSSProperties['width'];
    notificationCountDetails: INotificationGroupCountDetails;
    updateNotificationCountDetails: () => void;
    side: 'left' | 'right';
    manyNotificationSeenRequest: (types: NotificationType[]) => Promise<INotificationPopulated[]>;
    getMyNotificationsRequest: (query: IGetMyNotificationsRequestQuery) => Promise<INotificationPopulated[]>;
}

interface IGroups {
    requests: NotificationType[];
    general: NotificationType[];
}

interface IExpandedNotifications {
    type: NotificationType;
    color?: string;
    displayName: () => string;
}

interface IExpandedGroups {
    requests: IExpandedNotifications[];
    general: IExpandedNotifications[];
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
    open,
    setOpen,
    sideBarWidth,
    notificationCountDetails,
    updateNotificationCountDetails,
    side = 'right',
    manyNotificationSeenRequest,
    getMyNotificationsRequest,
}) => {
    const groupNames = Object.keys(groups) as (keyof typeof groups)[];
    const [selectedGroup, setSelectedGroup] = useState<keyof typeof groups>('general');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [openCalenders, setOpenCalendars] = useState<boolean>(false);
    const [notificationsToShowCheckbox, setNotificationsToShowCheckbox] = useState(
        (notificationsMoreData as unknown as IExpandedGroups)[selectedGroup],
    );
    const [isCheckBoxClicked, setIsCheckBoxClicked] = useState(false);

    const theme = useTheme();

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const onSetStartDate = (newStartDateInput: Date | null) => {
        setStartDate(newStartDateInput);
    };

    const onSetEndDate = (newEndDateInput: Date | null) => {
        setEndDate(newEndDateInput);
    };

    const filterCleaning = () => {
        onSetStartDate(null);
        onSetEndDate(null);
        setOpenCalendars(!openCalenders);
    };

    const { mutate, isLoading } = useMutation(
        (groupName: keyof typeof groups) => manyNotificationSeenRequest((groups as unknown as IGroups)[groupName]),
        {
            onSuccess: (seenNotifications, groupName) => {
                updateNotificationCountDetails();

                if (seenNotifications.length) {
                    toast.success(i18next.t('notifications.allSeen', { group: i18next.t(`notifications.groups.${groupName}`) }));
                }
            },
            onError: (error, groupName) => {
                const translatedGroupName = i18next.t(`notifications.groups.${groupName}`);

                console.error(`failed to set all notifications of group "${translatedGroupName}" as seen. error:`, error);
                toast.error(i18next.t('notifications.failedSetAllAsSeen', { group: translatedGroupName }));
            },
        },
    );

    const handleGroupChange = (_event, newGroup) => {
        if (!newGroup) return;
        setSelectedGroup(newGroup);
    };

    const width = openCalenders ? 310 : 255;

    return (
        <PopperSidebar
            open={open}
            setOpen={setOpen}
            title={
                <Typography color={theme.palette.primary.main} fontFamily="Rubik" component="h5" variant="h5" marginX="auto" fontWeight="bold">
                    {i18next.t('notifications.title')}
                </Typography>
            }
            side="right"
            sideMargin={sideBarWidth}
            isCheckBoxClicked={isCheckBoxClicked}
        >
            <Grid>
                <Tabs value={selectedGroup} onChange={handleGroupChange} sx={{ width: '90%', margin: 'auto' }}>
                    {groupNames.map((groupName) => (
                        <Tab
                            value={groupName}
                            key={groupName}
                            iconPosition="start"
                            label={
                                <Grid container gap="10px" display="flex" alignItems="center" justifyContent="space-around">
                                    {groupName === 'general' ? <MarkChatUnreadOutlined /> : <SmsOutlined />}
                                    <Grid item fontWeight={selectedGroup !== groupName ? 400 : undefined}>
                                        {i18next.t(`notifications.groups.${groupName}`)}
                                    </Grid>
                                    <Grid item>
                                        <NotificationCount notificationCount={notificationCountDetails.groups[groupName]} />
                                    </Grid>
                                </Grid>
                            }
                            onClick={(event) => {
                                setSelectedGroup(groupName);
                                setNotificationsToShowCheckbox((notificationsMoreData as unknown as IExpandedGroups)[groupName]);
                                event.preventDefault();
                            }}
                            sx={{
                                width: '50%',
                                '&:focus': {
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
                    <Grid sx={{ display: 'flex', justifyContent: 'space-between', padding: '18px' }}>
                        <Grid item>
                            <SelectCheckbox
                                title={i18next.t('notifications.notificationType')}
                                options={(notificationsMoreData as unknown as IExpandedGroups)[selectedGroup]}
                                selectedOptions={notificationsToShowCheckbox}
                                setSelectedOptions={setNotificationsToShowCheckbox}
                                getOptionId={({ type }) => type}
                                getOptionLabel={(option) => option.displayName()}
                                size="small"
                                horizontalOrigin={openCalenders ? 61 : 128}
                                overrideSx={{
                                    '& .MuiSelect-select': {
                                        color: '#       ',
                                        border: 0,
                                        width: openCalenders ? '15rem' : '11.5rem',
                                    },
                                }}
                                handleCheckboxClick={(value) => setIsCheckBoxClicked(value)}
                                isDraggableDisabled
                                hideSearchBar
                                hideChooseAll
                                dynamicWidth={width}
                            />
                        </Grid>
                        {!openCalenders && (
                            <Grid
                                item
                                sx={{
                                    borderRadius: '10px',
                                    display: 'flex',
                                    boxShadow: '-2px 2px 6px 0px #1E277540',
                                }}
                            >
                                <IconButton onClick={() => setOpenCalendars(!openCalenders)}>
                                    <CalendarToday color="primary" fontSize="small" />
                                </IconButton>
                            </Grid>
                        )}
                    </Grid>
                    {openCalenders && (
                        <Grid sx={{ padding: '17px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <DateRange
                                onStartDateChange={onSetStartDate}
                                onEndDateChange={onSetEndDate}
                                startDateInput={startDate}
                                endDateInput={endDate}
                                maxEndDate={new Date()}
                                maxStartDate={new Date()}
                                directionIsRow
                                {...(darkMode
                                    ? {}
                                    : {
                                          overrideSx: {
                                              '& input': {
                                                  backgroundColor: '#FFFF',
                                                  fontSize: '15px',
                                              },

                                              '.MuiOutlinedInput-notchedOutline': {
                                                  border: 0,
                                                  boxShadow: '-2px 2px 6px 0px #1E277540',
                                                  borderRadius: '12px',
                                              },
                                              '& .MuiOutlinedInput-root': {
                                                  '&.Mui-focused fieldset': {
                                                      borderRadius: '15px',
                                                      boxShadow: '-2px 2px 6px 0px #1E277540',
                                                      border: 0,
                                                  },
                                              },
                                          },
                                      })}
                            />

                            <IconButtonWithPopover
                                iconButtonProps={{ onClick: () => filterCleaning() }}
                                popoverText=""
                                // disabled={!(startDate || endDate)}
                                style={{
                                    borderRadius: '5px',
                                    marginRight: '208px',
                                }}
                            >
                                {startDate || endDate ? <FilterList /> : <FilterListOff />}

                                <Typography fontSize="0.9rem" noWrap color={theme.palette.primary.main}>
                                    {i18next.t('entitiesTableOfTemplate.resetFilters')}
                                </Typography>
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
                            console.error('failed to get notifications. error:', error);
                            toast.error(i18next.t('notifications.failedToGetNotifications'));
                        }}
                        endText={i18next.t('notifications.noNotificationsLeft')}
                        style={{
                            '::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.primary.main },
                            '::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
                        }}
                    >
                        {(notification) => (
                            <Grid item style={{ padding: '8px' }}>
                                <NotificationCard notification={notification} onSeen={updateNotificationCountDetails} />
                            </Grid>
                        )}
                    </InfiniteScroll>

                    <Grid
                        container
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            justifyContent: 'flex-end',
                            padding: '8px',
                            backgroundColor: 'inherit',
                            borderRadius: '0px 0px 15px 15px',
                        }}
                    >
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

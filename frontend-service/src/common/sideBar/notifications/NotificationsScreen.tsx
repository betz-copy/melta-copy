import { Button, CircularProgress, Grid, Tab, Tabs, Tooltip, List, IconButton, Divider } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties, useState } from 'react';
import { toast } from 'react-toastify';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
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

const { infiniteScrollPageCount, groups, notificationData } = environment.notifications;

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
    // const [tabOptionsAnchor, setTabOptionsAnchor] = useState<HTMLElement>();
    const [startDateInput, setStartDateInput] = useState<Date | null>(null);
    const [endDateInput, setEndDateInput] = useState<Date | null>(null);
    const [openCalenders, setOpenCalenders] = useState<boolean>(false);
    const [notificationsToShowCheckbox, setNotificationsToShowCheckbox] = useState(notificationData[selectedGroup]);

    const onSetStartDate = (newStartDateInput: Date | null) => {
        setStartDateInput(newStartDateInput);
    };
    const onSetEndDate = (newEndDateInput: Date | null) => {
        setEndDateInput(newEndDateInput);
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

    // const onCloseTabOptions = () => {
    //     // setCurrGroup(undefined);
    //     setTabOptionsAnchor(undefined);
    // };

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
            {/* <ToggleButtonGroup
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
                        sx={{ padding: '0.5rem', borderBlockColor: 'none' }}
                        onClick={(event) => {
                            setSelectedGroup(groupName);
                            // setTabOptionsAnchor(event.currentTarget);
                            event.preventDefault();
                        }}
                    >
                        <Grid container wrap="nowrap" alignItems="center" justifyContent="space-between">
                            <Grid item>
                                <Typography fontWeight="bold">{i18next.t(`notifications.groups.${groupName}`)}</Typography>
                            </Grid>

                            <Grid item>
                                <NotificationCount notificationCount={notificationCountDetails.groups[groupName]} />
                            </Grid>
                        </Grid>
                    </ToggleButton>
                ))}
            </ToggleButtonGroup> */}
            <Tabs
                value={selectedGroup}
                onChange={(_event, newGroup) => {
                    if (!newGroup) return;
                    setSelectedGroup(newGroup);
                }}
                sx={{ height: '3.5rem' }}
            >
                {groupNames.map((groupName, index) => (
                    <Button
                        key={groupName}
                        value={groupName}
                        onClick={(event) => {
                            setSelectedGroup(groupName);
                            // setTabOptionsAnchor(event.currentTarget);
                            event.preventDefault();
                        }}
                        sx={{ width: '100%' }}
                    >
                        {index === 0 ? <SmsIcon /> : <BallotIcon />}
                        <Tab label={i18next.t(`notifications.groups.${groupName}`)} />
                        <NotificationCount notificationCount={notificationCountDetails.groups[groupName]} />
                    </Button>
                ))}
            </Tabs>

            {/* 
            <SelectCheckbox
                title="gjgjgj"
                options={['dd']}
                selectedOptions={noti}
                setSelectedOptions={setSelectedTemplates}
                getOptionId={({ _id }) => _id}
                getOptionLabel={({ displayName }) => displayName}
                groupsProps={getCategoriesSelectCheckboxGroupProps(categories)}
                isDraggableDisabled={isDraggableDisabled}
                setOptions={setTemplates}
                size={size}
                toTopBar={toTopBar}
            /> */}

            {isLoading ? (
                <CircularProgress sx={{ marginX: 'auto', marginTop: '1rem' }} />
            ) : (
                <>
                    <Grid>
                        <SelectCheckbox
                            title="סוג התראה"
                            options={notificationData[selectedGroup]}
                            selectedOptions={notificationsToShowCheckbox}
                            setSelectedOptions={setNotificationsToShowCheckbox}
                            getOptionId={({ name }) => name}
                            getOptionLabel={({ displayName }) => displayName}
                            size="small"
                        />

                        {!openCalenders && (
                            <Button onClick={() => setOpenCalenders(!openCalenders)}>
                                <EventIcon />
                            </Button>
                        )}
                        <IconButton
                            onClick={() => {
                                onSetStartDate(null);
                                onSetEndDate(null);
                                setOpenCalenders(false);
                            }}
                            sx={{ borderRadius: 10 }}
                        >
                            <FilterAltOffIcon />
                        </IconButton>
                    </Grid>

                    {openCalenders ? (
                        <Grid sx={{ padding: '10px' }}>
                            <DateRange
                                onStartDateChange={onSetStartDate}
                                onEndDateChange={onSetEndDate}
                                startDateInput={startDateInput}
                                endDateInput={endDateInput}
                            />
                        </Grid>
                    ) : null}
                    <Divider />
                    <InfiniteScroll<INotificationPopulated>
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
                        {(notification) => (
                            <Grid item style={{ padding: '8px' }}>
                                <NotificationCard notification={notification} onSeen={updateNotificationCountDetails} />
                            </Grid>
                        )}
                    </InfiniteScroll>
                </>
            )}
            <Grid item container justifyContent="flex-end" sx={{ position: 'absolute', bottom: 0, padding: '10px' }}>
                <LoadingButton
                    onClick={() => {
                        // onCloseTabOptions();
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

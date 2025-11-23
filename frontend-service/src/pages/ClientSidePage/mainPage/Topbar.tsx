import { Divider, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { CustomImage } from '../../../common/CustomIcon';
import { NotificationsButton } from '../../../common/sideBar/notifications/NotificationsButton';
import { NotificationsScreen } from '../../../common/sideBar/notifications/NotificationsScreen';
import UserAvatar from '../../../common/UserAvatar';
import { environment } from '../../../globals';
import { INotificationCountGroups } from '../../../interfaces/notifications';
import { IKartoffelUser } from '../../../interfaces/users';
import {
    getMyClientSideNotificationGroupCountRequest,
    getMyNotificationsClientSideRequest,
    manyNotificationSeenClientSideRequest,
} from '../../../services/clientSideService';
import { useWorkspaceStore } from '../../../stores/workspace';

const { notifications } = environment;

interface ITopbarProps {
    currentUser: IKartoffelUser;
}

const Topbar: React.FC<ITopbarProps> = ({ currentUser }) => {
    const [isNotificationsScreenOpen, setIsNotificationsScreenOpen] = useState<boolean>(false);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { clientSideWorkspaceName } = workspace.metadata?.clientSide || {};

    const { data: notificationCountDetailsResponse, refetch: updateNotificationCountDetails } = useQuery(
        ['getMyNotificationCount', isNotificationsScreenOpen],
        () =>
            getMyClientSideNotificationGroupCountRequest(
                isNotificationsScreenOpen ? (notifications.groups as unknown as INotificationCountGroups) : {},
            ),
        {
            refetchInterval: notifications.updateInterval,
            refetchOnWindowFocus: true,
        },
    );

    const notificationCountDetails = notificationCountDetailsResponse || { total: 0, groups: {} };

    return (
        <>
            <Grid
                container
                px="0.5rem"
                py="0.5rem"
                flexWrap="nowrap"
                alignItems="center"
                sx={{
                    position: 'relative',
                    backgroundColor: 'white',
                    boxShadow: '-2px 2px 6px 0px #1e27754d',
                    zIndex: 10,
                }}
            >
                <Grid container alignItems="center" flexWrap="nowrap" spacing={1}>
                    <Grid container alignItems="center" flexWrap="nowrap" spacing={1} size={{ xs: 8 }}>
                        <Grid display="flex" alignItems="center" justifyContent="center">
                            <CustomImage preserveColor imageUrl={`/clientSide/${clientSideWorkspaceName}/background.png`} width="50px" />
                        </Grid>
                        <Grid>
                            <Divider
                                orientation="vertical"
                                variant="middle"
                                sx={{ height: '40px', margin: '0 10px', borderWidth: '0.5px', borderColor: '#EDEFFA', borderRadius: '30px' }}
                            />
                        </Grid>
                        <Grid>
                            <Typography fontSize="16px" color="#1e2775">
                                <b>{i18next.t(`clientSidePage.${clientSideWorkspaceName}.topbar.title`)}</b> {currentUser?.fullName}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid container justifyContent="flex-end" alignItems="center" flexWrap="nowrap" spacing={1} mr="1rem">
                        <Grid>
                            <NotificationsButton
                                notificationCountDetails={{ total: 0, groups: {} }}
                                text={i18next.t('notifications.title')}
                                isDrawerOpen={false}
                                onClick={() => {
                                    setIsNotificationsScreenOpen(!isNotificationsScreenOpen);
                                }}
                                iconColor="#1e2775"
                            />
                        </Grid>
                        <Grid>
                            <UserAvatar user={currentUser} shouldRenderChip={false} shouldRenderTooltip={false} userIcon={{ size: 48 }} />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <NotificationsScreen
                open={isNotificationsScreenOpen}
                setOpen={setIsNotificationsScreenOpen}
                sideBarWidth={`0px`}
                notificationCountDetails={notificationCountDetails}
                updateNotificationCountDetails={updateNotificationCountDetails}
                side="left"
                manyNotificationSeenRequest={manyNotificationSeenClientSideRequest}
                getMyNotificationsRequest={getMyNotificationsClientSideRequest}
            />
        </>
    );
};

export { Topbar };

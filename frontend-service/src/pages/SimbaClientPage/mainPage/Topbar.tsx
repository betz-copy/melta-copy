import React from 'react';
import { Typography, Grid, Divider } from '@mui/material';
import i18next from 'i18next';
import { CustomImage } from '../../../common/CustomIcon';
import { IKartoffelUser } from '../../../interfaces/users';
import UserAvatar from '../../../common/UserAvatar';
import { NotificationsButton } from '../../../common/sideBar/notifications/NotificationsButton';

interface ITopbarProps {
    currentUser: IKartoffelUser;
}

const Topbar: React.FC<ITopbarProps> = ({ currentUser }) => {
    return (
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
            <Grid container item alignItems="center" flexWrap="nowrap" spacing={1}>
                <Grid container item alignItems="center" flexWrap="nowrap" spacing={1} xs={8}>
                    <Grid item display="flex" alignItems="center" justifyContent="center">
                        <CustomImage preserveColor imageUrl="/images/simba-background.png" width="50px" />
                    </Grid>
                    <Grid item>
                        <Divider
                            orientation="vertical"
                            variant="middle"
                            sx={{ height: '40px', margin: '0 10px', borderWidth: '0.5px', borderColor: '#EDEFFA', borderRadius: '30px' }}
                        />
                    </Grid>
                    <Grid item>
                        <Typography fontSize="16px" color="#1e2775">
                            <b>{i18next.t('simbaClientPage.topbar.title')}</b> {currentUser?.fullName}
                        </Typography>
                    </Grid>
                </Grid>
                <Grid item container justifyContent="flex-end" alignItems="center" flexWrap="nowrap" spacing={1} mr="1rem">
                    <Grid item>
                        <NotificationsButton
                            notificationCountDetails={{ total: 2, groups: {} }}
                            text={i18next.t('notifications.title')}
                            isDrawerOpen={false}
                            onClick={() => {}}
                            iconColor="#1e2775"
                        />
                    </Grid>
                    <Grid item>
                        <UserAvatar user={currentUser} />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export { Topbar };

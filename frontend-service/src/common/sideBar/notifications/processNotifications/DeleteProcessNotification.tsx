import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IDeleteProcessNotificationMetadataPopulated } from '../../../../interfaces/notifications';

export const DeleteProcessNotification: React.FC<IDeleteProcessNotificationMetadataPopulated> = ({ processName }) => {
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography display="inline">{`${i18next.t('deleteProcessNotification.deleteProcessNotification')} `}</Typography>
            </Grid>
            <Grid item>
                <Typography display="inline">{`${i18next.t('deleteProcessNotification.theProcess')} `}</Typography>
                <Typography display="inline" fontWeight="bold">{`${processName} `}</Typography>

                <Typography display="inline">{i18next.t('deleteProcessNotification.processDeleteSuccessfully')}</Typography>
            </Grid>
        </Grid>
    );
};

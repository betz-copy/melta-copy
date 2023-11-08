import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IArchiveProcessNotificationMetadataPopulated } from '../../../../interfaces/notifications';
import { ProcessName } from './ProcessName';

export const ArchiveProcessNotification: React.FC<IArchiveProcessNotificationMetadataPopulated> = ({ process, isArchived }) => {
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography display="inline">
                    {isArchived
                        ? i18next.t('archiveProcessNotification.sendProcessToArchive')
                        : i18next.t('archiveProcessNotification.removeProcessFromArchive')}
                </Typography>
            </Grid>
            <Grid item>
                <Typography display="inline">{`${i18next.t('archiveProcessNotification.theProcess')} `}</Typography>
                <ProcessName process={process} />
                <Typography display="inline">
                    {isArchived
                        ? i18next.t('archiveProcessNotification.sendToArchivedSuccessfully')
                        : i18next.t('archiveProcessNotification.removeFromArchivedSuccessfully')}
                </Typography>
            </Grid>
        </Grid>
    );
};

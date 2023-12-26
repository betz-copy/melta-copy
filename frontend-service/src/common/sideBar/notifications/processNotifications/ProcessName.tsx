import { Tooltip, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IMongoProcessInstancePopulated } from '../../../../interfaces/processes/processInstance';

interface ProcessNameProps {
    process: IMongoProcessInstancePopulated | null;
}

export const ProcessName: React.FC<ProcessNameProps> = ({ process }) => {
    return (
        <Tooltip title={!process && i18next.t('notifications.processDeleted')}>
            <Typography display="inline" fontWeight="bold">
                {`${process?.name ?? i18next.t('notifications.unknown')} `}
            </Typography>
        </Tooltip>
    );
};

import { Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IMongoProcessInstancePopulated } from '../../../../interfaces/processes/processInstance';
import MeltaTooltip from '../../../MeltaDesigns/MeltaTooltip';

interface ProcessNameProps {
    process: IMongoProcessInstancePopulated | null;
}

export const ProcessName: React.FC<ProcessNameProps> = ({ process }) => {
    return (
        <MeltaTooltip title={!process && i18next.t('notifications.processDeleted')}>
            <Typography display="inline" fontWeight="bold">
                {`${process?.name ?? i18next.t('notifications.unknown')} `}
            </Typography>
        </MeltaTooltip>
    );
};

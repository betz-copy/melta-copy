import { Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IMongoProcessInstanceReviewerPopulated } from '@microservices/shared';
import { MeltaTooltip } from '../../../MeltaTooltip';

interface ProcessNameProps {
    process: IMongoProcessInstanceReviewerPopulated | null;
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

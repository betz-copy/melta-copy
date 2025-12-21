import { Typography } from '@mui/material';
import { IMongoStepInstancePopulated, IProcessTemplateMap } from '@packages/process';
import i18next from 'i18next';
import React, { useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { getStepName } from '../../../../utils/processes';
import MeltaTooltip from '../../../MeltaDesigns/MeltaTooltip';

interface StepNameProps {
    step: IMongoStepInstancePopulated | null;
}

export const StepName: React.FC<StepNameProps> = ({ step }) => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stepName = useMemo(() => (step ? getStepName(step.templateId, processTemplatesMap) : undefined), [step]);

    return (
        <MeltaTooltip title={!step && i18next.t('notifications.stepDeleted')}>
            <Typography display="inline" fontWeight="bold">
                {`${stepName ?? i18next.t('notifications.unknown')} `}
            </Typography>
        </MeltaTooltip>
    );
};

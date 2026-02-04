import { Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { IProcessTemplateMap } from '../../../../interfaces/processes/processTemplate';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { getStepName } from '../../../../utils/processes';
import MeltaTooltip from '../../../MeltaDesigns/MeltaTooltip';

interface StepNameProps {
    step: IMongoStepInstancePopulated | null;
}

export const StepName: React.FC<StepNameProps> = ({ step }) => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;
    const stepName = useMemo(() => (step ? getStepName(step.templateId, processTemplatesMap) : undefined), [step, processTemplatesMap]);

    return (
        <MeltaTooltip title={!step && i18next.t('notifications.stepDeleted')}>
            <Typography display="inline" fontWeight="bold">
                {`${stepName ?? i18next.t('notifications.unknown')} `}
            </Typography>
        </MeltaTooltip>
    );
};

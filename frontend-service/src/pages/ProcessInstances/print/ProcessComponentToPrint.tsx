import React, { useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { AxiosError } from 'axios';
import { UseMutateAsyncFunction, useQueryClient } from 'react-query';
import { IMongoProcessInstancePopulated } from '../../../interfaces/processes/processInstance';
// import GeneralDetails from '../../../common/wizards/processInstance/ProcessDetails/GeneralDetails';
import { EntityDates } from '../../Entity/components/EntityDates';
import { CommentsDetails, ProcessStep } from '../../../common/wizards/processInstance/ProcessSteps/processStep';
import { IMongoStepInstancePopulated } from '../../../interfaces/processes/stepInstance';
import { IMongoStepTemplatePopulated } from '../../../interfaces/processes/stepTemplate';
import { BlueTitle } from '../../../common/BlueTitle';
import { IProcessTemplateMap } from '../../../interfaces/processes/processTemplate';
import { getInitialDetailsValues, useProcessDetailsFormik } from '../../../common/wizards/processInstance/ProcessDetails/detailsFormik';
import { ProcessDetailsValues } from '../../../common/wizards/processInstance/ProcessDetails';
import { getStepInstanceByStepTemplateId } from '../../../utils/processWizard/steps';
import OriGeneralDetails from '../../../common/wizards/processInstance/ProcessDetails/originalGeneralDetails';

const ProcessComponentToPrint: React.FC<{
    processInstance: IMongoProcessInstancePopulated;
    mutateAsync: UseMutateAsyncFunction<IMongoProcessInstancePopulated, AxiosError<any, any>, ProcessDetailsValues, unknown>;
}> = ({ processInstance, mutateAsync }) => {
    const theme = useTheme();

    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;

    const detailsFormikData = useProcessDetailsFormik(processInstance, processTemplatesMap, mutateAsync);

    return (
        <Box border={`2px solid ${theme.palette.primary.main}`} borderRadius="20px" padding="1rem">
            <Box padding="0.2rem">
                <OriGeneralDetails
                    detailsFormikData={detailsFormikData}
                    processInstance={processInstance}
                    toPrint
                    onNext={() => {}}
                    onBack={() => {}}
                    key={`${processInstance._id}//${processInstance.name}`}
                />
            </Box>
            <EntityDates createdAt={processInstance.createdAt.toString()} updatedAt={processInstance.updatedAt.toString()} />
        </Box>
    );
};

const StepComponentToPrint: React.FC<{
    stepInstance: IMongoStepInstancePopulated;
    stepTemplate: IMongoStepTemplatePopulated;
    processInstance: IMongoProcessInstancePopulated;
    onStepUpdateSuccess: (stepInstance: IMongoStepInstancePopulated) => void;
}> = ({ stepInstance, stepTemplate, processInstance, onStepUpdateSuccess }) => {
    const theme = useTheme();
    const [isStepEditMode, setIsStepEditMode] = useState(false);

    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;

    const values = getInitialDetailsValues(processInstance, processTemplatesMap);
    const reviewers = values.steps[getStepInstanceByStepTemplateId(stepTemplate._id, processInstance)!._id];

    return (
        <Box border={`2px solid ${theme.palette.primary.main}`} borderRadius="20px" padding="1rem">
            <Box padding="0.2rem">
                <ProcessStep
                    stepInstance={stepInstance}
                    stepTemplate={stepTemplate}
                    processInstance={processInstance}
                    isStepEditMode={isStepEditMode}
                    setIsStepEditMode={setIsStepEditMode}
                    onStepUpdateSuccess={onStepUpdateSuccess}
                    toPrint
                />
            </Box>
            <Box padding="0.2rem">
                <CommentsDetails values={stepInstance} toPrint />
                <BlueTitle title={i18next.t('wizard.processInstance.stepReviewers')} component="h6" variant="h6" />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', minHeight: '25px', width: '100%' }}>
                    {stepTemplate.reviewers.map((reviewer) => (
                        <Typography variant="body1" key={reviewer._id} sx={{ paddingY: '5px', paddingX: '10px' }}>
                            {`- ${reviewer.displayName}`}
                        </Typography>
                    ))}
                    {reviewers.map((reviewer) => (
                        <Typography variant="body1" key={reviewer._id} sx={{ paddingY: '5px', paddingX: '10px' }}>
                            {`- ${reviewer.displayName}`}
                        </Typography>
                    ))}
                </Box>
            </Box>
            <EntityDates createdAt={stepInstance.createdAt.toString()} updatedAt={stepInstance.updatedAt.toString()} />
        </Box>
    );
};

export { ProcessComponentToPrint, StepComponentToPrint };

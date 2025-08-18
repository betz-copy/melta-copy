import { Box, Typography, useTheme } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { UseMutateAsyncFunction, useQueryClient } from 'react-query';
import BlueTitle from '../../../common/MeltaDesigns/BlueTitle';
import { ProcessDetailsValues } from '../../../common/wizards/processInstance/ProcessDetails';
import { getInitialDetailsValues, useProcessDetailsFormik } from '../../../common/wizards/processInstance/ProcessDetails/detailsFormik';
import GeneralDetails from '../../../common/wizards/processInstance/ProcessDetails/GeneralDetails';
import { CommentsDetails, ProcessStep } from '../../../common/wizards/processInstance/ProcessSteps/processStep';
import { IMongoProcessInstancePopulated } from '../../../interfaces/processes/processInstance';
import { IProcessTemplateMap } from '../../../interfaces/processes/processTemplate';
import { IMongoStepInstancePopulated } from '../../../interfaces/processes/stepInstance';
import { IMongoStepTemplatePopulated } from '../../../interfaces/processes/stepTemplate';
import { getStepInstanceByStepTemplateId } from '../../../utils/processWizard/steps';
import { EntityDates } from '../../Entity/components/EntityDates';

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
                <GeneralDetails
                    detailsFormikData={detailsFormikData}
                    processInstance={processInstance}
                    toPrint
                    isEditMode={false}
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

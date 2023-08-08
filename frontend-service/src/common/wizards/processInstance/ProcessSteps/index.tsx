import { Box, Grid, Tab } from '@mui/material';
import React from 'react';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { ProcessStep } from './processStep';
import { IMongoProcessInstancePopulated, IReferencedEntityForProcess, Status } from '../../../../interfaces/processes/processInstance';

export interface ProcessStepValues {
    properties: object;
    attachmentsProperties: object;
    entityReferences: Record<string, IReferencedEntityForProcess>;
    status: Status;
}

export interface IStepsProp {
    processTemplate: IMongoProcessTemplatePopulated;
    processInstance: IMongoProcessInstancePopulated;
    isStepEditMode: boolean;
    setIsStepEditMode: React.Dispatch<React.SetStateAction<boolean>>;
    onStepUpdateSuccess: (updatedStepInstance: IMongoStepInstancePopulated) => void;
    defaultStepTemplate?: IMongoStepTemplatePopulated;
}

const getStepTemplateByStepInstance = (
    stepInstance: IMongoStepInstancePopulated,
    processTemplate: IMongoProcessTemplatePopulated,
): IMongoStepTemplatePopulated => {
    return processTemplate.steps.find((step) => stepInstance.templateId === step._id)!;
};

const Steps: React.FC<IStepsProp> = ({
    processTemplate,
    processInstance,
    isStepEditMode,
    setIsStepEditMode,
    onStepUpdateSuccess,
    defaultStepTemplate,
}) => {
    const [tabValue, setTabValue] = React.useState(defaultStepTemplate ? defaultStepTemplate._id : processTemplate.steps[0]._id);
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                paddingRight: '60px',
                paddingLeft: '30px',
            }}
        >
            <TabContext value={tabValue}>
                <Grid container direction="column">
                    <Grid item container sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList onChange={(_event, newValue) => setTabValue(newValue)} scrollButtons="auto" variant="scrollable">
                            {processTemplate.steps?.map(({ _id, displayName }) => (
                                <Tab key={_id} label={displayName} value={_id} disabled={tabValue !== _id && isStepEditMode} />
                            ))}
                        </TabList>
                    </Grid>
                    <Grid item>
                        {processInstance.steps.map((stepInstance) => {
                            const stepTemplate = getStepTemplateByStepInstance(stepInstance, processTemplate);

                            return (
                                <TabPanel key={stepInstance._id} value={stepTemplate._id} >
                                    <ProcessStep
                                        onStepUpdateSuccess={onStepUpdateSuccess}
                                        processInstance={processInstance}
                                        stepInstance={stepInstance}
                                        stepTemplate={stepTemplate}
                                        isStepEditMode={isStepEditMode}
                                        setIsStepEditMode={setIsStepEditMode}
                                    />
                                </TabPanel>
                            );
                        })}
                    </Grid>
                </Grid>
            </TabContext>
        </Box>
    );
};

export default Steps;

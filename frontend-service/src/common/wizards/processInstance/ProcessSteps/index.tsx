import { Box, Grid, Tab } from '@mui/material';
import React from 'react';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { ScatterPlotOutlined as HiveIcon } from '@mui/icons-material';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { ProcessStep } from './processStep';
import { IMongoProcessInstancePopulated, IReferencedEntityForProcess, Status } from '../../../../interfaces/processes/processInstance';
import { CustomIcon } from '../../../CustomIcon';
import { useDarkModeStore } from '../../../../stores/darkMode';

export interface ProcessStepValues {
    properties: object;
    attachmentsProperties: object;
    entityReferences: Record<string, IReferencedEntityForProcess>;
    status: Status;
    comments: string;
}

export interface IStepsProp {
    processTemplate: IMongoProcessTemplatePopulated;
    processInstance: IMongoProcessInstancePopulated;
    isStepEditMode: boolean;
    setIsStepEditMode: React.Dispatch<React.SetStateAction<boolean>>;
    onStepUpdateSuccess: (stepInstance: IMongoStepInstancePopulated) => void;
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
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const defaultTabColor = darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                paddingRight: '30px',
                paddingLeft: '30px',
            }}
        >
            <TabContext value={tabValue}>
                <Grid container direction="column">
                    <Grid item container sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList onChange={(_event, newValue) => setTabValue(newValue)} scrollButtons="auto" variant="scrollable">
                            {processTemplate.steps?.map(({ _id, displayName, iconFileId }) => (
                                <Tab
                                    icon={
                                        iconFileId ? (
                                            <CustomIcon
                                                color={_id === tabValue ? '#1565c0' : defaultTabColor}
                                                iconUrl={iconFileId}
                                                width="25px"
                                                height="25px"
                                                style={{ marginLeft: 5 }}
                                            />
                                        ) : (
                                            <HiveIcon />
                                        )
                                    }
                                    iconPosition="start"
                                    key={_id}
                                    label={displayName}
                                    value={_id}
                                    disabled={tabValue !== _id && isStepEditMode}
                                    wrapped
                                />
                            ))}
                        </TabList>
                    </Grid>
                    <Grid item>
                        {processInstance.steps.map((stepInstance) => {
                            const stepTemplate = getStepTemplateByStepInstance(stepInstance, processTemplate);
                            return (
                                <TabPanel key={stepInstance._id} value={stepTemplate._id}>
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

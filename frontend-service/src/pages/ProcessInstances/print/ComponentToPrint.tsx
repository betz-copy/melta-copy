import React from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { UseMutateAsyncFunction, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { BlueTitle } from '../../../common/BlueTitle';
import { IFile } from '../../../interfaces/preview';
import { IMongoProcessInstancePopulated } from '../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../../interfaces/processes/processTemplate';
import ProcessStatus from '../../../common/wizards/processInstance/ProcessSummaryStep/ProcessStatus';
import ProcessSummary from '../../../common/wizards/processInstance/ProcessSummaryStep';
import { ProcessComponentToPrint, StepComponentToPrint } from './ProcessComponentToPrint';
import { IPermissionsOfUser } from '../../../services/permissionsService';
import { getStepTemplateByStepInstance } from '../../../utils/processWizard/steps';
import { getProcessByIdRequest } from '../../../services/processesService';
import { ProcessDetailsValues } from '../../../common/wizards/processInstance/ProcessDetails';
import { FileToPrint } from '../../../common/print/FileToPrint';

const ComponentToPrint = React.forwardRef<
    HTMLDivElement,
    {
        processTemplate: IMongoProcessTemplatePopulated;
        processInstance: IMongoProcessInstancePopulated;
        mutateAsync: UseMutateAsyncFunction<IMongoProcessInstancePopulated, AxiosError<any, any>, ProcessDetailsValues, unknown>;
        setCurrProcessInstance: React.Dispatch<React.SetStateAction<IMongoProcessInstancePopulated>>;
        setIsProcessChanged: React.Dispatch<React.SetStateAction<boolean>>;
        filesToPrint: IFile[];
        setSelectedFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
        setFilesLoadingStatus: React.Dispatch<React.SetStateAction<{}>>;
        options: {
            showSummary: boolean;
            showFiles: boolean;
        };
    }
>(
    (
        {
            processTemplate,
            processInstance,
            options,
            filesToPrint,
            setSelectedFiles,
            mutateAsync,
            setCurrProcessInstance,
            setIsProcessChanged,
            setFilesLoadingStatus,
        },
        ref,
    ) => {
        const theme = useTheme();
        const queryClient = useQueryClient();
        const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

        return (
            <Box ref={ref} margin="20px" style={{ direction: 'rtl' }}>
                {options.showSummary && (
                    <Box sx={{ minHeight: '1000px' }}>
                        <ProcessSummary isPrinting processInstance={processInstance} processTemplate={processTemplate} />
                    </Box>
                )}
                <Grid style={{ pageBreakInside: 'avoid' }}>
                    <Box paddingBottom="0.4rem" display="flex" justifyContent="space-between" alignItems="center" marginBottom={1} width="700px">
                        <Box display="flex" alignItems="center" justifyItems="flex-end">
                            <Typography component="h4" variant="h4" color={theme.palette.primary.main} fontWeight="800">
                                {processInstance.name}
                            </Typography>

                            <Typography variant="h4" fontSize="30px" color="#d3d8df" marginLeft="5px" marginRight="5px">
                                /
                            </Typography>

                            <Typography paddingBottom="2px" variant="h4" fontSize="28px" color={theme.palette.primary.main}>
                                {processTemplate.displayName}
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" justifyItems="flex-start" gap="10px">
                            <Grid style={{ textAlign: 'left', width: '100%' }}>
                                <Typography>{`${i18next.t('wizard.processInstance.summary.printedAt')} : ${new Date().toLocaleDateString(
                                    'en-UK',
                                )}`}</Typography>
                                <Typography>{`${i18next.t('wizard.processInstance.summary.printedBy')} : ${myPermissions.user.fullName}`}</Typography>
                            </Grid>
                            <Grid width="5px">
                                <ProcessStatus instance={processInstance} />
                            </Grid>
                        </Box>
                    </Box>
                    <ProcessComponentToPrint processInstance={processInstance} mutateAsync={mutateAsync} />
                </Grid>
                {processInstance.steps.map((stepInstance, index) => {
                    const stepTemplate = getStepTemplateByStepInstance(stepInstance, processTemplate);
                    return (
                        <Grid style={{ pageBreakInside: 'avoid' }} key={`${stepInstance._id}-${stepTemplate._id}`}>
                            <Box
                                paddingBottom="0.4rem"
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                marginTop={5}
                                marginBottom={1}
                                width="700px"
                            >
                                <Box display="flex" alignItems="center">
                                    <Typography component="h4" variant="h4" color={theme.palette.primary.main} fontWeight="800">
                                        {stepTemplate.displayName}
                                    </Typography>

                                    <Typography variant="h4" fontSize="30px" color="#d3d8df" marginLeft="5px" marginRight="5px">
                                        /
                                    </Typography>

                                    <Typography paddingBottom="2px" variant="h4" fontSize="28px" color={theme.palette.primary.main}>
                                        {`${i18next.t('wizard.processTemplate.level')} ${index + 1}`}
                                    </Typography>
                                </Box>
                                <Grid width="5px">
                                    <ProcessStatus instance={processInstance} />
                                </Grid>
                            </Box>
                            <StepComponentToPrint
                                stepInstance={stepInstance}
                                stepTemplate={stepTemplate}
                                processInstance={processInstance}
                                onStepUpdateSuccess={async (stepInstanceUpdate) => {
                                    setCurrProcessInstance((prev) => {
                                        const newSteps = prev.steps;
                                        const updatedStepIndex = newSteps.findIndex((step) => step._id === stepInstanceUpdate._id);
                                        newSteps[updatedStepIndex] = stepInstanceUpdate;
                                        return { ...prev, steps: newSteps };
                                    });

                                    const newProcess = await getProcessByIdRequest(processInstance._id);
                                    setCurrProcessInstance(newProcess);
                                    setIsProcessChanged(true);
                                }}
                            />
                        </Grid>
                    );
                })}
                {options.showFiles && (
                    <>
                        <Grid sx={{ width: '100%', height: '100%', paddingY: '55%', paddingX: '37.5%' }}>
                            <BlueTitle title={i18next.t('entityPage.print.appendices')} component="h2" variant="h2" style={{ marginTop: '2rem' }} />
                        </Grid>
                        {filesToPrint.map((file) => {
                            return (
                                <FileToPrint
                                    file={file}
                                    key={`${file.id}-${file.contentType}`}
                                    setSelectedFiles={setSelectedFiles}
                                    onPreviewLoadingFinished={() => {
                                        setFilesLoadingStatus((prev) => ({ ...prev, [file.id]: false }));
                                    }}
                                />
                            );
                        })}
                    </>
                )}
            </Box>
        );
    },
);

export { ComponentToPrint };

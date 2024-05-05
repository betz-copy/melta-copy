import React from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { UseMutateAsyncFunction, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { AccessTimeFilled as AccessTimeFilledIcon, Cancel as CancelIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { BlueTitle } from '../../../common/BlueTitle';
import { IFile } from '../../../interfaces/preview';
import { IMongoProcessInstancePopulated, Status } from '../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../../interfaces/processes/processTemplate';
import { StatusDisplay } from '../../../common/wizards/processInstance/ProcessSummaryStep/ProcessStatus';
import ProcessSummary from '../../../common/wizards/processInstance/ProcessSummaryStep';
import { ProcessComponentToPrint, StepComponentToPrint } from './ProcessComponentToPrint';
import { IPermissionsOfUser } from '../../../services/permissionsService';
import { getStepTemplateByStepInstance } from '../../../utils/processWizard/steps';
import { getProcessByIdRequest } from '../../../services/processesService';
import { ProcessDetailsValues } from '../../../common/wizards/processInstance/ProcessDetails';
import { FileToPrint } from '../../../common/PrintFiles/FileToPrint';

const ComponentToPrint = React.forwardRef<
    HTMLDivElement,
    {
        processTemplate: IMongoProcessTemplatePopulated;
        processInstance: IMongoProcessInstancePopulated;
        mutateAsync: UseMutateAsyncFunction<IMongoProcessInstancePopulated, AxiosError<any, any>, ProcessDetailsValues, unknown>;
        setCurrProcessInstance: React.Dispatch<React.SetStateAction<IMongoProcessInstancePopulated>>;
        setIsProcessChanged: React.Dispatch<React.SetStateAction<boolean>>;
        filesToPrint: IFile[];
        setFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
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
            setFiles,
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
                    <Box sx={{ minHeight: '1050px' }}>
                        <ProcessSummary isPrinting processInstance={processInstance} processTemplate={processTemplate} />
                    </Box>
                )}
                <Box paddingBottom="0.4rem" display="flex" justifyContent="space-between" alignItems="center" marginBottom={1}>
                    <Box display="flex" alignItems="center">
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
                    <Box display="flex" alignItems="center" sx={{ gap: '20px' }}>
                        <Grid style={{ textAlign: 'left', width: '95%' }}>
                            <Typography>{`${i18next.t('wizard.processInstance.summary.printedAt')} : ${new Date().toLocaleDateString(
                                'en-UK',
                            )}`}</Typography>
                            <Typography>{`${i18next.t('wizard.processInstance.summary.printedBy')} : ${myPermissions.user.fullName}`}</Typography>
                        </Grid>
                        {processInstance.status === Status.Approved && (
                            <StatusDisplay
                                Icon={CheckCircleIcon}
                                text={i18next.t('wizard.processInstance.summary.processCompleted')}
                                status={processInstance.status}
                                fontSize={55}
                            />
                        )}
                        {processInstance.status === Status.Rejected && (
                            <StatusDisplay
                                Icon={CancelIcon}
                                text={i18next.t('wizard.processInstance.summary.processRejected')}
                                status={processInstance.status}
                                fontSize={55}
                            />
                        )}
                        {processInstance.status === Status.Pending && (
                            <StatusDisplay
                                Icon={AccessTimeFilledIcon}
                                text={i18next.t('wizard.processInstance.summary.processPending')}
                                status={processInstance.status}
                                fontSize={55}
                            />
                        )}
                    </Box>
                </Box>
                <ProcessComponentToPrint processInstance={processInstance} mutateAsync={mutateAsync} />
                {processInstance.steps.map((stepInstance, index) => {
                    const stepTemplate = getStepTemplateByStepInstance(stepInstance, processTemplate);
                    return (
                        <Grid style={{ pageBreakInside: 'avoid' }} key={`${stepInstance._id}-${stepTemplate._id}`}>
                            <Box paddingBottom="0.4rem" display="flex" justifyContent="flex-start" alignItems="center" marginTop={5} marginBottom={1}>
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
                                    setSelectedFiles={setFiles}
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

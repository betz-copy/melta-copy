import { Box, Divider, Grid, Typography, useTheme } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import { noop } from 'lodash';
import React from 'react';
import { UseMutateAsyncFunction } from 'react-query';
import { toast } from 'react-toastify';
import BlueTitle from '../../../common/MeltaDesigns/BlueTitle';
import { FileToPrint } from '../../../common/print/FileToPrint';
import { ProcessDetailsValues } from '../../../common/wizards/processInstance/ProcessDetails';
import ProcessSummary from '../../../common/wizards/processInstance/ProcessSummaryStep';
import ProcessStatus, { ReviewedAtProcessStatus } from '../../../common/wizards/processInstance/ProcessSummaryStep/ProcessStatus';
import { IFile } from '../../../interfaces/preview';
import { IMongoProcessInstancePopulated } from '../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../../interfaces/processes/processTemplate';
import { getProcessByIdRequest } from '../../../services/processesService';
import { useUserStore } from '../../../stores/user';
import { getStepTemplateByStepInstance } from '../../../utils/processWizard/steps';
import { ProcessComponentToPrint, StepComponentToPrint } from './ProcessComponentToPrint';

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

        const currentUser = useUserStore((state) => state.user);

        return (
            <Box ref={ref} margin="20px" width="750px" style={{ direction: 'rtl', color: '#000' }}>
                {options.showSummary && (
                    <>
                        <Box sx={{ minHeight: '1000px' }}>
                            <ProcessSummary isPrinting processInstance={processInstance} setActiveStep={noop} processTemplate={processTemplate} />
                        </Box>
                        {processTemplate.steps.length > 6 && <Divider sx={{ paddingY: '50px' }} />}
                    </>
                )}
                <Grid style={{ pageBreakInside: 'avoid' }}>
                    <Grid style={{ textAlign: 'left', padding: '15px' }}>
                        <Typography>{`${i18next.t('wizard.processInstance.summary.printedAt')} : ${new Date().toLocaleDateString(
                            'en-UK',
                        )}`}</Typography>
                        <Typography>{`${i18next.t('wizard.processInstance.summary.printedBy')} : ${currentUser.fullName}`}</Typography>
                    </Grid>
                    <Box paddingBottom="0.4rem" display="flex" justifyContent="space-between" alignItems="center" marginBottom={1}>
                        <Grid container alignItems="center" justifyContent="space-between" wrap="nowrap">
                            <Grid size={{ xs: 12 }}>
                                <Box display="flex" alignItems="center" flexWrap="wrap">
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
                            </Grid>
                            <Grid container size={{ xs: 'auto' }} alignItems="center" spacing={1}>
                                {processInstance.reviewedAt && (
                                    <Grid>
                                        <ReviewedAtProcessStatus instance={processInstance} isPrinting />
                                    </Grid>
                                )}
                                <Grid>
                                    <ProcessStatus instance={processInstance} isPrinting />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                    <ProcessComponentToPrint processInstance={processInstance} mutateAsync={mutateAsync} />
                </Grid>
                {processInstance.steps.map((stepInstance, index) => {
                    const stepTemplate = getStepTemplateByStepInstance(stepInstance, processTemplate);
                    return (
                        <Grid style={{ pageBreakInside: 'avoid' }} key={`${stepInstance._id}-${stepTemplate._id}`} marginTop={5}>
                            <Box paddingBottom="0.4rem" display="flex" justifyContent="space-between" alignItems="center" marginBottom={1}>
                                <Grid container alignItems="center" justifyContent="space-between" wrap="nowrap">
                                    <Grid size={{ xs: 12 }}>
                                        <Box display="flex" alignItems="center" flexWrap="wrap">
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
                                    </Grid>
                                    <Grid container size={{ xs: 'auto' }} alignItems="center" spacing={1}>
                                        {stepInstance.reviewedAt && (
                                            <Grid>
                                                <ReviewedAtProcessStatus instance={stepInstance} isPrinting />
                                            </Grid>
                                        )}
                                        <Grid>
                                            <ProcessStatus instance={stepInstance} isPrinting />
                                        </Grid>
                                    </Grid>
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
                        <Grid sx={{ width: '100%', height: '100%', paddingY: '55%', paddingX: '27%' }}>
                            <BlueTitle
                                title={i18next.t('entityPage.print.accompanyingFiles')}
                                component="h2"
                                variant="h2"
                                style={{ marginTop: '2rem' }}
                            />
                        </Grid>
                        {filesToPrint.map((file) => {
                            return (
                                <FileToPrint
                                    file={file}
                                    key={`${file.id}-${file.contentType}`}
                                    onPreviewLoadingFinished={(error?: boolean) => {
                                        setFilesLoadingStatus((prev) => ({ ...prev, [file.id]: false }));
                                        if (error) {
                                            toast.error(i18next.t('entityPage.previewRefetch'));
                                            setSelectedFiles((prevSelectedFiles) =>
                                                prevSelectedFiles.filter((selectedFile) => selectedFile.id !== file.id),
                                            );
                                        }
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

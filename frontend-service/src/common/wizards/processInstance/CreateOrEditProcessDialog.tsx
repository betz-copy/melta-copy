import { NavigateBefore, Close } from '@mui/icons-material';
import { Box, Dialog, Divider, Fab, Grid, IconButton, Step, StepLabel, Stepper } from '@mui/material';
import { AxiosError } from 'axios';
import { FormikProvider } from 'formik';
import i18next from 'i18next';
import { pickBy } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UseMutateAsyncFunction, useQueryClient } from 'react-query';
import { IMongoProcessInstancePopulated } from '../../../interfaces/processes/processInstance';
import { IProcessTemplateMap } from '../../../interfaces/processes/processTemplate';
import { useDarkModeStore } from '../../../stores/darkMode';
import { getAllFieldsTouched } from '../../../utils/processWizard/formik';
import { setInitialStepsObject } from '../../../utils/processWizard/steps';
import BlueTitle from '../../MeltaDesigns/BlueTitle';
import { ProcessDetailsValues } from './ProcessDetails';
import { initDetailsValues, useProcessDetailsFormik } from './ProcessDetails/detailsFormik';
import { GeneralDetailsFields } from './ProcessDetails/GeneralDetailsFields';
import StepsReviewers from './ProcessDetails/StepsReviewers';
import { TemplateFields } from './ProcessDetails/TemplateFields';

interface ISimpleDialogProps {
    open: boolean;
    onClose: () => void;
    processInstance?: IMongoProcessInstancePopulated;
    viewMode?: boolean;
    isEditMode?: boolean;
    mutateAsync: UseMutateAsyncFunction<IMongoProcessInstancePopulated, AxiosError<any, any>, ProcessDetailsValues, unknown>;
}

const steps = [
    {
        label: i18next.t('wizard.processInstance.generalDetails'),
    },
    {
        label: i18next.t('wizard.processInstance.stepsReviewers'),
    },
];

const CreateOrEditProcess: React.FC<ISimpleDialogProps> = ({ open, onClose, processInstance, viewMode = false, isEditMode = false, mutateAsync }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;

    const detailsFormikData = useProcessDetailsFormik(processInstance, processTemplatesMap, mutateAsync);

    const [activeProcessDetailsStep, setActiveProcessDetailsStep] = useState(0);

    const { template } = detailsFormikData.values;

    const { details } = template || {};

    const handleNext = useCallback(() => {
        const currentTouched: Record<string, any> = getAllFieldsTouched(detailsFormikData.values);

        const templateFileProperties = template
            ? pickBy(
                  details?.properties.properties,
                  (value) => (value.type === 'array' && value.items?.format === 'fileId') || value.format === 'fileId',
              )
            : undefined;
        const templateEntityReferenceProperties = template
            ? pickBy(details?.properties.properties, (value) => value.format === 'entityReference')
            : undefined;

        const detailsAttachments: Record<string, boolean> = {};
        Object.keys(templateFileProperties!).forEach((fileField) => {
            detailsAttachments[fileField] = true;
        });
        currentTouched.detailsAttachments = detailsAttachments;

        const entityReferences: Record<string, boolean> = {};
        Object.keys(templateEntityReferenceProperties!).forEach((entityField) => {
            entityReferences[entityField] = true;
        });
        currentTouched.entityReferences = entityReferences;

        detailsFormikData.setTouched(currentTouched);

        if (detailsFormikData.isValid) setActiveProcessDetailsStep((prevActiveStep) => prevActiveStep + 1);
    }, [details?.properties.properties, detailsFormikData, template]);

    const handleBack = useCallback(() => {
        setActiveProcessDetailsStep((prevActiveStep) => prevActiveStep - 1);
    }, []);

    const { values, touched, errors, setFieldValue, setFieldTouched, handleBlur, resetForm } = detailsFormikData;

    const previousTemplate = useRef(values.template);

    const variant = viewMode ? 'standard' : 'outlined';
    const templateFileProperties = useMemo(
        () =>
            values.template
                ? pickBy(
                      values.template.details.properties.properties,
                      (value) => (value.type === 'array' && value.items?.format === 'fileId') || value.format === 'fileId',
                  )
                : undefined,
        [values.template],
    );

    const templateEntityReferenceProperties = useMemo(
        () => (values.template ? pickBy(values.template.details.properties.properties, (value) => value.format === 'entityReference') : undefined),
        [values.template],
    );

    useEffect(() => {
        previousTemplate.current = values.template;
    }, [values.template]);

    useEffect(() => {
        if (values.template && !isEditMode) {
            if (values.template.name !== previousTemplate?.current?.name) {
                resetForm({
                    values: {
                        template: values.template,
                        details: initDetailsValues(values.template),
                        detailsAttachments: {},
                        endDate: null,
                        entityReferences: {},
                        name: '',
                        startDate: null,
                        steps: {},
                    },
                });
            }
            setFieldValue('steps', setInitialStepsObject(values.template.steps));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values.template?._id]);

    return (
        <Dialog open={open} fullWidth maxWidth="xl" PaperProps={{ sx: { height: '85vh' } }}>
            <FormikProvider value={detailsFormikData}>
                <IconButton
                    aria-label="close"
                    onClick={() => {
                        onClose();
                        detailsFormikData.resetForm();
                    }}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <Close fontSize="large" />
                </IconButton>
                <Grid container flexDirection="row" height="100%" width="100%" flexWrap="nowrap">
                    <Grid
                        container
                        flexDirection="column"
                        alignItems="center"
                        flexBasis="20%"
                        minWidth="280px"
                        padding={3}
                        sx={{
                            backgroundColor: darkMode ? '#171717' : '#F0F2F7',
                            borderBottomLeftRadius: '20px',
                            borderTopLeftRadius: '20px',
                            boxShadow: '1px 1px 10px 1px #888888',
                        }}
                    >
                        <Grid width="100%">
                            <BlueTitle
                                title={isEditMode ? i18next.t('wizard.processInstance.editProcess') : i18next.t('processInstancesPage.addNewProcess')}
                                component="h5"
                                variant="h5"
                                style={{ fontWeight: 700, opacity: 0.9 }}
                            />
                            <GeneralDetailsFields
                                processTemplatesMap={processTemplatesMap}
                                setFieldValue={setFieldValue}
                                values={values}
                                isEditMode={isEditMode}
                                processInstance={processInstance}
                                viewMode={viewMode}
                                variant={variant}
                                touched={touched}
                                errors={errors}
                                handleBlur={handleBlur}
                                setFieldTouched={setFieldTouched}
                            />
                        </Grid>
                    </Grid>
                    <Grid container flexBasis="75%" flexDirection="column" height="100%">
                        {values.template && (
                            <Grid flexBasis="10%" width="100%">
                                <Box sx={{ width: '40%', padding: 3 }}>
                                    <Stepper nonLinear activeStep={activeProcessDetailsStep} alternativeLabel>
                                        {steps.map(({ label }) => (
                                            <Step key={label}>
                                                <StepLabel>{label}</StepLabel>
                                            </Step>
                                        ))}
                                    </Stepper>
                                </Box>
                            </Grid>
                        )}
                        <Divider variant="middle" />
                        {values.template && activeProcessDetailsStep === 0 && (
                            <Grid container flexDirection="column" height="85%" width="100%" justifyContent="space-between">
                                <Grid height="85%" width="100%">
                                    <TemplateFields
                                        toPrint={false}
                                        values={values}
                                        viewMode={viewMode}
                                        errors={errors}
                                        touched={touched}
                                        setFieldValue={setFieldValue}
                                        setFieldTouched={setFieldTouched}
                                        templateFileProperties={templateFileProperties}
                                        handleBlur={handleBlur}
                                        templateEntityReferenceProperties={templateEntityReferenceProperties}
                                    />
                                </Grid>
                                <Grid container height="10%" width="100%" justifyContent="flex-end">
                                    <Grid>
                                        {values.template && !viewMode && (
                                            <Fab
                                                size="small"
                                                onClick={() => {
                                                    handleNext();
                                                }}
                                                variant="extended"
                                                color="primary"
                                                style={{
                                                    borderRadius: '7px',
                                                    padding: '10px',
                                                }}
                                            >
                                                <NavigateBefore />
                                                {i18next.t('wizard.processInstance.moveToStepsReviewers')}
                                            </Fab>
                                        )}
                                    </Grid>
                                </Grid>
                            </Grid>
                        )}
                        {values.template && activeProcessDetailsStep === 1 && (
                            <Grid flexBasis="80%" height="80%">
                                <StepsReviewers
                                    detailsFormikData={detailsFormikData}
                                    onNext={handleNext}
                                    onBack={handleBack}
                                    processInstance={processInstance}
                                    isEditMode={isEditMode}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </FormikProvider>
        </Dialog>
    );
};

export default CreateOrEditProcess;

import React, { useEffect, useState } from 'react';
import { Dialog, IconButton, Grid, Box, Stepper, Step, StepLabel, Divider, Fab } from '@mui/material';
import { useQueryClient } from 'react-query';
import CloseIcon from '@mui/icons-material/Close';
import { pickBy } from 'lodash';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import i18next from 'i18next';
import { IMongoProcessTemplatePopulated, IProcessTemplateMap } from '../../../interfaces/processes/processTemplate';
import { initDetailsValues, useProcessDetailsFormik } from './ProcessDetails/detailsFormik';
import { BlueTitle } from '../../BlueTitle';
import { getAllFieldsTouched } from '../../../utils/processWizard/formik';
import { GeneralDetailsFields } from './ProcessDetails/GeneralDetailsFields';
import { TemplateFields } from './ProcessDetails/TemplateFields';
import { setInitialStepsObject } from '../../../utils/processWizard/steps';
import StepsReviewers from './ProcessDetails/StepsReviewers';
import { IMongoProcessInstancePopulated } from '../../../interfaces/processes/processInstance';

interface ISimpleDialogProps {
    open: boolean;
    onClose: () => void;
    processInstance?: IMongoProcessInstancePopulated;
    viewMode?: boolean;
    isEditMode?: boolean;
    mutateAsync: any;
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
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;

    const detailsFormikData = useProcessDetailsFormik(processInstance, processTemplatesMap, mutateAsync);

    const [activeProcessDetailsStep, setActiveProcessDetailsStep] = React.useState(0);

    const handleNext = () => {
        const currentTouched: Record<string, any> = getAllFieldsTouched(detailsFormikData.values);

        const templateFileProperties = detailsFormikData.values.template
            ? pickBy(
                  detailsFormikData.values.template.details.properties.properties,
                  (value) => (value.type === 'array' && value.items?.format === 'fileId') || value.format === 'fileId',
              )
            : undefined;
        const templateEntityReferenceProperties = detailsFormikData.values.template
            ? pickBy(detailsFormikData.values.template.details.properties.properties, (value) => value.format === 'entityReference')
            : undefined;

        const detailsAttachments = {};
        Object.keys(templateFileProperties!).forEach((fileField) => {
            detailsAttachments[fileField] = true;
        });
        currentTouched.detailsAttachments = detailsAttachments;

        const entityReferences = {};
        Object.keys(templateEntityReferenceProperties!).forEach((entityField) => {
            entityReferences[entityField] = true;
        });
        currentTouched.entityReferences = entityReferences;

        detailsFormikData.setTouched(currentTouched);

        if (detailsFormikData.isValid) setActiveProcessDetailsStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveProcessDetailsStep((prevActiveStep) => prevActiveStep - 1);
    };

    const { values, touched, errors, setFieldValue, setFieldTouched, handleBlur, resetForm, initialValues } = detailsFormikData;

    console.log({ values, initialValues });
    const [previousTemplate, setPreviousTemplate] = useState<IMongoProcessTemplatePopulated>();
    const variant = viewMode ? 'standard' : 'outlined';
    const templateFileProperties = values.template
        ? pickBy(
              values.template.details.properties.properties,
              (value) => (value.type === 'array' && value.items?.format === 'fileId') || value.format === 'fileId',
          )
        : undefined;

    const templateEntityReferenceProperties = values.template
        ? pickBy(values.template.details.properties.properties, (value) => value.format === 'entityReference')
        : undefined;

    useEffect(() => {
        if (values.template && !isEditMode) {
            setPreviousTemplate(values.template);
            if (values.template.name !== previousTemplate?.name) {
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
    }, [values.template?._id]);

    return (
        <Dialog open={open} fullWidth maxWidth="xl" PaperProps={{ style: { height: '85vh' } }}>
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
                <CloseIcon fontSize="large" />
            </IconButton>
            <Grid container flexDirection="row" height="100%" flexWrap="nowrap">
                <Grid
                    container
                    item
                    flexDirection="column"
                    alignItems="center"
                    flexBasis="20%"
                    padding={3}
                    style={{
                        backgroundColor: '#F0F2F7',
                        borderBottomLeftRadius: '20px',
                        borderTopLeftRadius: '20px',
                        boxShadow: '10px 10px 15px 10px #888888',
                    }}
                >
                    <Grid item width="100%">
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
                <Grid container item flexBasis="75%" flexDirection="column" height="100%">
                    {values.template && (
                        <Grid item flexBasis="10%">
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
                        <Grid item container flexDirection="column" height="85%" justifyContent="space-between">
                            <Grid item height="85%">
                                <TemplateFields
                                    toPrint={false}
                                    values={values}
                                    viewMode={viewMode}
                                    setEditMode={() => {}}
                                    errors={errors}
                                    touched={touched}
                                    setFieldValue={setFieldValue}
                                    setFieldTouched={setFieldTouched}
                                    templateFileProperties={templateFileProperties}
                                    handleBlur={handleBlur}
                                    templateEntityReferenceProperties={templateEntityReferenceProperties}
                                    onNext={handleNext}
                                />
                            </Grid>
                            <Grid item container height="10%" width="100%" justifyContent="flex-end">
                                <Grid>
                                    {values.template && !viewMode && (
                                        <Fab
                                            size="small"
                                            onClick={() => {
                                                handleNext();
                                            }}
                                            variant="extended"
                                            color="primary"
                                        >
                                            <NavigateBeforeIcon />
                                            {i18next.t('wizard.processInstance.moveToStepsReviewers')}
                                        </Fab>
                                    )}
                                </Grid>
                            </Grid>
                        </Grid>
                    )}
                    {values.template && activeProcessDetailsStep === 1 && (
                        <Grid item flexBasis="80%" height="80%">
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
        </Dialog>
    );
};

export default CreateOrEditProcess;

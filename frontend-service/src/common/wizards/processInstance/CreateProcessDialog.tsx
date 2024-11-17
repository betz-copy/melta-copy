import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Grid } from '@mui/material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import CloseIcon from '@mui/icons-material/Close';
import { pickBy } from 'lodash';
import i18next from 'i18next';
import { ProcessDetailsValues } from './ProcessDetails';
import { IMongoProcessTemplatePopulated, IProcessTemplateMap } from '../../../interfaces/processes/processTemplate';
import { initDetailsValues, useProcessDetailsFormik } from './ProcessDetails/detailsFormik';
import { createProcessRequest } from '../../../services/processesService';
import { BlueTitle } from '../../BlueTitle';
import { ErrorToast } from '../../ErrorToast';
import { getAllFieldsTouched } from '../../../utils/processWizard/formik';
import { GeneralDetailsFields } from './ProcessDetails/GeneralDetailsFields';
import { TemplateFields } from './ProcessDetails/TemplateFields';
import { setInitialStepsObject } from '../../../utils/processWizard/steps';
import StepsReviewers from './ProcessDetails/StepsReviewers';

interface ISimpleDialogProps {
    open: boolean;
    onClose: () => void;
}

const CreateProcess: React.FC<ISimpleDialogProps> = ({ open, onClose }) => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;

    const { mutateAsync } = useMutation((processData: ProcessDetailsValues) => createProcessRequest(processData), {
        onSuccess: () => {
            toast.success(i18next.t('processInstancesPage.processCreatedSuccessfully'));
            onClose();
            queryClient.resetQueries({ queryKey: ['searchProcesses'] }); // reset ProcessesList search results
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('processInstancesPage.failedToCreateProcess')} />);
            console.log('Failed to create process. Error', error);
        },
    });

    const detailsFormikData = useProcessDetailsFormik(undefined, processTemplatesMap, mutateAsync);

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

    const { values, touched, errors, setFieldValue, setFieldTouched, handleBlur, resetForm } = detailsFormikData;
    const [previousTemplate, setPreviousTemplate] = useState<IMongoProcessTemplatePopulated>();
    const viewMode = false;
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
        if (values.template) {
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
            {/* <BlueTitle title={i18next.t('processInstancesPage.addNewProcess')} variant="h4" component="symbol" /> */}
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
                        // backgroundColor: darkMode ? '#343536' : '#F0F2F7',
                        borderBottomLeftRadius: '20px',
                        borderTopLeftRadius: '20px',
                        boxShadow: '10px 10px 15px 10px #888888',
                    }}
                >
                    <Grid item width="100%">
                        <BlueTitle
                            title={i18next.t('processInstancesPage.addNewProcess')}
                            component="h5"
                            variant="h5"
                            style={{ fontWeight: 700, opacity: 0.9 }}
                        />
                        <GeneralDetailsFields
                            processTemplatesMap={processTemplatesMap}
                            setFieldValue={setFieldValue}
                            values={values}
                            isEditMode={false}
                            processInstance={undefined}
                            viewMode={viewMode}
                            variant={variant}
                            touched={touched}
                            errors={errors}
                            handleBlur={handleBlur}
                            setFieldTouched={setFieldTouched}
                        />
                    </Grid>
                </Grid>
                <Grid item flexBasis="75%">
                    {values.template && activeProcessDetailsStep === 0 && (
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
                            onNext={handleNext}
                        />
                    )}
                    {values.template && activeProcessDetailsStep === 1 && (
                        <StepsReviewers
                            detailsFormikData={detailsFormikData}
                            onNext={handleNext}
                            onBack={handleBack}
                            processInstance={undefined}
                            // toPrint={false}
                            // values={values}
                            // viewMode={viewMode}
                            // errors={errors}
                            // touched={touched}
                            // setFieldValue={setFieldValue}
                            // setFieldTouched={setFieldTouched}
                            // templateFileProperties={templateFileProperties}
                            // handleBlur={handleBlur}
                            // templateEntityReferenceProperties={templateEntityReferenceProperties}
                            // onNext={handleNext}
                        />
                    )}
                    {/* <ProcessDetails detailsFormikData={detailsFormikData} /> */}
                </Grid>
            </Grid>
        </Dialog>
    );
};

export default CreateProcess;

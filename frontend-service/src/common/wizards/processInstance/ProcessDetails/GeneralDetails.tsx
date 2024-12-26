import { Button, Card, CardContent, Divider, Grid, Typography } from '@mui/material';
import { FormikProvider } from 'formik';
import pickBy from 'lodash.pickby';
import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import Groups2Icon from '@mui/icons-material/Groups2';
import EditIcon from '@mui/icons-material/Edit';
import { IDetailsStepProp } from '.';
import { IMongoProcessTemplatePopulated, IProcessTemplateMap } from '../../../../interfaces/processes/processTemplate';
import { setInitialStepsObject } from '../../../../utils/processWizard/steps';
import { initDetailsValues } from './detailsFormik';
import { GeneralDetailsFields } from './GeneralDetailsFields';
import { TemplateFields } from './TemplateFields';

const GeneralDetails: React.FC<IDetailsStepProp> = ({ detailsFormikData, onNext, processInstance, toPrint }) => {
    const { values, touched, errors, setFieldValue, setFieldTouched, handleBlur, resetForm, submitForm, dirty } = detailsFormikData;
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;
    const [previousTemplate, setPreviousTemplate] = useState<IMongoProcessTemplatePopulated>();

    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<boolean>(Boolean(processInstance && !isEditMode));

    console.log({ isEditMode, viewMode });
    // const viewMode = Boolean(processInstance && !isEditMode);
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
            if (!processInstance) {
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
        }
    }, [values.template?._id]);

    return (
        <Card sx={{ border: 'none', boxShadow: 'none', height: '100%', background: 'transparent' }}>
            <CardContent sx={{ height: !toPrint ? '100%' : undefined }}>
                <Grid container direction="column" height="100%" justifyContent="space-between">
                    <FormikProvider value={detailsFormikData}>
                        <Grid item height="90%">
                            <Grid item height={isEditMode ? '40%' : '20%'}>
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
                            <Grid item>
                                <Divider variant="fullWidth" style={{ marginTop: '25px' }} />
                            </Grid>
                            <Grid item height={isEditMode ? '55%' : '80%'} style={{ overflowY: 'auto' }}>
                                {values.template && (
                                    <TemplateFields
                                        toPrint={toPrint}
                                        values={values}
                                        viewMode={viewMode}
                                        setEditMode={(val) => {
                                            setIsEditMode(val);
                                            setViewMode(Boolean(processInstance && !val));
                                        }}
                                        errors={errors}
                                        touched={touched}
                                        setFieldValue={setFieldValue}
                                        setFieldTouched={setFieldTouched}
                                        templateFileProperties={templateFileProperties}
                                        handleBlur={handleBlur}
                                        templateEntityReferenceProperties={templateEntityReferenceProperties}
                                        onNext={onNext}
                                    />
                                )}
                            </Grid>
                        </Grid>
                        <Grid item container height="5%">
                            <Grid item>
                                {
                                    // TODO - on click
                                    values.template && viewMode && !toPrint && (
                                        <Grid container gap="5px" width="100%" wrap="nowrap">
                                            <Grid item flexBasis="20%">
                                                <Button
                                                    onClick={() => {
                                                        console.log('click edittt');
                                                        setIsEditMode(true);
                                                        setViewMode(false);
                                                    }}
                                                    style={{
                                                        borderRadius: '7px',
                                                        border: 'solid 1px #1E2775',
                                                        width: '35px',
                                                        height: '35px',
                                                        backgroundColor: '#EBEFFA',
                                                    }}
                                                >
                                                    <Grid item alignSelf="center" width="35px" height="35px">
                                                        <EditIcon sx={{ height: '100%' }} />
                                                    </Grid>
                                                </Button>
                                            </Grid>
                                            <Grid item flexBasis="50%">
                                                <Button
                                                    style={{
                                                        borderRadius: '7px',
                                                        border: 'solid 1px #1E2775',
                                                        width: '140px',
                                                        height: '35px',
                                                        backgroundColor: '#EBEFFA',
                                                    }}
                                                >
                                                    <Grid container justifyContent="center" alignItems="center" gap="10px">
                                                        <Grid item alignSelf="center" style={{ height: '100%' }}>
                                                            <Groups2Icon sx={{ height: '100%', marginTop: '7px' }} />
                                                        </Grid>
                                                        <Grid item>
                                                            <Typography fontSize="14px" fontWeight="400">
                                                                {i18next.t('wizard.processInstance.showStepsReviewers')}
                                                            </Typography>
                                                        </Grid>
                                                    </Grid>
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    )
                                }
                                {values.template && !viewMode && !toPrint && (
                                    <Grid container spacing={1} marginBottom={1}>
                                        <Grid item>
                                            <Button
                                                variant="outlined"
                                                // startIcon={editStepIsLoading ? <CircularProgress sx={{ color: 'white' }} size={20} /> : <ClearIcon />}
                                                onClick={() => {
                                                    setIsEditMode(false);
                                                    setViewMode(true);
                                                    resetForm();
                                                }}
                                            >
                                                {i18next.t('wizard.processInstance.cancelBth')}
                                            </Button>
                                        </Grid>
                                        <Grid item>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                disabled={!dirty}
                                                onClick={() => submitForm()}
                                                // startIcon={editStepIsLoading ? <CircularProgress sx={{ color: 'white' }} size={20} /> : <DoneIcon />}
                                            >
                                                {i18next.t('wizard.processInstance.saveBth')}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>
                    </FormikProvider>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default GeneralDetails;

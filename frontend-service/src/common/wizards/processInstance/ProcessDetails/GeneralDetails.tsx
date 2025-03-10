import { Button, Card, CardContent, Divider, Grid, Typography } from '@mui/material';
import { FormikProvider } from 'formik';
import pickBy from 'lodash.pickby';
import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import Groups2Icon from '@mui/icons-material/Groups2';
import { IDetailsStepProp } from '.';
import { IMongoProcessTemplatePopulated, IProcessTemplateMap } from '../../../../interfaces/processes/processTemplate';
import { setInitialStepsObject } from '../../../../utils/processWizard/steps';
import { initDetailsValues } from './detailsFormik';
import { GeneralDetailsFields } from './GeneralDetailsFields';
import { TemplateFields } from './TemplateFields';
import { environment } from '../../../../globals';

const GeneralDetails: React.FC<IDetailsStepProp> = ({
    detailsFormikData,
    processInstance,
    toPrint,
    setContentDisplay = () => {},
    contentDisplay = environment.processDetailsContentDisplay.summary,
}) => {
    const { values, touched, errors, setFieldValue, setFieldTouched, handleBlur, resetForm } = detailsFormikData;
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;
    const [previousTemplate, setPreviousTemplate] = useState<IMongoProcessTemplatePopulated>();

    const variant = processInstance ? 'standard' : 'outlined';
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
        <Card sx={{ border: 'none', boxShadow: 'none', height: '100%', width: '100%', background: 'transparent' }}>
            <CardContent sx={{ height: !toPrint ? '100%' : undefined, width: '100%' }}>
                <Grid container direction="column" height="100%" justifyContent="space-between" width="100%">
                    <FormikProvider value={detailsFormikData}>
                        <Grid item height="90%" width="100%">
                            <Grid item height="20%" width="100%">
                                <GeneralDetailsFields
                                    processTemplatesMap={processTemplatesMap}
                                    setFieldValue={setFieldValue}
                                    values={values}
                                    isEditMode={false}
                                    processInstance={processInstance}
                                    viewMode={!!processInstance}
                                    variant={variant}
                                    touched={touched}
                                    errors={errors}
                                    handleBlur={handleBlur}
                                    setFieldTouched={setFieldTouched}
                                />
                            </Grid>
                            <Grid item>
                                <Divider variant="fullWidth" sx={{ marginTop: '25px' }} />
                            </Grid>
                            <Grid item height="80%" width="100%" sx={{ overflowY: 'auto' }}>
                                {values.template && (
                                    <TemplateFields
                                        toPrint={toPrint}
                                        values={values}
                                        viewMode={!!processInstance}
                                        errors={errors}
                                        touched={touched}
                                        setFieldValue={setFieldValue}
                                        setFieldTouched={setFieldTouched}
                                        templateFileProperties={templateFileProperties}
                                        handleBlur={handleBlur}
                                        templateEntityReferenceProperties={templateEntityReferenceProperties}
                                    />
                                )}
                            </Grid>
                        </Grid>
                        <Grid item container height="5%">
                            <Grid item>
                                {values.template && !!processInstance && !toPrint && (
                                    <Grid container gap="5px" width="100%" wrap="nowrap">
                                        <Grid item flexBasis="50%">
                                            <Button
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: '7px',
                                                    width: '150px',
                                                    height: '35px',
                                                }}
                                                onClick={() => {
                                                    if (contentDisplay === environment.processDetailsContentDisplay.summary)
                                                        setContentDisplay(environment.processDetailsContentDisplay.reviewers);
                                                    else {
                                                        setContentDisplay(environment.processDetailsContentDisplay.summary);
                                                    }
                                                }}
                                                startIcon={
                                                    contentDisplay === environment.processDetailsContentDisplay.summary && (
                                                        <Groups2Icon sx={{ height: '100%' }} />
                                                    )
                                                }
                                            >
                                                <Typography fontSize="13px" fontWeight="400">
                                                    {i18next.t(
                                                        contentDisplay === environment.processDetailsContentDisplay.summary
                                                            ? 'wizard.processInstance.showStepsReviewers'
                                                            : 'wizard.processInstance.nextToSummaryDetails',
                                                    )}
                                                </Typography>
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

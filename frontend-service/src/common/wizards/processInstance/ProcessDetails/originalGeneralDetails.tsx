import { Card, CardContent, Grid } from '@mui/material';
import { FormikProvider } from 'formik';
import pickBy from 'lodash.pickby';
import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import { IDetailsStepProp } from '.';
import { IMongoProcessTemplatePopulated, IProcessTemplateMap } from '../../../../interfaces/processes/processTemplate';
import { setInitialStepsObject } from '../../../../utils/processWizard/steps';
import { initDetailsValues } from './detailsFormik';
import { GeneralDetailsFields } from './GeneralDetailsFields';
import { TemplateFields } from './TemplateFields';

const OriGeneralDetails: React.FC<IDetailsStepProp> = ({ detailsFormikData, onNext, processInstance, isEditMode, toPrint }) => {
    const { values, touched, errors, setFieldValue, setFieldTouched, handleBlur, resetForm } = detailsFormikData;
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;
    const [previousTemplate, setPreviousTemplate] = useState<IMongoProcessTemplatePopulated>();
    const viewMode = Boolean(processInstance && !isEditMode);
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
        <Card sx={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
            <CardContent sx={{ height: !toPrint ? '56vh' : undefined, overflowY: 'auto' }}>
                <Grid container direction="column" paddingLeft={toPrint ? 0 : 4} justifyContent="space-around">
                    <Grid item>
                        <FormikProvider value={detailsFormikData}>
                            <Grid item container justifyContent="flex-start">
                                <Grid item flexBasis="50%">
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
                                <Grid item flexBasis="50%">
                                    {values.template && (
                                        <TemplateFields
                                            toPrint={toPrint}
                                            values={values}
                                            viewMode={viewMode}
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
                        </FormikProvider>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default OriGeneralDetails;

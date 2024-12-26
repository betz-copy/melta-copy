import { Button, Fab, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { Field } from 'formik';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import Groups2Icon from '@mui/icons-material/Groups2';
import EditIcon from '@mui/icons-material/Edit';
import { Dictionary } from 'lodash';
import React from 'react';
import { FileAttachments } from './FileAttachmentFields';
import { SchemaForm } from './SchemaForm';
import { BlueTitle } from '../../../BlueTitle';
import { pickProcessFieldsPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { EntityReference } from '../EntityReference';
import { IProcessSingleProperty } from '../../../../interfaces/processes/processTemplate';

export const TemplateFields = ({
    toPrint,
    values,
    viewMode,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    templateFileProperties,
    handleBlur,
    templateEntityReferenceProperties,
    onNext,
    setEditMode,
}) => {
    console.log({ templateFileProperties, values }); // TODO - fix this component....
    return (
        <Grid container flexDirection="column" width="100%" height="100%" justifyContent="space-between">
            <Grid
                item
                sx={{
                    overflowY: 'auto',
                }}
                // xs={toPrint ? 15 : 7}
            >
                {Object.keys(pickProcessFieldsPropertiesSchema(values.template?.details)?.properties).length !== 0 && (
                    <SchemaForm {...{ viewMode, values, errors, touched, setFieldValue, setFieldTouched, toPrint }} />
                )}
                {Object.keys(templateFileProperties!).length !== 0 && (
                    <FileAttachments
                        {...{
                            viewMode,
                            templateFileProperties,
                            values,
                            errors,
                            setFieldValue,
                            required: values.template.details.properties.required || [],
                            touched,
                            handleBlur,
                            setFieldTouched,
                            toPrint,
                        }}
                    />
                )}
                {Object.keys(templateEntityReferenceProperties!).length !== 0 && (
                    <Grid padding={1}>
                        <BlueTitle
                            title={i18next.t('wizard.processInstance.refEntities')}
                            component="h6"
                            variant="h6"
                            style={{ marginBottom: '22px' }}
                        />
                        {Object.entries((templateEntityReferenceProperties as Dictionary<IProcessSingleProperty>)!).map(([fieldName, { title }]) => (
                            <Field
                                key={fieldName}
                                validate={(changedValue) => {
                                    return (
                                        values.template?.details.properties.required.includes(fieldName) &&
                                        !changedValue?.entity &&
                                        i18next.t('validation.requiredEntity')
                                    );
                                }}
                                name={`entityReferences.${fieldName}`}
                                component={EntityReference}
                                errorText={
                                    errors.entityReferences?.[fieldName] && touched.entityReferences?.[fieldName]
                                        ? JSON.stringify(errors.entityReferences?.[fieldName])
                                        : undefined
                                }
                                field={fieldName || ''}
                                values={values}
                                errors={errors}
                                touched={touched}
                                setFieldValue={setFieldValue}
                                handleBlur={handleBlur}
                                isViewMode={viewMode}
                                title={title}
                            />
                        ))}
                    </Grid>
                )}
            </Grid>
            {!toPrint && (
                <Grid container item justifyContent="flex-end" alignSelf="flex-end" alignContent="flex-end">
                    <Grid item>
                        {/* {values.template && !viewMode && (
                            <Fab
                                size="small"
                                onClick={() => {
                                    onNext();
                                }}
                                variant="extended"
                                color="primary"
                            >
                                <NavigateBeforeIcon />
                                {i18next.t('wizard.processInstance.moveToStepsReviewers')}
                            </Fab>
                        )} */}
                        {/* {
                            // TODO - on click
                            values.template && viewMode && (
                                <Grid container gap="5px" width="100%" wrap="nowrap">
                                    <Grid item flexBasis="20%">
                                        <Button
                                            onClick={() => {
                                                console.log('click edittt');
                                                setEditMode(true);
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
                        } */}
                    </Grid>
                </Grid>
            )}
        </Grid>
    );
};

import React from 'react';
import { FormikProps } from 'formik';
import { Box, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { ProcessStepValues } from '../ProcessSteps';
import { ProcessDetailsValues } from '.';
import { IProcessSingleProperty } from '../../../../interfaces/processes/processTemplate';
import { InstanceSingleFileInput } from '../../../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { InstanceFileInput } from '../../../inputs/InstanceFilesInput/InstanceFileInput';
import OpenPreview from '../../../FilePreview/OpenPreview';
import { BlueTitle } from '../../../BlueTitle';

type ProcessFormikProps = ProcessStepValues | ProcessDetailsValues;

type FileAttachmentsProps = {
    templateFileProperties: Record<string, IProcessSingleProperty>;
    values: any;
    errors?: any;
    setFieldValue?: (field: string, value: any) => void;
    required?: string[];
    touched: FormikProps<ProcessDetailsValues>['touched'];
    setFieldTouched: FormikProps<ProcessFormikProps>['setFieldTouched'];
    toPrint?: boolean;
};

const FileAttachmentsEdit: React.FC<FileAttachmentsProps> = ({
    templateFileProperties,
    values,
    errors,
    touched,
    setFieldTouched,
    setFieldValue = () => {},
    required = [],
}) => {
    console.log({ templateFileProperties, values });

    return (
        <>
            {Object.entries(templateFileProperties).map(([key, value], index) => (
                <Grid item key={key} marginTop={index > 0 ? 5 : 0}>
                    {value.items === undefined ? (
                        <InstanceSingleFileInput
                            key={key}
                            fileFieldName={`detailsAttachments.${key}`}
                            fieldTemplateTitle={value.title}
                            setFieldValue={setFieldValue}
                            required={required.includes(key)} // file error
                            value={values.detailsAttachments[key]}
                            error={
                                errors.detailsAttachments?.[key] && touched.detailsAttachments?.[key]
                                    ? JSON.stringify(errors.detailsAttachments?.[key])
                                    : undefined
                            }
                            setFieldTouched={setFieldTouched}
                        />
                    ) : (
                        <InstanceFileInput
                            key={key}
                            fileFieldName={`detailsAttachments.${key}`}
                            fieldTemplateTitle={value.title}
                            setFieldValue={setFieldValue}
                            required={required.includes(key)}
                            value={values.detailsAttachments[key]}
                            error={
                                errors.detailsAttachments?.[key] && touched.detailsAttachments?.[key]
                                    ? JSON.stringify(errors.detailsAttachments?.[key])
                                    : undefined
                            }
                            setFieldTouched={setFieldTouched}
                        />
                    )}
                </Grid>
            ))}
        </>
    );
};

export const FileAttachmentsView: React.FC<FileAttachmentsProps> = ({ templateFileProperties, values, toPrint }) => {
    return (
        <>
            {Object.entries(templateFileProperties).map(([fieldName, { title }]) => {
                let attachments: React.JSX.Element | React.JSX.Element[] = (
                    <Typography display="inline" variant="h6">
                        -
                    </Typography>
                );
                if (values.detailsAttachments[fieldName]) {
                    if (Array.isArray(values.detailsAttachments[fieldName])) {
                        attachments = values.detailsAttachments[fieldName].map((v) => <OpenPreview key={v} fileId={v.name} download={toPrint} />);
                    } else {
                        attachments = <OpenPreview fileId={values.detailsAttachments[fieldName].name} download={toPrint} />;
                    }
                }
                return (
                    <Grid container spacing={1} display="flex" flexDirection="column" key={fieldName}>
                        <Grid item>
                            <Typography display="inline" variant="body1">
                                {title}:
                            </Typography>
                        </Grid>
                        <Grid item sx={{ overflowY: 'auto', maxHeight: '90px' }}>
                            {attachments}
                        </Grid>
                    </Grid>
                );
            })}
        </>
    );
};

// TODO - fix problem...
export const FileAttachments = ({ viewMode, templateFileProperties, values, errors, touched, setFieldValue, required, setFieldTouched, toPrint }) => {
    console.log({ viewMode });
    return (
        <Box>
            <BlueTitle title={i18next.t('wizard.entityTemplate.attachments')} component="h6" variant="h6" style={{ marginBottom: '22px' }} />
            {!viewMode ? (
                <FileAttachmentsEdit
                    templateFileProperties={templateFileProperties}
                    values={values}
                    errors={errors}
                    touched={touched}
                    setFieldValue={setFieldValue}
                    required={required}
                    setFieldTouched={setFieldTouched}
                />
            ) : (
                <FileAttachmentsView
                    templateFileProperties={templateFileProperties}
                    values={values}
                    touched={touched}
                    setFieldTouched={setFieldTouched}
                    toPrint={toPrint}
                />
            )}
        </Box>
    );
};

import { IProcessSingleProperty } from '@microservices/shared';
import { Box, Grid, Typography } from '@mui/material';
import { FormikErrors, FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import OpenPreview from '../../../FilePreview/OpenPreview';
import { InstanceFileInput } from '../../../inputs/InstanceFilesInput/InstanceFileInput';
import { InstanceSingleFileInput } from '../../../inputs/InstanceFilesInput/InstanceSingleFileInput';
import BlueTitle from '../../../MeltaDesigns/BlueTitle';
import { ProcessStepValues } from '../ProcessSteps';
import { ProcessDetailsValues } from '.';

type ProcessFormikProps = ProcessStepValues | ProcessDetailsValues;

type FileAttachmentsProps = {
    templateFileProperties: Record<string, IProcessSingleProperty>;
    values: ProcessDetailsValues;
    errors?: FormikErrors<ProcessDetailsValues>;
    setFieldValue?: (field: string, value: File | File[] | undefined) => void;
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
}) => (
    <>
        {Object.entries(templateFileProperties).map(([key, value], index) => (
            <Grid key={key} marginTop={index > 0 ? 5 : 0}>
                {value.items === undefined ? (
                    <InstanceSingleFileInput
                        key={key}
                        fileFieldName={`detailsAttachments.${key}`}
                        fieldTemplateTitle={value.title}
                        setFieldValue={setFieldValue}
                        required={required.includes(key)} // file error
                        value={values.detailsAttachments[key]}
                        error={errors?.detailsAttachments?.[key] && touched.detailsAttachments?.[key] ? errors.detailsAttachments?.[key] : undefined}
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
                        error={errors?.detailsAttachments?.[key] && touched.detailsAttachments?.[key] ? errors.detailsAttachments?.[key] : undefined}
                        setFieldTouched={setFieldTouched}
                    />
                )}
            </Grid>
        ))}
    </>
);

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
                        <Grid>
                            <Typography display="inline" variant="body1">
                                {title}:
                            </Typography>
                        </Grid>
                        <Grid maxWidth="170px">{attachments}</Grid>
                    </Grid>
                );
            })}
        </>
    );
};

export const FileAttachments = ({ viewMode, templateFileProperties, values, errors, touched, setFieldValue, required, setFieldTouched, toPrint }) => {
    return (
        <Box paddingTop={0.5} paddingLeft={1} paddingRight={3}>
            <BlueTitle
                title={i18next.t('wizard.entityTemplate.attachments')}
                component="h6"
                variant="h6"
                style={{ marginTop: toPrint ? '30px' : undefined, fontSize: '16px' }}
            />
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

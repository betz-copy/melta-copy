import React, { useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Autocomplete, Grid, CircularProgress } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import i18next from 'i18next';
import { variableNameValidation } from '../../../utils/validation';
import { BlueTitle } from '../../BlueTitle';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../../../interfaces/relationshipTemplates';

interface IConvertToRelationship {
    open: boolean;
    handleClose: () => void;
    isLoading?: boolean;
    onYes: (data: { fieldName: string; displayFieldName: string; relatedTemplateField: string }) => void;
    destEntity?: IMongoEntityTemplatePopulated;
    relationshipTemplate: IMongoRelationshipTemplate | null;
}

const ConvertToRelationship: React.FC<IConvertToRelationship> = ({ open, handleClose, onYes, destEntity, isLoading, relationshipTemplate }) => {
    let x;
    let y;

    const fixedRelatedTemplateFieldOptions = Object.entries(destEntity?.properties?.properties || {})
        .filter(([key, _property]) => destEntity?.properties.required.includes(key))
        .map(([key, property]) => ({
            key,
            title: (property as unknown as { title: string; key: string }).title,
        }));
    const formik = useFormik({
        initialValues: {
            fieldName: '',
            displayFieldName: '',
            relatedTemplateField: '',
        },
        validationSchema: Yup.object({
            fieldName: Yup.string().matches(variableNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
            // .test('unique-fieldName', i18next.t('validation.duplicateFieldName'), function (value) {
            //     return validateFieldUniqueness(properties, value, this.parent.displayFieldName); // Pass `properties` from context
            // }),
            // const fieldExists = Object.prototype.hasOwnProperty.call(properties, fieldName);
            // const displayFieldExists = Object.values(properties).some((value) => value.title === displayFieldName);
            displayFieldName: Yup.string().required(i18next.t('validation.required')),
            relatedTemplateField: Yup.string().required(i18next.t('validation.required')).nullable(),
        }),
        onSubmit: (values) => {
            onYes({ ...values });
            formik.resetForm();
            handleClose();
        },
    });

    const onClose = () => {
        formik.resetForm();
        handleClose();
    };

    useEffect(() => {
        if (relationshipTemplate) {
            formik.setFieldValue('fieldName', relationshipTemplate.name);
            formik.setFieldValue('displayFieldName', relationshipTemplate.displayName);
        }
    }, [relationshipTemplate]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                <BlueTitle
                    style={{ minWidth: 'fit-content', whiteSpace: 'nowrap', overflow: 'hidden', fontWeight: '500', fontSize: '20px' }}
                    title={i18next.t('actions.convertToRelationShipFieldClick')}
                    component="h5"
                    variant="h5"
                />
            </DialogTitle>

            <DialogContent sx={{ padding: '5px' }}>
                <form onSubmit={formik.handleSubmit}>
                    <Grid container gap={2} padding={1}>
                        <Grid container>
                            <Grid item paddingRight={1}>
                                <TextField
                                    id="fieldName"
                                    name="fieldName"
                                    label={i18next.t('wizard.entityTemplate.propertyName')}
                                    value={formik.values.fieldName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.fieldName && Boolean(formik.errors.fieldName)}
                                    helperText={formik.touched.fieldName && formik.errors.fieldName}
                                    size="small"
                                    sx={{
                                        '& .MuiFormHelperText-root': {
                                            fontSize: '0.75rem',
                                            lineHeight: '1rem',
                                        },
                                        width: 280,
                                    }}
                                />
                            </Grid>
                            <Grid item>
                                <TextField
                                    id="displayFieldName"
                                    name="displayFieldName"
                                    label={i18next.t('wizard.entityTemplate.propertyDisplayName')}
                                    value={formik.values.displayFieldName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.displayFieldName && Boolean(formik.errors.displayFieldName)}
                                    helperText={formik.touched.displayFieldName && formik.errors.displayFieldName}
                                    size="small"
                                    sx={{
                                        '& .MuiFormHelperText-root': {
                                            fontSize: '0.75rem',
                                            lineHeight: '1rem',
                                        },
                                        width: 280,
                                    }}
                                />
                            </Grid>
                        </Grid>
                        <Grid item container justifyContent="space-between" flexWrap="nowrap">
                            <TextField
                                label={i18next.t('entityTemplate')}
                                id="destination-entity"
                                name="destination-entity"
                                defaultValue={destEntity?.displayName}
                                sx={{ marginRight: '8px', borderRadius: '10px', width: 260 }}
                                fullWidth
                                InputProps={{ readOnly: true }}
                                disabled
                            />
                            <TextField
                                id="destination-entity"
                                label={i18next.t('validation.relatedDirection')}
                                defaultValue={i18next.t('validation.outgoing')}
                                sx={{ marginRight: '8px', borderRadius: '10px', width: 150 }}
                                InputProps={{ readOnly: true }}
                                disabled
                            />
                            <Autocomplete
                                id="relatedTemplateField"
                                options={fixedRelatedTemplateFieldOptions}
                                onChange={(_, selectedField) => {
                                    formik.setFieldValue('relatedTemplateField', selectedField?.key || '');
                                }}
                                onBlur={() => formik.setFieldTouched('relatedTemplateField', true)}
                                isOptionEqualToValue={(option, val) => option.key === val.toString()}
                                value={fixedRelatedTemplateFieldOptions.find((field) => field.key === formik.values.relatedTemplateField) ?? null}
                                getOptionLabel={(option) => option?.title || ''}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size="small"
                                        error={
                                            (formik.touched.relatedTemplateField && Boolean(formik.errors.relatedTemplateField)) ||
                                            fixedRelatedTemplateFieldOptions.length === 0
                                        }
                                        fullWidth
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                borderRadius: '10px',
                                                width: 240,
                                            },
                                        }}
                                        helperText={
                                            (formik.touched.relatedTemplateField && formik.errors.relatedTemplateField) ||
                                            (fixedRelatedTemplateFieldOptions.length === 0 &&
                                                i18next.t('wizard.entityTemplate.relatedTemplateHaveToHadRequiredFields'))
                                        }
                                        name="relatedTemplateField"
                                        variant="outlined"
                                        label={i18next.t('wizard.entityTemplate.propertyDisplayName')}
                                    />
                                )}
                                sx={{ marginRight: '5px', borderRadius: '10px' }}
                            />
                        </Grid>
                    </Grid>
                </form>
            </DialogContent>
            <DialogActions sx={{ paddingTop: 0 }}>
                <Button onClick={onClose}>{i18next.t('wizard.cancel')}</Button>
                <Button onClick={() => formik.handleSubmit()} disabled={isLoading}>
                    {i18next.t('wizard.finish')} {isLoading && <CircularProgress size={20} />}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { ConvertToRelationship };

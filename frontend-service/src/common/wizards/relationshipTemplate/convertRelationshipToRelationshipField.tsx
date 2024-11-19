// import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
// import i18next from 'i18next';
// import React, { MouseEventHandler } from 'react';

// const ConvertToRelationship: React.FC<{
//     open: boolean;
//     handleClose: () => void;
//     isLoading?: boolean;
//     onYes: MouseEventHandler;
// }> = ({ open, handleClose, isLoading = false, onYes }) => {
//     return (
//         <Dialog open={open} onClose={handleClose}>
//             <DialogTitle>title</DialogTitle>
//             <DialogContent>
//                 <Grid sx={{ flexDirection: 'column' }}>
//                     <TextField id="standard-basic" label="שם שדה" variant="standard" />
//                     <TextField id="standard-basic" label="שם שדה לתצוגה" variant="standard" />
//                 </Grid>
//             </DialogContent>
//             <DialogActions>
//                 <Button onClick={onYes} disabled={isLoading}>
//                     {i18next.t('areYouSureDialog.yes')}
//                     {isLoading && <CircularProgress size={20} />}
//                 </Button>
//             </DialogActions>
//         </Dialog>
//     );
// };

// export { ConvertToRelationship };

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    MenuItem,
    Typography,
    Autocomplete,
    AutocompleteRenderInputParams,
    Grid,
    Box,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import i18next from 'i18next';
import { IMongoRelationshipTemplate } from '../../../interfaces/relationshipTemplates';
import { getEntityById } from '../../../services/entitiesService';
import { searchEntityTemplates } from '../../../services/templates/enitityTemplatesService';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { variableNameValidation } from '../../../utils/validation';
import { ArrowHead, ArrowTail, TextComponent } from '../../RelationshipTitle';

interface Props {
    open: boolean;
    handleClose: () => void;
    targetEntityFields: string[]; // רשימת שדות חובה של הישות יעד
    isLoading?: boolean;
    // onSubmit: (data: { fieldName: string; displayName: string; requiredField: string }) => void;
    onYes: (data: { fieldName: string; displayFieldName: string; relatedTemplateField: string }) => void;
    relationshipTemplate: IMongoRelationshipTemplate | null;
    destEntity: any;
}

const ConvertToRelationship: React.FC<Props> = ({ open, handleClose, onYes, isLoading, targetEntityFields, relationshipTemplate, destEntity }) => {
    const [selectedTemplateField, setSelectedTemplateField] = useState<string | null>(null);
    const [touched, setTouched] = useState(false); // Track if the field has been touched

    console.log({ relationshipTemplate, destEntity });
    const fixedRelatedTemplateFieldOptions = Object.entries(destEntity?.properties?.properties || {})
        .filter(([key, _property]) => destEntity?.properties.required.includes(key))
        .map(([key, property]) => ({
            key,
            title: property.title,
        }));
    console.log({ fixedRelatedTemplateFieldOptions });

    const formik = useFormik({
        initialValues: {
            fieldName: '',
            displayFieldName: '',
            relatedTemplateField: '',
        },
        validationSchema: Yup.object({
            fieldName: Yup.string().matches(variableNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
            displayFieldName: Yup.string().required(i18next.t('validation.required')),
            relatedTemplateField: Yup.string().required(i18next.t('validation.required')).nullable(),
        }),
        onSubmit: (values) => {
            console.log({ values });
            onYes({ ...values });
            handleClose();
        },
    });

    const onClose = () => {
        formik.resetForm();
        handleClose();
    };
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>המרה לשדה קשר</DialogTitle>
            <DialogContent sx={{ marginTop: '10px' }}>
                <form onSubmit={formik.handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={5}>
                            <TextField
                                id="fieldName"
                                name="fieldName"
                                label="שם שדה באנגלית"
                                value={formik.values.fieldName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.fieldName && Boolean(formik.errors.fieldName)}
                                helperText={formik.touched.fieldName && formik.errors.fieldName}
                                size="small"
                                sx={{
                                    marginBottom: '8px',
                                    '& .MuiFormHelperText-root': {
                                        fontSize: '0.75rem',
                                        lineHeight: '1rem',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={5}>
                            <TextField
                                id="displayFieldName"
                                name="displayFieldName"
                                label="שם שדה לתצוגה"
                                value={formik.values.displayFieldName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.displayFieldName && Boolean(formik.errors.displayFieldName)}
                                helperText={formik.touched.displayFieldName && formik.errors.displayFieldName}
                                size="small"
                                sx={{
                                    marginBottom: '8px',
                                    '& .MuiFormHelperText-root': {
                                        fontSize: '0.75rem',
                                        lineHeight: '1rem',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item container justifyContent="space-between" flexWrap="nowrap">
                            <TextField
                                label={i18next.t('entityTemplate')}
                                id="destination-entity"
                                name="destination-entity"
                                defaultValue={destEntity?.displayName}
                                sx={{ marginRight: '5px', borderRadius: '10px', width: 260 }}
                                fullWidth
                                InputProps={{ readOnly: true }}
                            />
                            <TextField
                                id="destination-entity"
                                label={i18next.t('validation.relatedDirection')}
                                defaultValue={i18next.t('validation.outgoing')}
                                sx={{ marginRight: '5px', borderRadius: '10px', width: 150 }}
                                InputProps={{ readOnly: true }}
                            />
                            <Autocomplete
                                id="relatedTemplateField"
                                options={fixedRelatedTemplateFieldOptions}
                                onChange={(_, selectedField) => {
                                    formik.setFieldValue('relatedTemplateField', selectedField?.key || '');
                                }}
                                onBlur={() => formik.setFieldTouched('relatedTemplateField', true)}
                                isOptionEqualToValue={(option, val) => option.key === val}
                                value={fixedRelatedTemplateFieldOptions.find((field) => field.key === formik.values.relatedTemplateField) ?? null}
                                getOptionLabel={(option) => option?.title || ''}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size="small"
                                        error={formik.touched.relatedTemplateField && Boolean(formik.errors.relatedTemplateField)}
                                        helperText={formik.touched.relatedTemplateField && formik.errors.relatedTemplateField}
                                        fullWidth
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                borderRadius: '10px',
                                                width: 170,
                                            },
                                        }}
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
            <DialogActions>
                <Button onClick={onClose}>ביטול</Button>
                <Button onClick={formik.handleSubmit}>סיים</Button>
            </DialogActions>
        </Dialog>
    );
};

export { ConvertToRelationship };

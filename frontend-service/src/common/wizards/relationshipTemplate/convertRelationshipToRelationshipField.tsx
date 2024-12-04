import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, CircularProgress } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { variableNameValidation } from '../../../utils/validation';
import { BlueTitle } from '../../BlueTitle';
import { IEntitySingleProperty, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../../../interfaces/relationshipTemplates';
import { IRelationshipReference } from '../entityTemplate/commonInterfaces';
import RelationshipReferenceField from '../entityTemplate/RelationshipReferenceField';

interface IConvertToRelationship {
    open: boolean;
    handleClose: () => void;
    isLoading?: boolean;
    onYes: (data: { fieldName: string; displayFieldName: string; relationshipReference: IRelationshipReference }) => void;
    relationshipTemplate: IMongoRelationshipTemplate | null;
}

const ConvertToRelationship: React.FC<IConvertToRelationship> = ({ open, handleClose, onYes, isLoading, relationshipTemplate }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const destEntity: IMongoEntityTemplatePopulated = entityTemplates.get(relationshipTemplate?.destinationEntityId!)!;
    const srcEntity: IMongoEntityTemplatePopulated = entityTemplates.get(relationshipTemplate?.sourceEntityId!)!;
    const [relatedTemplateId, setRelatedTemplateId] = useState<string>('');
    const newSourceEntity = relatedTemplateId === destEntity?._id ? srcEntity : destEntity;
    const fieldNamesExisting = newSourceEntity?.propertiesOrder;
    const displayFieldNamesExisting = Object.values(newSourceEntity?.properties.properties || {}).map(
        (property: IEntitySingleProperty) => property?.title,
    );

    const formik = useFormik({
        initialValues: {
            fieldName: '',
            displayFieldName: '',
            relationshipReference: {
                relationshipTemplateDirection: 'outgoing' as 'outgoing' | 'incoming',
                relatedTemplateId: '',
                relatedTemplateField: '',
            },
        },
        validationSchema: Yup.object({
            fieldName: Yup.string()
                .matches(variableNameValidation, i18next.t('validation.variableName'))
                .required(i18next.t('validation.required'))
                .test('unique-name', i18next.t('validation.existingName'), (value) => {
                    return !fieldNamesExisting?.includes(value || '');
                }),
            displayFieldName: Yup.string()
                .required(i18next.t('validation.required'))
                .test('unique-name', i18next.t('validation.existingDisplayName'), (value) => {
                    return !displayFieldNamesExisting?.includes(value || '');
                }),
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
                            <RelationshipReferenceField
                                value={formik.values}
                                index={0}
                                touched={formik.touched}
                                errors={formik.errors}
                                setFieldValue={formik.setFieldValue}
                                isDisabled={false}
                                convertToRelationshipField={{
                                    options: [srcEntity, destEntity],
                                    originSourceEntityId: srcEntity?._id!,
                                    setRelatedTemplateId,
                                }}
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

import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import * as Yup from 'yup';
import { IEntitySingleProperty, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../../../interfaces/relationshipTemplates';
import { variableNameValidation } from '../../../utils/validation';
import BlueTitle from '../../MeltaDesigns/BlueTitle';
import { IRelationshipReference } from '../entityTemplate/commonInterfaces';
import RelationshipReferenceField from '../entityTemplate/RelationshipReference/RelationshipReferenceField';

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
    const textFieldStyle = {
        '& .MuiFormHelperText-root': {
            fontSize: '0.75rem',
            lineHeight: '1rem',
        },
        width: 280,
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <Formik
                initialValues={{
                    fieldName: '',
                    displayFieldName: '',
                    relationshipReference: {
                        relationshipTemplateDirection: 'outgoing' as 'outgoing' | 'incoming',
                        relatedTemplateId: '',
                        relatedTemplateField: '',
                    },
                }}
                validationSchema={Yup.object({
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
                    relationshipReference: Yup.object({
                        relatedTemplateId: Yup.string().required(i18next.t('validation.required')),
                        relatedTemplateField: Yup.string().required(i18next.t('validation.required')),
                        relationshipTemplateDirection: Yup.string().required(i18next.t('validation.required')),
                    }),
                })}
                onSubmit={(values) => {
                    onYes({ ...values });
                    handleClose();
                }}
            >
                {(formik) => {
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    useEffect(() => {
                        if (relationshipTemplate) {
                            formik.setFieldValue('fieldName', relationshipTemplate.name);
                            formik.setFieldValue('displayFieldName', relationshipTemplate.displayName);
                        }
                        // eslint-disable-next-line react-hooks/exhaustive-deps
                    }, [relationshipTemplate]);

                    return (
                        <Form>
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
                                            <Grid paddingRight={1}>
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
                                                    sx={textFieldStyle}
                                                />
                                            </Grid>
                                            <Grid>
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
                                                    sx={textFieldStyle}
                                                />
                                            </Grid>
                                        </Grid>
                                        <Grid container justifyContent="space-between" flexWrap="nowrap">
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
                                <Button onClick={handleClose}>{i18next.t('wizard.cancel')}</Button>
                                <Button type="submit" onClick={() => formik.handleSubmit()} disabled={isLoading || !formik.isValid}>
                                    {i18next.t('wizard.finish')} {isLoading && <CircularProgress size={20} />}
                                </Button>
                            </DialogActions>
                        </Form>
                    );
                }}
            </Formik>
        </Dialog>
    );
};

export { ConvertToRelationship };

import { Autocomplete, Grid, MenuItem, TextField, Typography } from '@mui/material';
import { IEntityTemplateMap, IMongoEntityTemplateWithConstraintsPopulated, IRelationshipReference } from '@packages/entity-template';
import { FormikErrors, FormikTouched } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { CommonFormInputProperties, ConvertToRelationshipFieldFormInputProperties } from '../commonInterfaces';

export interface FieldEditCardProps {
    value: CommonFormInputProperties | ConvertToRelationshipFieldFormInputProperties;
    index: number;
    touched?: FormikTouched<CommonFormInputProperties | ConvertToRelationshipFieldFormInputProperties>;
    errors?: FormikErrors<CommonFormInputProperties | ConvertToRelationshipFieldFormInputProperties>;
    setFieldValue: (field: keyof CommonFormInputProperties, value: any) => void;
    isDisabled?: boolean;
    convertToRelationshipField?: {
        options: IMongoEntityTemplateWithConstraintsPopulated[];
        originSourceEntityId: string;
        setRelatedTemplateId: (id: string) => void;
    };
}

const RelationshipReferenceField: React.FC<FieldEditCardProps> = ({
    value,
    index,
    touched,
    errors,
    setFieldValue,
    isDisabled,
    convertToRelationshipField,
}) => {
    const queryClient = useQueryClient();

    const relatedTemplateId = `properties[${index}].relationshipReference.relatedTemplateId`;
    const relatedTemplateField = `properties[${index}].relationshipReference.relatedTemplateField`;
    const relationshipTemplateDirection = `properties[${index}].relationshipReference.relationshipTemplateDirection`;
    const touchedRelationshipReference = touched?.relationshipReference;
    const errorRelationshipReference = errors?.relationshipReference as FormikErrors<IRelationshipReference> | undefined;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const selectedTemplate =
        (entityTemplates.get(value.relationshipReference?.relatedTemplateId || '') as IMongoEntityTemplateWithConstraintsPopulated) ?? null;

    const fixedRelatedTemplateFieldOptions = Object.entries(selectedTemplate?.properties?.properties || {})
        .filter(
            ([key, _property]) =>
                selectedTemplate?.properties.required.includes(key) && selectedTemplate?.properties?.properties[key].format !== 'signature',
        )
        .map(([key, property]) => ({
            key,
            title: property.title,
        }));

    const selectedTemplateField =
        selectedTemplate && value.relationshipReference?.relatedTemplateField
            ? {
                  key: value.relationshipReference.relatedTemplateField,
                  title: selectedTemplate.properties.properties[value.relationshipReference.relatedTemplateField].title,
              }
            : null;

    const activeEntityTemplatesFiltered = convertToRelationshipField?.options ?? Array.from(entityTemplates.values());

    return (
        <Grid container justifyContent="space-between" flexWrap="nowrap">
            {isDisabled && !entityTemplates.has(value.relationshipReference?.relatedTemplateId || '') ? (
                <Typography variant="body1" color="error">
                    {i18next.t('templateEntitiesAutocomplete.noWritePermissions')}
                </Typography>
            ) : (
                <>
                    <Autocomplete
                        id={relatedTemplateId}
                        options={activeEntityTemplatesFiltered}
                        onChange={(_e, relatedTemplateIdValue) => {
                            const isOriginSrcEntity = relatedTemplateIdValue?._id === convertToRelationshipField?.originSourceEntityId;
                            const newValue = {
                                relatedTemplateField: '',
                                relatedTemplateId: relatedTemplateIdValue?._id || '',
                                relationshipTemplateDirection: isOriginSrcEntity ? 'incoming' : 'outgoing',
                            };
                            convertToRelationshipField?.setRelatedTemplateId(relatedTemplateIdValue?._id || '');
                            setFieldValue('relationshipReference', newValue);
                        }}
                        sx={{ marginRight: '5px' }}
                        value={selectedTemplate}
                        disabled={isDisabled}
                        getOptionLabel={(option) => option?.displayName ?? ''}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                size="small"
                                error={touchedRelationshipReference && Boolean(errorRelationshipReference?.relatedTemplateId)}
                                fullWidth
                                sx={{
                                    '& .MuiInputBase-root': {
                                        borderRadius: '10px',
                                        width: convertToRelationshipField ? 220 : 300,
                                    },
                                }}
                                helperText={touchedRelationshipReference && errorRelationshipReference?.relatedTemplateId}
                                name="template"
                                variant="outlined"
                                label={i18next.t('entityTemplate')}
                            />
                        )}
                    />
                    {selectedTemplate &&
                        (convertToRelationshipField ? (
                            <TextField
                                id="relationshipTemplateDirection"
                                name="relationshipTemplateDirection"
                                label={i18next.t('validation.relatedDirection')}
                                value={i18next.t(`validation.${value.relationshipReference?.relationshipTemplateDirection}`)}
                                sx={{ marginRight: '8px', borderRadius: '10px', width: 100 }}
                                slotProps={{ input: { readOnly: true } }}
                                disabled
                            />
                        ) : (
                            <TextField
                                select
                                label={i18next.t('validation.relatedDirection')}
                                id={relationshipTemplateDirection}
                                name={relationshipTemplateDirection}
                                value={value.relationshipReference?.relationshipTemplateDirection}
                                onChange={(e) => {
                                    const newValue = { ...value.relationshipReference, relationshipTemplateDirection: e.target.value };
                                    setFieldValue('relationshipReference', newValue);
                                }}
                                error={touchedRelationshipReference && Boolean(errorRelationshipReference?.relationshipTemplateDirection)}
                                helperText={errorRelationshipReference?.relationshipTemplateDirection}
                                sx={{ marginRight: '5px' }}
                                disabled={isDisabled}
                                fullWidth
                            >
                                {['outgoing', 'incoming'].map((relatedFrom) => (
                                    <MenuItem key={relatedFrom} value={relatedFrom}>
                                        {i18next.t(`validation.${relatedFrom}`)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        ))}
                    {selectedTemplate && (
                        <Autocomplete
                            id={relatedTemplateField}
                            options={fixedRelatedTemplateFieldOptions}
                            onChange={(_e, selectedField) => {
                                const newValue = { ...value.relationshipReference, relatedTemplateField: selectedField?.key };
                                setFieldValue('relationshipReference', newValue);
                            }}
                            isOptionEqualToValue={(option, val) => option.key === val.key}
                            sx={{ marginRight: '5px' }}
                            value={selectedTemplateField}
                            disabled={isDisabled}
                            getOptionLabel={(option) => option.title}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    size="small"
                                    error={
                                        (touchedRelationshipReference && Boolean(errorRelationshipReference?.relatedTemplateField)) ||
                                        fixedRelatedTemplateFieldOptions.length === 0
                                    }
                                    fullWidth
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            borderRadius: '10px',
                                            width: convertToRelationshipField ? 240 : 300,
                                        },
                                    }}
                                    helperText={
                                        (touchedRelationshipReference && errorRelationshipReference?.relatedTemplateField) ||
                                        (fixedRelatedTemplateFieldOptions.length === 0 &&
                                            i18next.t('wizard.entityTemplate.relatedTemplateHaveToHadRequiredFields'))
                                    }
                                    name="template"
                                    variant="outlined"
                                    label={i18next.t('wizard.entityTemplate.propertyDisplayName')}
                                />
                            )}
                        />
                    )}
                </>
            )}
        </Grid>
    );
};

export default RelationshipReferenceField;

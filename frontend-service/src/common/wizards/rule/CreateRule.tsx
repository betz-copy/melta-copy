import React from 'react';
import { TextField, Grid, RadioGroup, Radio, FormControl, FormControlLabel, FormLabel, FormHelperText } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { StepComponentProps } from '../index';
import { RelationshipTemplateRuleWizardValues } from '.';
import { IMongoRelationshipTemplate } from '../../../interfaces/relationshipTemplates';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { getOppositeEntityTemplate, populateRelationshipTemplate } from '../../../utils/templates';
import RelationshipTemplateAutocomplete from '../../inputs/RelationshipTemplateAutocomplete';

const createRuleSchema = {
    name: Yup.string().required(i18next.t('validation.required')),
    description: Yup.string().required(i18next.t('validation.required')),
    actionOnFail: Yup.string().oneOf(['WARNING', 'ENFORCEMENT']).required(i18next.t('validation.required')),
    relationshipTemplateId: Yup.string().required(i18next.t('validation.required')),
    pinnedEntityTemplateId: Yup.string().required(i18next.t('validation.required')),
};

const CreateRule: React.FC<StepComponentProps<RelationshipTemplateRuleWizardValues, 'isEditMode'>> = ({
    values,
    touched,
    errors,
    handleChange,
    setFieldValue,
    isEditMode,
}) => {
    const queryClient = useQueryClient();
    const relationshipTemplates = queryClient.getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;

    const { pinnedEntityTemplateId, relationshipTemplateId } = values;

    const selectedRelationshipTemplate = relationshipTemplates.find(({ _id }) => relationshipTemplateId === _id);
    const selectedRelationshipTemplatePopulated = selectedRelationshipTemplate
        ? populateRelationshipTemplate(selectedRelationshipTemplate, entityTemplates)
        : null;

    return (
        <Grid container direction="column" alignItems="center" spacing={1}>
            <Grid item>
                <TextField
                    name="name"
                    label={i18next.t('wizard.rule.name')}
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                />
            </Grid>
            <Grid item>
                <TextField
                    name="description"
                    label={i18next.t('wizard.rule.description')}
                    value={values.description}
                    onChange={handleChange}
                    error={touched.description && Boolean(errors.description)}
                    helperText={touched.description && errors.description}
                    multiline
                />
            </Grid>
            <Grid item>
                <FormControl>
                    <FormLabel error={touched.actionOnFail && Boolean(errors.actionOnFail)}>{i18next.t('wizard.rule.actionOnFail')}</FormLabel>
                    <RadioGroup row name="actionOnFail" onChange={handleChange} value={values.actionOnFail}>
                        <FormControlLabel value="WARNING" control={<Radio />} label={i18next.t('wizard.rule.actions.warning')} />
                        <FormControlLabel value="ENFORCEMENT" control={<Radio />} label={i18next.t('wizard.rule.actions.enforcement')} />
                    </RadioGroup>
                    <FormHelperText>{touched.actionOnFail && errors.actionOnFail}</FormHelperText>
                </FormControl>
            </Grid>
            <Grid item width="250px">
                <RelationshipTemplateAutocomplete
                    value={selectedRelationshipTemplatePopulated}
                    onChange={(_e, chosenRelationshipTemplate) => setFieldValue('relationshipTemplateId', chosenRelationshipTemplate?._id ?? '')}
                    isError={Boolean(touched.relationshipTemplateId && errors.relationshipTemplateId)}
                    helperText={touched.relationshipTemplateId ? errors.relationshipTemplateId : ''}
                    disabled={isEditMode}
                />
            </Grid>
            <Grid item>
                <FormControl
                    error={touched.pinnedEntityTemplateId && Boolean(errors.pinnedEntityTemplateId)}
                    disabled={!relationshipTemplateId || isEditMode}
                >
                    <FormLabel>{i18next.t('wizard.rule.pinnedEntityTemplate')}</FormLabel>
                    <RadioGroup
                        row
                        name="pinnedEntityTemplateId"
                        onChange={(_e, value) => {
                            setFieldValue('pinnedEntityTemplateId', value);
                            const unpinnedEntityTemplate = getOppositeEntityTemplate(value, selectedRelationshipTemplatePopulated!);
                            setFieldValue('unpinnedEntityTemplateId', unpinnedEntityTemplate._id, false);
                        }}
                        value={pinnedEntityTemplateId}
                    >
                        <FormControlLabel
                            value={selectedRelationshipTemplatePopulated?.sourceEntity._id}
                            control={<Radio />}
                            label={selectedRelationshipTemplatePopulated?.sourceEntity.displayName}
                        />
                        <FormControlLabel
                            value={selectedRelationshipTemplatePopulated?.destinationEntity._id}
                            control={<Radio />}
                            label={selectedRelationshipTemplatePopulated?.destinationEntity.displayName}
                        />
                    </RadioGroup>
                    <FormHelperText>{touched.pinnedEntityTemplateId && errors.pinnedEntityTemplateId}</FormHelperText>
                </FormControl>
            </Grid>
        </Grid>
    );
};

export { CreateRule, createRuleSchema };

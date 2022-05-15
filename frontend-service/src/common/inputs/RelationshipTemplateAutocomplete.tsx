import React from 'react';
import { Autocomplete, AutocompleteChangeDetails, AutocompleteProps, TextField } from '@mui/material';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { IMongoRelationshipTemplate, IMongoRelationshipTemplatePopulated } from '../../interfaces/relationshipTemplates';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

type PartialByKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type IMongoRelationshipTemplatePopulatedOption = PartialByKeys<IMongoRelationshipTemplatePopulated, 'sourceEntity' | 'destinationEntity'>;

const populateRelationshipTemplateOption = (
    relationshipTemplate: IMongoRelationshipTemplate,
    entityTemplates: IMongoEntityTemplatePopulated[],
): IMongoRelationshipTemplatePopulatedOption => {
    const { sourceEntityId, destinationEntityId, ...restOfRelationshipTemplate } = relationshipTemplate;

    const sourceEntity = entityTemplates.find(({ _id }) => _id === sourceEntityId);
    const destinationEntity = entityTemplates.find(({ _id }) => _id === destinationEntityId);

    return {
        sourceEntity,
        destinationEntity,
        ...restOfRelationshipTemplate,
    };
};

const getConstrainedOptions = (
    relationshipTemplatesPopulatedOptions: IMongoRelationshipTemplatePopulatedOption[],
    entityTemplatesIdsConstraints: string[],
) => {
    return relationshipTemplatesPopulatedOptions.filter(({ sourceEntity, destinationEntity }) => {
        if (entityTemplatesIdsConstraints.length === 2) {
            const [entityTemplateId1, entityTemplateId2] = entityTemplatesIdsConstraints;
            return (
                (entityTemplateId1 === sourceEntity?._id && entityTemplateId2 === destinationEntity?._id) ||
                (entityTemplateId1 === destinationEntity?._id && entityTemplateId2 === sourceEntity?._id)
            );
        }

        return entityTemplatesIdsConstraints.every((entityTemplatesId) => [sourceEntity?._id, destinationEntity?._id].includes(entityTemplatesId));
    });
};

const RelationshipTemplateAutocomplete: React.FC<{
    value: IMongoRelationshipTemplatePopulated | null;
    onChange: NonNullable<AutocompleteProps<IMongoRelationshipTemplatePopulated, undefined, undefined, undefined>['onChange']>;
    entityTemplatesIdsConstraints?: string[];
    onBlur?: AutocompleteProps<IMongoRelationshipTemplatePopulated, undefined, undefined, undefined>['onBlur'];
    disabled: boolean;
    isError: boolean;
    helperText?: string;
}> = ({ value, onChange, entityTemplatesIdsConstraints = [], onBlur, disabled, isError, helperText }) => {
    const queryClient = useQueryClient();
    const relationshipTemplates = queryClient.getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;

    const relationshipTemplatesPopulatedOptions = relationshipTemplates.map((relationshipTemplate) =>
        populateRelationshipTemplateOption(relationshipTemplate, entityTemplates),
    );

    const relationshipTemplatesPopulatedConstrainedOptions = getConstrainedOptions(
        relationshipTemplatesPopulatedOptions,
        entityTemplatesIdsConstraints,
    );

    return (
        <Autocomplete<IMongoRelationshipTemplatePopulatedOption, undefined, undefined, undefined>
            value={value}
            onChange={(event, newValue, reason, details) =>
                onChange(
                    event,
                    newValue as IMongoRelationshipTemplatePopulated,
                    reason,
                    details as AutocompleteChangeDetails<IMongoRelationshipTemplatePopulated>,
                )
            }
            disabled={disabled}
            onBlur={onBlur}
            getOptionLabel={(option) => {
                const sourceEntityDisplayName = option.sourceEntity
                    ? option.sourceEntity.displayName
                    : i18next.t('relationshipTemplateAutocomplete.unknownEntity');
                const destinationEntityDisplayName = option.destinationEntity
                    ? option.destinationEntity.displayName
                    : i18next.t('relationshipTemplateAutocomplete.unknownEntity');

                return `${option.displayName} (${sourceEntityDisplayName} -> ${destinationEntityDisplayName})`;
            }}
            getOptionDisabled={(option) => !option.sourceEntity || !option.destinationEntity}
            isOptionEqualToValue={(option, currValue) => option._id === currValue._id}
            options={relationshipTemplatesPopulatedConstrainedOptions}
            noOptionsText={i18next.t('relationshipTemplateAutocomplete.noOptions')}
            renderInput={(params) => (
                <TextField
                    {...params}
                    error={isError}
                    fullWidth
                    helperText={helperText}
                    name="user"
                    variant="outlined"
                    label={i18next.t('relationshipTemplateAutocomplete.label')}
                />
            )}
        />
    );
};

export default RelationshipTemplateAutocomplete;

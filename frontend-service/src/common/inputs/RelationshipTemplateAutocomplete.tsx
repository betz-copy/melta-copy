import { Autocomplete, AutocompleteChangeDetails, AutocompleteProps, TextField } from '@mui/material';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '@packages/relationship-template';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { IEntityTemplateMap } from '../../interfaces/template';
import { useUserStore } from '../../stores/user';
import { getAllAllowedEntities, getAllAllowedRelationships } from '../../utils/permissions/templatePermissions';
import { populateRelationshipTemplate } from '../../utils/templates';

type PartialByKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type IMongoRelationshipTemplatePopulatedOption = PartialByKeys<IMongoRelationshipTemplatePopulated, 'sourceEntity' | 'destinationEntity'>;

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
    const currentUser = useUserStore((state) => state.user);

    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const allowedEntityTemplates: IMongoEntityTemplateWithConstraintsPopulated[] = getAllAllowedEntities(
        Array.from(entityTemplates.values()),
        currentUser,
    );
    const allowedEntityTemplatesIds: string[] = allowedEntityTemplates.map((entity) => entity._id);
    const allowedRelationships = getAllAllowedRelationships(Array.from(relationshipTemplates.values()), allowedEntityTemplatesIds);

    const relationshipTemplatesPopulatedOptions = Array.from(allowedRelationships.values()).map((relationshipTemplate) =>
        populateRelationshipTemplate(relationshipTemplate, entityTemplates),
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

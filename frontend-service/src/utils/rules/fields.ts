import { Fields, SimpleField } from 'react-awesome-query-builder';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../../interfaces/relationshipTemplates';
import { getOppositeEntityTemplate, isRelationshipConnectedToEntityTemplate, populateRelationshipTemplate } from '../templates';

const entityTemplateToSubfields = (
    entityTemplate: IMongoEntityTemplatePopulated,
    options: { hideForCompare?: boolean },
    initials?: { key: string; label: string },
) => {
    return Object.fromEntries(
        Object.entries(entityTemplate.properties.properties).map(([key, value]) => {
            let type = 'text';

            if (value.type !== 'string') {
                type = value.type;
            } else if (value.format === 'date') {
                type = 'date';
            } else if (value.format === 'date-time') {
                type = 'datetime';
            }

            return [
                initials ? `${initials.key}-${entityTemplate._id}-${key}` : `${entityTemplate._id}-${key}`,
                {
                    type,
                    valueSources: ['field', 'value'],
                    label: initials ? `${initials.label}.${entityTemplate.name}.${key}` : `${entityTemplate.name}.${key}`,
                    ...options,
                } as SimpleField,
            ];
        }),
    );
};

const entityTemplatesToFieldsConfig = (
    pinnedEntityTemplateId: string,
    selectedRelationshipTemplate: IMongoRelationshipTemplate,
    entityTemplates: IMongoEntityTemplatePopulated[],
    relationshipTemplates: IMongoRelationshipTemplate[],
): Fields => {
    const selectedRelationshipTemplatePopulated = populateRelationshipTemplate(selectedRelationshipTemplate, entityTemplates);
    const { sourceEntity, destinationEntity } = selectedRelationshipTemplatePopulated;

    const [pinnedEntityTemplate, nonPinnedEntityTemplate] =
        sourceEntity._id === pinnedEntityTemplateId ? [sourceEntity, destinationEntity] : [destinationEntity, sourceEntity];

    const connectedTemplatesWithRelationship = relationshipTemplates
        .map((relationshipTemplate) => populateRelationshipTemplate(relationshipTemplate, entityTemplates))
        .filter((relationshipTemplate) => isRelationshipConnectedToEntityTemplate(pinnedEntityTemplate, relationshipTemplate))!
        .map((relationshipTemplatePopulated) => {
            const template = getOppositeEntityTemplate(pinnedEntityTemplate, relationshipTemplatePopulated);

            return {
                relationshipTemplate: relationshipTemplatePopulated,
                ...template,
            };
        });

    const relationshipFields = Object.fromEntries(
        connectedTemplatesWithRelationship.map((template) => {
            return [
                `${pinnedEntityTemplate._id}-${template.relationshipTemplate._id}-${template._id}`,
                {
                    type: '!group',
                    label: `${pinnedEntityTemplate.name}.${template.relationshipTemplate.name}.${template.name}`,
                    mode: 'array',
                    hideForCompare: true,
                    defaultOperator: 'equal',
                    initialEmptyWhere: true,
                    subfields: {
                        ...entityTemplateToSubfields(
                            template,
                            {},
                            {
                                key: `${pinnedEntityTemplate._id}-${template.relationshipTemplate._id}`,
                                label: `${pinnedEntityTemplate.name}.${template.relationshipTemplate.name}`,
                            },
                        ),
                        ...entityTemplateToSubfields(pinnedEntityTemplate, {}),
                        ...entityTemplateToSubfields(nonPinnedEntityTemplate, {}),
                    },
                },
            ];
        }),
    );

    return {
        ...entityTemplateToSubfields(pinnedEntityTemplate, {}),
        ...entityTemplateToSubfields(nonPinnedEntityTemplate, {}),
        ...relationshipFields,
    };
};

export { entityTemplatesToFieldsConfig };

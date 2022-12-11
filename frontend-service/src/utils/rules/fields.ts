import { Fields, SimpleField } from 'react-awesome-query-builder';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../../interfaces/relationshipTemplates';
import { getOppositeEntityTemplate, isRelationshipConnectedToEntityTemplate, populateRelationshipTemplate } from '../templates';

const defaultFields = [
    {
        name: '_id',
        type: 'text',
    },
    {
        name: 'disabled',
        type: 'boolean',
    },
    {
        name: 'createdAt',
        type: 'datetime',
    },
    {
        name: 'updatedAt',
        type: 'datetime',
    },
];
const entityTemplateToSubfields = (
    entityTemplate: IMongoEntityTemplatePopulated,
    options: { hideForCompare?: boolean },
    initials?: { key: string; label: string },
) => {
    const fieldEntries: [string, SimpleField][] = [];
    defaultFields.forEach((field) => {
        fieldEntries.push([
            initials ? `${initials.key}-${entityTemplate._id}-${field.name}` : `${entityTemplate._id}-${field.name}`,
            {
                type: field.type,
                valueSources: ['field', 'value'],
                label: initials ? `${initials.label}.${entityTemplate.name}.${field.name}` : `${entityTemplate.name}.${field.name}`,
                ...options,
            },
        ]);
    });
    Object.entries(entityTemplate.properties.properties).forEach(([key, value]) => {
        let type = 'text';

        if (value.type !== 'string') {
            type = value.type;
        } else if (value.format === 'date') {
            type = 'date';
        } else if (value.format === 'date-time') {
            type = 'datetime';
        }

        fieldEntries.push([
            initials ? `${initials.key}-${entityTemplate._id}-${key}` : `${entityTemplate._id}-${key}`,
            {
                type,
                valueSources: ['field', 'value'],
                label: initials ? `${initials.label}.${entityTemplate.name}.${key}` : `${entityTemplate.name}.${key}`,
                ...options,
            },
        ]);

        if (type === 'datetime') {
            fieldEntries.push([
                initials ? `${initials.key}-${entityTemplate._id}-${key}-ignoreHour` : `${entityTemplate._id}-${key}-ignoreHour`,
                {
                    type: 'date',
                    valueSources: ['field', 'value'],
                    label: initials ? `${initials.label}.${entityTemplate.name}.${key} (ignore hour)` : `${entityTemplate.name}.${key} (ignore hour)`,
                    ...options,
                },
            ]);
        }
    });

    return Object.fromEntries(fieldEntries);
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
            const template = getOppositeEntityTemplate(pinnedEntityTemplateId, relationshipTemplatePopulated);

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

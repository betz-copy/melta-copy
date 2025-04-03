import lodashIsEqual from 'lodash.isequal';
import { Fields, ImmutableTree, SimpleField } from '@react-awesome-query-builder/mui';
import lodashFindLast from 'lodash.findlast';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import {
    addDefaultFieldsToTemplate,
    getOppositeEntityTemplate,
    isRelationshipConnectedToEntityTemplate,
    populateRelationshipTemplate,
} from '../templates';
import { IVariable } from '../../interfaces/rules/formula/argument';
import { getAggVariablesInTree } from './getAggVariablesInTree';

const entityTemplateToFieldsConfig = (
    entityTemplate: IMongoEntityTemplatePopulated,
    options: { hideForCompare?: boolean },
    initials?: { key: string; label: string },
    variableNameSuffix: string = '',
) => {
    const keyPrefix = initials ? `${initials.key}-` : '';
    const keySuffix = variableNameSuffix ? `-${variableNameSuffix}` : '';

    const labelPrefix = initials ? `${initials.label}.` : '';

    const fieldEntries: [string, SimpleField][] = [];
    Object.entries(addDefaultFieldsToTemplate(entityTemplate).properties.properties).forEach(([key, value]) => {
        let type = 'text';

        if (value.type !== 'string') {
            type = value.type;
        } else if (value.format === 'date') {
            type = 'date';
        } else if (value.format === 'date-time') {
            type = 'datetime';
        } else if (value.format === 'user') {
            type = 'user';
            fieldEntries.push([
                `${keyPrefix}${entityTemplate._id}${keySuffix}-${key}`,
                {
                    type,
                    valueSources: [],
                    label: `${labelPrefix}${entityTemplate.name}${variableNameSuffix}.${key}`,
                    ...options,
                },
            ]);
        }

        if (value.format !== 'user' && value.format !== 'signature') {
            fieldEntries.push([
                `${keyPrefix}${entityTemplate._id}${keySuffix}-${key}`,
                {
                    type,
                    valueSources: ['field', 'value', 'func'],
                    label: `${labelPrefix}${entityTemplate.name}${variableNameSuffix}.${key}`,
                    ...options,
                },
            ]);

            if (type === 'datetime') {
                fieldEntries.push([
                    `${keyPrefix}${entityTemplate._id}${keySuffix}-${key}-ignoreHour`,
                    {
                        type: 'date',
                        valueSources: ['field', 'value', 'func'],
                        label: `${labelPrefix}${entityTemplate.name}${variableNameSuffix}.${key} (ignore hour)`,
                        ...options,
                    },
                ]);
            }
        }
    });

    return Object.fromEntries(fieldEntries);
};

const getRelationshipFieldsConfigOfRule = (
    entityTemplate: IMongoEntityTemplatePopulated,
    connectedTemplatesWithRelationship: {
        relationshipTemplate: IMongoRelationshipTemplatePopulated;
        otherEntityTemplate: IMongoEntityTemplatePopulated;
    }[],
    aggregationsContext: { existingAggregationVariables: Required<IVariable>[]; existingFieldsInUpperScopes: Record<string, SimpleField> },
    existingAggregationVariablesInTree: Required<IVariable>[],
) => {
    return Object.fromEntries(
        connectedTemplatesWithRelationship.map(({ relationshipTemplate, otherEntityTemplate }) => {
            const lastAggregationOfTheSameRelationship = lodashFindLast(
                aggregationsContext.existingAggregationVariables,
                ({ aggregatedRelationship }) => aggregatedRelationship.relationshipTemplateId === relationshipTemplate._id,
            );

            let variableNameSuffix: string | undefined;
            if (!lastAggregationOfTheSameRelationship) {
                variableNameSuffix = undefined;
            } else {
                variableNameSuffix = String(Number(lastAggregationOfTheSameRelationship.aggregatedRelationship.variableNameSuffix ?? '1') + 1);
            }

            const fieldsOfAggregationVariable = entityTemplateToFieldsConfig(
                otherEntityTemplate,
                {},
                {
                    key: `${entityTemplate._id}-${relationshipTemplate._id}`,
                    label: `${entityTemplate.name}.${relationshipTemplate.name}`,
                },
                variableNameSuffix,
            );

            const isRelationshipFieldUsedInTree = existingAggregationVariablesInTree.some((variable) => {
                return lodashIsEqual(variable, {
                    entityTemplateId: entityTemplate._id,
                    aggregatedRelationship: {
                        relationshipTemplateId: relationshipTemplate._id,
                        otherEntityTemplateId: otherEntityTemplate._id,
                        variableNameSuffix,
                    },
                } satisfies Required<IVariable>);
            });
            const innerRelationshipFields = !isRelationshipFieldUsedInTree
                ? {}
                : getRelationshipFieldsConfigOfRule(
                      entityTemplate,
                      connectedTemplatesWithRelationship,
                      {
                          existingAggregationVariables: [
                              ...aggregationsContext.existingAggregationVariables,
                              {
                                  entityTemplateId: entityTemplate._id,
                                  aggregatedRelationship: {
                                      relationshipTemplateId: relationshipTemplate._id,
                                      otherEntityTemplateId: otherEntityTemplate._id,
                                      variableNameSuffix,
                                  },
                              },
                          ],
                          existingFieldsInUpperScopes: {
                              ...aggregationsContext.existingFieldsInUpperScopes,
                              ...fieldsOfAggregationVariable,
                          },
                      },
                      existingAggregationVariablesInTree,
                  );

            const keySuffix = variableNameSuffix ? `-${variableNameSuffix}` : '';

            return [
                `${entityTemplate._id}-${relationshipTemplate._id}-${otherEntityTemplate._id}${keySuffix}`,
                {
                    type: '!group',
                    label: `${entityTemplate.name}.${relationshipTemplate.name}.${otherEntityTemplate.name}${variableNameSuffix ?? ''}`,
                    mode: 'array',
                    hideForCompare: true,
                    defaultOperator: 'equal',
                    initialEmptyWhere: true,
                    subfields: {
                        ...aggregationsContext.existingFieldsInUpperScopes,
                        ...fieldsOfAggregationVariable,
                        ...innerRelationshipFields,
                    },
                },
            ];
        }),
    );
};

export const getFieldsConfigOfRule = (
    entityTemplateId: string,
    entityTemplates: IEntityTemplateMap,
    relationshipTemplates: IRelationshipTemplateMap,
    formula: ImmutableTree,
): Fields => {
    const entityTemplate = entityTemplates.get(entityTemplateId)!;

    const fieldsOfEntityTemplate = entityTemplateToFieldsConfig(entityTemplate, {});

    const connectedTemplatesWithRelationship = Array.from(relationshipTemplates.values())
        .map((relationshipTemplate) => populateRelationshipTemplate(relationshipTemplate, entityTemplates))
        .filter(
            (relationshipTemplate) =>
                isRelationshipConnectedToEntityTemplate(entityTemplate, relationshipTemplate) && !relationshipTemplate.isProperty,
        )
        .map((relationshipTemplatePopulated) => {
            const template = getOppositeEntityTemplate(entityTemplateId, relationshipTemplatePopulated);

            return {
                relationshipTemplate: relationshipTemplatePopulated,
                otherEntityTemplate: template,
            };
        });

    const existingAggregationVariablesInTree = getAggVariablesInTree(formula);

    const relationshipFields = getRelationshipFieldsConfigOfRule(
        entityTemplate,
        connectedTemplatesWithRelationship,
        { existingAggregationVariables: [], existingFieldsInUpperScopes: fieldsOfEntityTemplate },
        existingAggregationVariablesInTree,
    );
    return {
        ...fieldsOfEntityTemplate,
        ...relationshipFields,
    };
};

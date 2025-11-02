import { Field, Fields, ImmutableTree } from '@react-awesome-query-builder/mui';
import i18next from 'i18next';
import lodashFindLast from 'lodash.findlast';
import lodashIsEqual from 'lodash.isequal';
import { environment } from '../../globals';
import { IEntitySingleProperty, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import { ActionOnFail } from '../../interfaces/rules';
import { IVariable } from '../../interfaces/rules/formula/argument';
import { ICurrentUser } from '../../interfaces/users';
import { getAllAllowedEntities, getAllAllowedRelationships } from '../permissions/templatePermissions';
import {
    addDefaultFieldsToTemplate,
    getOppositeEntityTemplate,
    isRelationshipConnectedToEntityTemplate,
    populateRelationshipTemplate,
} from '../templates';
import { getAggVariablesInTree } from './getAggVariablesInTree';

const { formulaGetTodayVarName } = environment;

const formatField = (
    key: string,
    value: IEntitySingleProperty,
    entityTemplate: IMongoEntityTemplatePopulated,
    fieldEntries: [string, Field][],
    options: { hideForCompare?: boolean },
    initials?: { key: string; label: string },
    variableNameSuffix: string = '',
) => {
    const keyPrefix = initials ? `${initials.key}-` : '';
    const keySuffix = variableNameSuffix ? `-${variableNameSuffix}` : '';
    const labelPrefix = initials ? `${initials.label}.` : '';
    let type: string = 'text';

    if (value.type !== 'string') {
        type = value.type;
    } else if (value.format === 'date') {
        type = 'date';
    } else if (value.format === 'date-time') {
        type = 'datetime';
    } else if (value.format === 'user') {
        type = 'user';
    }

    // skip unsupported formats
    if (value.format === 'signature' || value.format === 'comment') {
        return;
    }

    const fieldKey = `${keyPrefix}${entityTemplate._id}${keySuffix}-${key}`;
    const label = `${labelPrefix}${entityTemplate.name}${variableNameSuffix}.${key}`;

    fieldEntries.push([
        fieldKey,
        {
            type,
            valueSources: type === 'user' ? [] : ['field', 'value', 'func'],
            label,
            ...options,
        },
    ]);

    if (type === 'datetime') {
        fieldEntries.push([
            `${fieldKey}-ignoreHour`,
            {
                type: 'date',
                valueSources: ['field', 'value', 'func'],
                label: `${label} (ignore hour)`,
                ...options,
            },
        ]);
    }
};

const entityTemplateToFieldsConfig = (
    entityTemplate: IMongoEntityTemplatePopulated,
    entityTemplates: IEntityTemplateMap,
    options: { hideForCompare?: boolean },
    initials?: { key: string; label: string },
    variableNameSuffix: string = '',
) => {
    const fieldEntries: [string, Field][] = [];
    Object.entries(addDefaultFieldsToTemplate(entityTemplate).properties.properties).forEach(([key, value]) => {
        if (value.format === 'relationshipReference' && value.relationshipReference) {
            const relTemplateId = value.relationshipReference!.relatedTemplateId;
            const relTemplateKey = value.relationshipReference?.relatedTemplateField;
            const refTemplate = entityTemplates.get(relTemplateId)!;
            const relProperty = refTemplate?.properties.properties[relTemplateKey];

            formatField(key, relProperty, entityTemplate, fieldEntries, options, initials, variableNameSuffix);
        } else {
            formatField(key, value, entityTemplate, fieldEntries, options, initials, variableNameSuffix);
        }
    });

    return Object.fromEntries(fieldEntries);
};

const getRelationshipFieldsConfigOfRule = (
    entityTemplate: IMongoEntityTemplatePopulated,
    entityTemplates: IEntityTemplateMap,
    connectedTemplatesWithRelationship: {
        relationshipTemplate: IMongoRelationshipTemplatePopulated;
        otherEntityTemplate: IMongoEntityTemplatePopulated;
    }[],
    aggregationsContext: { existingAggregationVariables: Required<IVariable>[]; existingFieldsInUpperScopes: Record<string, Field> },
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
                entityTemplates,
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
                      entityTemplates,
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

const getTodayFuncVariables = (actionOnFail: ActionOnFail) => {
    // getToday() function is shown as variable. in order to be allowed in lhs of equations (https://github.com/ukrbublik/react-awesome-query-builder/issues/287)
    // dont allow getToday() to use in relationshipfields (in aggregation functions).
    // because rule will run every night on all entities of template, so to allow DB indexes to optimize query (of search failed entities)
    // DB indexes optimization for rule w/ getToday not yet implemented, but to have the option in the future
    if (actionOnFail === ActionOnFail.ENFORCEMENT) return {};

    return { [formulaGetTodayVarName]: { type: 'date', label: 'TODAY( )', tooltip: i18next.t('wizard.rule.todayVariableInfo') } };
};

export const getFieldsConfigOfRule = (
    entityTemplateId: string,
    entityTemplates: IEntityTemplateMap,
    relationshipTemplates: IRelationshipTemplateMap,
    formula: ImmutableTree,
    actionOnFail: ActionOnFail,
    currentUser: ICurrentUser,
): Fields => {
    const allowedEntityTemplates = getAllAllowedEntities(Array.from(entityTemplates.values()), currentUser);
    const entityTemplate = allowedEntityTemplates.find((entity) => entity._id === entityTemplateId);
    if (!entityTemplate) throw new Error('entity template doesnt exist');

    const allowedEntityTemplatesIds: string[] = allowedEntityTemplates.map((entity) => entity._id);
    const allowedRelationships = getAllAllowedRelationships(Array.from(relationshipTemplates.values()), allowedEntityTemplatesIds);

    const fieldsOfEntityTemplate = entityTemplateToFieldsConfig(entityTemplate, entityTemplates, {});

    const connectedTemplatesWithRelationship = allowedRelationships
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
        entityTemplates,
        connectedTemplatesWithRelationship,
        { existingAggregationVariables: [], existingFieldsInUpperScopes: fieldsOfEntityTemplate },
        existingAggregationVariablesInTree,
    );

    return {
        ...fieldsOfEntityTemplate,
        ...relationshipFields,
        ...getTodayFuncVariables(actionOnFail),
    };
};

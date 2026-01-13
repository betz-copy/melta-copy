import {
    BadRequestError,
    childTemplateKeys,
    dePopulateChildProperties,
    IConstraintsOfTemplate,
    IEntitySingleProperty,
    IMongoEntityTemplatePopulated,
    IMongoRule,
    IRelationship,
    PropertyFormat,
    PropertyType,
    ServiceError,
} from '@microservices/shared';
import { StatusCodes } from 'http-status-codes';
import _, { cloneDeep } from 'lodash';
import config from '../../config';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';

const { relationshipTemplateHasRules, moreThenOneRelationshipInstanceExist } = config.errorCodes;

const validateRequiredConstraints = (requiredConstraints: IConstraintsOfTemplate['requiredConstraints']) => {
    if (!requiredConstraints.length) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, 'There are no required fields for the destination entity');
    }
};

const validateUniqueRelationships = (existingRelationships: IRelationship[], addFieldToSrcEntity: boolean) => {
    const relationshipsEntityIdsMap = new Set<string>();

    existingRelationships.forEach((relationship) => {
        const entityId = addFieldToSrcEntity ? relationship.sourceEntityId : relationship.destinationEntityId;
        if (relationshipsEntityIdsMap.has(entityId)) {
            throw new BadRequestError('Some entities have more than one relationship', {
                errorCode: moreThenOneRelationshipInstanceExist,
            });
        }
        relationshipsEntityIdsMap.add(entityId);
    });
};

const validateNoDependentRules = (rules: IMongoRule[]) => {
    if (rules.length) {
        throw new BadRequestError('There are rules attached to this relationship', {
            errorCode: relationshipTemplateHasRules,
        });
    }
};

const buildNewRelationshipField = (
    displayFieldName: string,
    relationshipTemplateId: string,
    relationshipTemplateDirection: 'outgoing' | 'incoming',
    relatedTemplateId: string,
    relatedTemplateField: string,
): IEntitySingleProperty => {
    return {
        title: displayFieldName,
        type: PropertyType.string,
        format: PropertyFormat.relationshipReference,
        relationshipReference: {
            relationshipTemplateId,
            relationshipTemplateDirection,
            relatedTemplateId,
            relatedTemplateField,
        },
    };
};

const getRelatedTemplateIds = (template: IMongoEntityTemplatePopulated) => {
    const templateIds: string[] = [];
    Object.values(template.properties.properties).forEach(({ relationshipReference }) => {
        if (relationshipReference) templateIds.push(relationshipReference.relatedTemplateId);
    });

    return templateIds;
};

const updateChildTemplatesOnParentUpdate = async (
    entityTemplateService: EntityTemplateService,
    parentId: string,
    removedProperties: string[],
    newRequired: string[],
    oldRequired: string[],
) => {
    const childTemplates = await entityTemplateService.searchChildTemplates({ parentTemplatesIds: [parentId] });

    return Promise.all(
        childTemplates.flatMap((childTemplate) => {
            let hasChildChanged = false;
            const { properties: childProperties, parentTemplate, category, ...restOfChildTemplate } = childTemplate;

            if (removedProperties.some((removedPropertyKey) => Object.keys(childProperties.properties).includes(removedPropertyKey))) {
                hasChildChanged = true;

                removedProperties.forEach((removedPropertyKey) => delete childProperties.properties[removedPropertyKey]);
            }

            const requiredDiff = _.xor(newRequired, oldRequired);

            if (requiredDiff.length > 0 || hasChildChanged) {
                const newProps = {};
                requiredDiff.forEach((prop) => {
                    if (newRequired.includes(prop)) {
                        newProps[prop] = {
                            display: true,
                        };
                    } else {
                        delete childProperties.properties[prop];
                    }
                });

                const { filterByCurrentUserField, filterByUnitUserField, ...newChildTemplate } = _.pick(
                    {
                        parentTemplateId: parentTemplate._id,
                        category: category._id,
                        properties: {
                            properties: cloneDeep({
                                ...dePopulateChildProperties(childProperties.properties),
                                ...newProps,
                            }),
                        },
                        ...restOfChildTemplate,
                    },
                    childTemplateKeys,
                );

                return entityTemplateService.updateChildTemplate(childTemplate._id, {
                    ...newChildTemplate,
                    filterByCurrentUserField: filterByCurrentUserField || undefined,
                    filterByUnitUserField: filterByUnitUserField || undefined,
                });
            }

            return [];
        }),
    );
};

export {
    buildNewRelationshipField,
    getRelatedTemplateIds,
    validateNoDependentRules,
    validateRequiredConstraints,
    validateUniqueRelationships,
    updateChildTemplatesOnParentUpdate,
};

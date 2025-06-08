import { StatusCodes } from 'http-status-codes';
import { IConstraintsOfTemplate, ServiceError, IRelationship, BadRequestError, IMongoRule, IEntitySingleProperty } from '@microservices/shared';
import config from '../../config';

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
        type: 'string',
        format: 'relationshipReference',
        relationshipReference: {
            relationshipTemplateId,
            relationshipTemplateDirection,
            relatedTemplateId,
            relatedTemplateField,
        },
    };
};

export { validateNoDependentRules, validateRequiredConstraints, validateUniqueRelationships, buildNewRelationshipField };
